import uuid

from django.conf import settings
from django.db import models


class DoctorSchedule(models.Model):
    """Weekly working schedule of a doctor."""

    # Spec: 0 = Saturday … 6 = Friday.
    DAY_CHOICES = [(i, ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"][i]) for i in range(7)]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="schedules", limit_choices_to={"role": "doctor"}
    )
    day_of_week = models.SmallIntegerField(choices=DAY_CHOICES)
    start_work = models.TimeField("شروع کار")
    end_work = models.TimeField("پایان کار")
    break_start = models.TimeField("شروع استراحت", null=True, blank=True)
    break_end = models.TimeField("پایان استراحت", null=True, blank=True)
    session_duration = models.SmallIntegerField("مدت هر نوبت (دقیقه)", choices=[(15, 15), (30, 30)], default=30)

    class Meta:
        verbose_name = "شیفت پزشک"
        verbose_name_plural = "شیفت‌های پزشکان"
        indexes = [models.Index(fields=["doctor", "day_of_week"])]
        constraints = [
            models.UniqueConstraint(fields=["doctor", "day_of_week"], name="uniq_doctor_day"),
        ]

    def __str__(self):
        return f"{self.doctor} - {self.get_day_of_week_display()}"


class Holiday(models.Model):
    """A day off — general (doctor=None) or doctor-specific."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="holidays"
    )
    date = models.DateField()
    reason = models.CharField("دلیل", max_length=255, blank=True)

    class Meta:
        verbose_name = "تعطیلی"
        verbose_name_plural = "تعطیلات"
        indexes = [models.Index(fields=["doctor", "date"])]
        constraints = [
            models.UniqueConstraint(fields=["doctor", "date"], name="uniq_holiday"),
            models.UniqueConstraint(fields=["date"], condition=models.Q(doctor__isnull=True), name="uniq_general_holiday"),
        ]

    def __str__(self):
        return f"{self.date} - {self.doctor or 'عمومی'}"


class Appointment(models.Model):
    class ServiceType(models.TextChoices):
        LASER = "لیزر", "لیزر"
        TECAR = "تکار", "تکار"
        ACUPUNCTURE = "طب سوزنی", "طب سوزنی"
        EXERCISE = "ورزش درمانی", "ورزش درمانی"
        EXAM = "معاینه عمومی", "معاینه عمومی"

    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار"
        CONFIRMED = "confirmed", "تایید شده"
        COMPLETED = "completed", "انجام شده"
        CANCELED_PATIENT = "canceled_by_patient", "لغو توسط بیمار"
        CANCELED_ADMIN = "canceled_by_admin", "لغو توسط مدیریت"
        NO_SHOW = "no_show", "عدم حضور"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="appointments")
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="doctor_appointments")
    service_type = models.CharField(max_length=30, choices=ServiceType.choices)
    appointment_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    description = models.TextField("توضیحات", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "نوبت"
        verbose_name_plural = "نوبت‌ها"
        ordering = ["appointment_date", "start_time"]
        indexes = [
            models.Index(fields=["doctor", "appointment_date", "start_time"]),
            models.Index(fields=["patient", "status"]),
        ]
        constraints = [
            # Backstop against double booking at DB level.
            models.UniqueConstraint(
                fields=["doctor", "appointment_date", "start_time"],
                condition=models.Q(status__in=["pending", "confirmed"]),
                name="uniq_active_slot",
            ),
        ]

    def __str__(self):
        return f"{self.patient} - {self.doctor} - {self.appointment_date} {self.start_time}"