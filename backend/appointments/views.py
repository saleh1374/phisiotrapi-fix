import datetime

from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.throttles import BookingThrottle

from . import services
from .models import Appointment
from .serializers import (
    AppointmentSerializer,
    AppointmentStatusSerializer,
    AvailableDaySerializer,
    BookAppointmentSerializer,
    DoctorDetailSerializer,
    DoctorListSerializer,
    SlotSerializer,
)


class DoctorListView(generics.ListAPIView):
    """Public list of doctors (for the booking flow)."""

    permission_classes = [permissions.AllowAny]
    serializer_class = DoctorListSerializer
    queryset = (
        User.objects.filter(role=User.Role.DOCTOR, is_active=True)
        .prefetch_related("schedules")
        .order_by("full_name")
    )


class DoctorDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = DoctorDetailSerializer
    queryset = User.objects.filter(role=User.Role.DOCTOR, is_active=True).prefetch_related("schedules")


class AvailableDaysView(APIView):
    """Days with free slots in the next 30 days (for the Jalali calendar)."""

    permission_classes = [permissions.AllowAny]

    @extend_schema(responses=AvailableDaySerializer(many=True))
    def get(self, request, doctor_id):
        days = services.available_days(doctor_id)
        return Response(AvailableDaySerializer(days, many=True).data)


class SlotsView(APIView):
    """Free time slots for a doctor on a specific date."""

    permission_classes = [permissions.AllowAny]

    @extend_schema(responses=SlotSerializer(many=True))
    def get(self, request, doctor_id):
        date_str = request.query_params.get("date")
        try:
            date = datetime.date.fromisoformat(date_str) if date_str else None
        except ValueError:
            return Response({"detail": "تاریخ نامعتبر است"}, status=status.HTTP_400_BAD_REQUEST)
        slots = services.free_slots(doctor_id, date)
        return Response(SlotSerializer(slots, many=True).data)


class BookAppointmentView(APIView):
    """Create a booking — concurrency-safe (see services.book_appointment)."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [BookingThrottle]

    @extend_schema(request=BookAppointmentSerializer, responses=AppointmentSerializer)
    def post(self, request):
        serializer = BookAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            appointment = services.book_appointment(
                patient_id=request.user.id,
                doctor_id=data["doctor_id"],
                service_type=data["service_type"],
                date=data["appointment_date"],
                start_time=data["start_time"],
                description=data.get("description", ""),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)


class MyAppointmentsView(generics.ListAPIView):
    """The patient's own appointments (future and history)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        return (
            Appointment.objects.filter(patient=self.request.user)
            .select_related("doctor", "patient")
            .order_by("-appointment_date", "-start_time")
        )


class CancelAppointmentView(APIView):
    """Patient cancels their own upcoming appointment."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        appointment = Appointment.objects.filter(pk=pk, patient=request.user).first()
        if appointment is None:
            return Response({"detail": "نوبت یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        if appointment.appointment_date < datetime.date.today():
            return Response({"detail": "نوبت گذشته قابل لغو نیست"}, status=status.HTTP_400_BAD_REQUEST)
        if appointment.status not in (Appointment.Status.PENDING, Appointment.Status.CONFIRMED):
            return Response({"detail": "وضعیت نوبت اجازه لغو نمی‌دهد"}, status=status.HTTP_400_BAD_REQUEST)

        appointment.status = Appointment.Status.CANCELED_PATIENT
        appointment.save(update_fields=["status"])
        return Response(AppointmentSerializer(appointment).data)


class DoctorAppointmentsView(generics.ListAPIView):
    """Appointments for the authenticated doctor (today, tomorrow or all)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        qs = (
            Appointment.objects.filter(doctor=self.request.user)
            .select_related("doctor", "patient")
            .order_by("appointment_date", "start_time")
        )
        scope = self.request.query_params.get("scope", "today")
        today = datetime.date.today()
        if scope == "today":
            qs = qs.filter(appointment_date=today)
        elif scope == "tomorrow":
            qs = qs.filter(appointment_date=today + datetime.timedelta(days=1))
        elif scope == "history":
            qs = qs.filter(appointment_date__lt=today, status=Appointment.Status.COMPLETED)
        return qs


class UpdateAppointmentStatusView(APIView):
    """Doctor marks an appointment completed / no-show / canceled."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=AppointmentStatusSerializer, responses=AppointmentSerializer)
    def patch(self, request, pk):
        appointment = Appointment.objects.filter(pk=pk, doctor=request.user).first()
        if appointment is None:
            return Response({"detail": "نوبت یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        serializer = AppointmentStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment.status = serializer.validated_data["status"]
        appointment.save(update_fields=["status"])
        return Response(AppointmentSerializer(appointment).data)