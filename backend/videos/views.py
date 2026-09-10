from django.db.models import F, Q
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.serializers import UserSerializer

from .models import PatientPrescription, Video
from .serializers import (
    PrescribeSerializer,
    PrescriptionCompleteSerializer,
    PrescriptionSerializer,
    VideoSerializer,
    VideoWriteSerializer,
)


class VideoListView(generics.ListAPIView):
    """Public video library with filters: body_part, injury_type, search."""

    permission_classes = [permissions.AllowAny]
    serializer_class = VideoSerializer

    def get_queryset(self):
        qs = Video.objects.filter(is_public=True).select_related("uploaded_by")
        body_part = self.request.query_params.get("body_part")
        injury_type = self.request.query_params.get("injury_type")
        search = self.request.query_params.get("search")
        if body_part:
            qs = qs.filter(body_part=body_part)
        if injury_type:
            qs = qs.filter(injury_type=injury_type)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        return qs


class VideoDetailView(generics.RetrieveAPIView):
    """Video detail; increments the view counter on each fetch."""

    permission_classes = [permissions.AllowAny]
    serializer_class = VideoSerializer
    queryset = Video.objects.filter(is_public=True).select_related("uploaded_by")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Video.objects.filter(pk=instance.pk).update(view_count=F("view_count") + 1)
        instance.refresh_from_db(fields=["view_count"])
        return Response(self.get_serializer(instance).data)


class VideoCreateView(generics.CreateAPIView):
    """Create a video (admin or doctor only)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = VideoWriteSerializer

    def perform_create(self, serializer):
        if not (self.request.user.is_admin_user or self.request.user.role == "doctor"):
            self.permission_denied(self.request)
        serializer.save(uploaded_by=self.request.user)


class MyVideosView(APIView):
    """Videos prescribed to the authenticated patient, with progress."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        prescriptions = (
            PatientPrescription.objects.filter(patient=request.user)
            .select_related("video", "doctor")
            .order_by("-assigned_date")
        )
        total = prescriptions.count()
        done = prescriptions.filter(is_done=True).count()
        return Response(
            {
                "progress_percent": round(done / total * 100) if total else 0,
                "total": total,
                "done": done,
                "items": PrescriptionSerializer(prescriptions, many=True).data,
            }
        )


class CompleteVideoView(APIView):
    """Patient marks a prescribed video as done."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=PrescriptionCompleteSerializer, responses=PrescriptionSerializer)
    def post(self, request, pk):
        from django.utils import timezone

        prescription = PatientPrescription.objects.filter(pk=pk, patient=request.user).first()
        if prescription is None:
            return Response({"detail": "تجویز یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        serializer = PrescriptionCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prescription.is_done = True
        prescription.done_date = timezone.now()
        prescription.progress_note = serializer.validated_data.get("progress_note", "")
        prescription.save()
        return Response(PrescriptionSerializer(prescription).data)


class PrescribeVideosView(APIView):
    """Doctor prescribes one or more videos to a patient."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=PrescribeSerializer, responses=PrescriptionSerializer(many=True))
    def post(self, request):
        serializer = PrescribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        patient = User.objects.filter(pk=data["patient_id"], role=User.Role.PATIENT).first()
        if patient is None:
            return Response({"detail": "بیمار یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        videos = Video.objects.filter(pk__in=data["video_ids"])
        if videos.count() != len(data["video_ids"]):
            return Response({"detail": "یکی از فیلم‌ها یافت نشد"}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for video in videos:
            prescription, was_created = PatientPrescription.objects.get_or_create(
                patient=patient,
                video=video,
                doctor=request.user,
                defaults={"due_date": data["due_date"]},
            )
            created.append(prescription)
        return Response(PrescriptionSerializer(created, many=True).data, status=status.HTTP_201_CREATED)


class MyPatientsView(generics.ListAPIView):
    """Patients of the authenticated doctor (distinct, for prescription UI)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        patient_ids = (
            PatientPrescription.objects.filter(doctor=self.request.user)
            .values_list("patient_id", flat=True)
            .distinct()
        )
        from appointments.models import Appointment

        appointments = Appointment.objects.filter(
            doctor=self.request.user, status="completed"
        )
        ids = set(patient_ids) | set(appointments.values_list("patient_id", flat=True))
        return User.objects.filter(pk__in=ids, role=User.Role.PATIENT).order_by("full_name")