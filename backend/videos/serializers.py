from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import PatientPrescription, Video


class VideoSerializer(serializers.ModelSerializer):
    body_part_display = serializers.CharField(source="get_body_part_display", read_only=True)
    injury_type_display = serializers.CharField(source="get_injury_type_display", read_only=True)
    uploaded_by_name = serializers.CharField(source="uploaded_by.full_name", read_only=True, default="")

    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "description",
            "video_url",
            "thumbnail",
            "body_part",
            "body_part_display",
            "injury_type",
            "injury_type_display",
            "is_public",
            "view_count",
            "duration_minutes",
            "uploaded_by_name",
            "created_at",
        ]
        read_only_fields = ["view_count", "created_at"]


class VideoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ["title", "description", "video_url", "thumbnail", "body_part", "injury_type", "is_public", "duration_minutes"]


class PrescribeSerializer(serializers.Serializer):
    patient_id = serializers.UUIDField()
    video_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)
    due_date = serializers.DateField()


class PrescriptionSerializer(serializers.ModelSerializer):
    video = VideoSerializer(read_only=True)
    doctor_name = serializers.CharField(source="doctor.full_name", read_only=True)
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = PatientPrescription
        fields = [
            "id",
            "video",
            "doctor_name",
            "assigned_date",
            "due_date",
            "is_done",
            "done_date",
            "progress_note",
            "status_display",
        ]

    def get_status_display(self, obj):
        from django.utils import timezone

        if obj.is_done:
            return "انجام شده"
        if obj.due_date < timezone.localdate():
            return "دیر شده"
        return "در انتظار"


class PrescriptionCompleteSerializer(serializers.Serializer):
    progress_note = serializers.CharField(required=False, allow_blank=True)