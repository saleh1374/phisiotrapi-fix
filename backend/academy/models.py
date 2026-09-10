import uuid

from django.conf import settings
from django.db import models


class Course(models.Model):
    class Level(models.TextChoices):
        BEGINNER = "مقدماتی", "مقدماتی"
        ADVANCED = "پیشرفته", "پیشرفته"
        EXPERT = "تخصصی", "تخصصی"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField("عنوان", max_length=255)
    description = models.TextField("توضیحات", blank=True)
    price = models.BigIntegerField("قیمت (تومان)", default=0)
    discount_price = models.BigIntegerField("قیمت با تخفیف", null=True, blank=True)
    cover_image = models.URLField("تصویر جلد", max_length=500, blank=True)
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BEGINNER)
    total_hours = models.DecimalField("مجموع ساعت", max_digits=4, decimal_places=1, default=0)
    is_free = models.BooleanField("رایگان", default=False)
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="courses_taught"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "دوره"
        verbose_name_plural = "دوره‌ها"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["level", "is_free"])]

    def __str__(self):
        return self.title

    @property
    def final_price(self) -> int:
        return self.discount_price if self.discount_price else self.price


class CourseChapter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="chapters")
    chapter_title = models.CharField("عنوان سرفصل", max_length=255)
    video_url = models.URLField("آدرس ویدیو", max_length=500, blank=True)
    pdf_attachment = models.URLField("فایل پیوست", max_length=500, blank=True)
    duration_minutes = models.PositiveSmallIntegerField("مدت (دقیقه)", default=10)
    sort_order = models.PositiveSmallIntegerField("ترتیب", default=0)

    class Meta:
        verbose_name = "سرفصل"
        verbose_name_plural = "سرفصل‌ها"
        ordering = ["sort_order"]
        indexes = [models.Index(fields=["course", "sort_order"])]

    def __str__(self):
        return f"{self.course.title} - {self.chapter_title}"


class Order(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "در انتظار پرداخت"
        PAID = "paid", "پرداخت شده"
        FAILED = "failed", "ناموفق"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="orders")
    transaction_code = models.CharField("کد پیگیری", max_length=100, blank=True)
    amount_paid = models.BigIntegerField("مبلغ پرداختی", default=0)
    payment_status = models.CharField(max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    discount_code = models.CharField("کد تخفیف", max_length=50, blank=True)
    purchase_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "سفارش"
        verbose_name_plural = "سفارش‌ها"
        ordering = ["-purchase_date"]
        indexes = [models.Index(fields=["user", "payment_status"])]
        constraints = [models.UniqueConstraint(fields=["user", "course"], condition=models.Q(payment_status="paid"), name="uniq_paid_course")]

    def __str__(self):
        return f"{self.user} - {self.course}"


class CourseProgress(models.Model):
    """A user's completed chapter within a course."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="course_progress")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="progress_records")
    chapter = models.ForeignKey(CourseChapter, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "پیشرفت دوره"
        verbose_name_plural = "پیشرفت دوره‌ها"
        constraints = [models.UniqueConstraint(fields=["user", "chapter"], name="uniq_chapter_progress")]

    def __str__(self):
        return f"{self.user} - {self.chapter}"


class Certificate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="certificates")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="certificates")
    certificate_number = models.CharField("شماره گواهی", max_length=50, unique=True)
    qr_code_hash = models.CharField("هش QR", max_length=255)
    issue_date = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name = "گواهی‌نامه"
        verbose_name_plural = "گواهی‌نامه‌ها"
        indexes = [models.Index(fields=["certificate_number"])]
        constraints = [models.UniqueConstraint(fields=["user", "course"], name="uniq_certificate")]

    def __str__(self):
        return f"{self.certificate_number} - {self.user}"