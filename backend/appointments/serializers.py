from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserSerializer

from .models import Appointment, DoctorSchedule, Holiday


class DoctorListSerializer(serializers.ModelSerializer):
    """Compact doctor representation for the booking flow."""

    class Meta:
        model = User
        fields = ["id", "full_name", "specialty", "medical_license_number", "bio", "profile_pic"]


class DoctorDetailSerializer(DoctorListSerializer):
    """Doctor plus their weekly schedule."""

    schedules = serializers.SerializerMethodField()

    class Meta(DoctorListSerializer.Meta):
        fields = DoctorListSerializer.Meta.fields + ["schedules"]

    def get_schedules(self, obj):
        return [
            {
                "day_of_week": s.day_of_week,
                "start_work": s.start_work.strftime("%H:%M"),
                "end_work": s.end_work.strftime("%H:%M"),
                "session_duration": s.session_duration,
            }
            for s in obj.schedules.all()
        ]


class AvailableDaySerializer(serializers.Serializer):
    date = serializers.DateField()
    free_slots = serializers.IntegerField()


class SlotSerializer(serializers.Serializer):
    start = serializers.CharField()
    end = serializers.CharField()


class AppointmentSerializer(serializers.ModelSerializer):
    doctor = DoctorListSerializer(read_only=True)
    patient = UserSerializer(read_only=True)
    service_type_display = serializers.CharField(source="get_service_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    date_display = serializers.SerializerMethodField()
    # Compact HH:MM instead of the default HH:MM:SS.
    start_time = serializers.TimeField(format="%H:%M")
    end_time = serializers.TimeField(format="%H:%M")

    class Meta:
        model = Appointment
        fields = [
            "id",
            "doctor",
            "patient",
            "service_type",
            "service_type_display",
            "appointment_date",
            "date_display",
            "start_time",
            "end_time",
            "status",
            "status_display",
            "description",
            "created_at",
        ]
        read_only_fields = fields

    def get_date_display(self, obj):
        # Jalali date for the frontend (rendered client-side with Intl).
        return obj.appointment_date.isoformat()


class BookAppointmentSerializer(serializers.Serializer):
    doctor_id = serializers.UUIDField()
    service_type = serializers.ChoiceField(choices=Appointment.ServiceType.choices)
    appointment_date = serializers.DateField()
    start_time = serializers.RegexField(r"^\d{2}:\d{2}$")
    description = serializers.CharField(required=False, allow_blank=True)


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSchedule
        fields = ["id", "doctor", "day_of_week", "start_work", "end_work", "break_start", "break_end", "session_duration"]
        extra_kwargs = {"doctor": {"required": False}}


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ["id", "doctor", "date", "reason"]


class AppointmentStatusSerializer(serializers.Serializer):
    """All statuses a doctor or admin may set from the panels."""

    status = serializers.ChoiceField(
        choices=[
            Appointment.Status.PENDING,
            Appointment.Status.CONFIRMED,
            Appointment.Status.COMPLETED,
            Appointment.Status.NO_SHOW,
            Appointment.Status.CANCELED_ADMIN,
        ]
    )