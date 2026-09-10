import uuid

from django.conf import settings
from django.db import models


class Video(models.Model):
    class BodyPart(models.TextChoices):
        BACK = "کمر", "کمر"
        NECK = "گردن", "گردن"
        KNEE = "زانو", "زانو"
        SHOULDER = "شانه", "شانه"
        ANKLE = "مچ پا", "مچ پا"
        PELVIS = "لگن", "لگن"

    class InjuryType(models.TextChoices):
        DISC = "دیسک", "دیسک"
        ARTHROSIS = "آرتروز", "آرتروز"
        STRAIN = "کشیدگی", "کشیدگی"
        FRACTURE = "شکستگی", "شکستگی"
        POST_SURGERY = "بعد از جراحی", "بعد از جراحی"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField("عنوان", max_length=255)
    description = models.TextField("توضیحات", blank=True)
    video_url = models.URLField("آدرس فیلم", max_length=500)
    thumbnail = models.URLField("تصویر بندانگشتی", max_length=500, blank=True)
    body_part = models.CharField(max_length=20, choices=BodyPart.choices)
    injury_type = models.CharField(max_length=20, choices=InjuryType.choices)
    is_public = models.BooleanField("عمومی", default=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="uploaded_videos")
    view_count = models.PositiveIntegerField("تعداد بازدید", default=0)
    duration_minutes = models.PositiveSmallIntegerField("مدت (دقیقه)", default=5)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "فیلم آموزشی"
        verbose_name_plural = "فیلم‌های آموزشی"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["body_part", "injury_type"])]

    def __str__(self):
        return self.title


class PatientPrescription(models.Model):
    """A video prescribed by a doctor to a patient."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="prescriptions")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="prescriptions")
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="prescribed_videos")
    assigned_date = models.DateField(auto_now_add=True)
    due_date = models.DateField("سررسید")
    is_done = models.BooleanField("انجام شده", default=False)
    done_date = models.DateTimeField(null=True, blank=True)
    progress_note = models.TextField("یادداشت بیمار", blank=True)

    class Meta:
        verbose_name = "تجویز فیلم"
        verbose_name_plural = "تجویز فیلم‌ها"
        ordering = ["-assigned_date"]
        indexes = [models.Index(fields=["patient", "video"])]
        constraints = [models.UniqueConstraint(fields=["patient", "video", "doctor"], name="uniq_prescription")]

    def __str__(self):
        return f"{self.patient} ← {self.video}"