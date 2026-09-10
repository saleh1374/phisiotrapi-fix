"""Singleton site settings — editable from the custom admin panel."""
from django.db import models


class SiteSetting(models.Model):
    """One row (pk=1) holding every site-level setting."""

    class OTPBackend(models.TextChoices):
        CONSOLE = "console", "چاپ در کنسول (توسعه)"
        EMAIL = "email", "ارسال با ایمیل (SMTP)"

    # Identity
    site_name = models.CharField("نام سایت", max_length=100, default="کلینیک فیزیوتراپی")
    site_tagline = models.CharField(
        "شعار", max_length=200, default="رزرو نوبت، فیلم آموزشی و آکادمی تخصصی"
    )
    site_description = models.TextField("توضیحات سایت", blank=True)
    announcement = models.CharField("اعلان سراسری (بنر بالای سایت)", max_length=300, blank=True)

    # Contact
    contact_phone = models.CharField("تلفن تماس", max_length=30, blank=True, default="۰۲۱-۸۸۷۷۶۶۵۵")
    contact_email = models.EmailField("ایمیل تماس", blank=True, default="info@physioclinic.ir")
    address = models.CharField("آدرس", max_length=200, blank=True, default="تهران، خیابان آزادی، پلاک ۱۲۳")
    working_hours = models.CharField("ساعات کاری", max_length=100, blank=True, default="شنبه تا پنجشنبه ۹ تا ۲۰")

    # OTP delivery (ورود با کد)
    otp_backend = models.CharField(
        "روش ارسال کد تایید",
        max_length=10,
        choices=OTPBackend.choices,
        default=OTPBackend.CONSOLE,
    )

    # SMTP — used when otp_backend == email (e.g. a Gmail account)
    smtp_host = models.CharField("SMTP هاست", max_length=200, blank=True)
    smtp_port = models.PositiveIntegerField("SMTP پورت", default=587)
    smtp_user = models.CharField("SMTP نام کاربری (ایمیل)", max_length=200, blank=True)
    smtp_password = models.CharField("SMTP رمز (App Password)", max_length=200, blank=True)
    smtp_use_tls = models.BooleanField("استفاده از TLS", default=True)
    email_from = models.EmailField("فرستنده (From)", blank=True)

    # Google sign-in
    google_client_id = models.CharField("Google Client ID", max_length=200, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "تنظیمات سایت"
        verbose_name_plural = "تنظیمات سایت"

    def __str__(self):
        return self.site_name

    @classmethod
    def get(cls) -> "SiteSetting":
        """Singleton accessor."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


def get_site_settings() -> SiteSetting:
    return SiteSetting.get()