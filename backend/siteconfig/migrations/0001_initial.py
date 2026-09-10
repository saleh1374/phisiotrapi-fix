from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="SiteSetting",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("site_name", models.CharField(default="کلینیک فیزیوتراپی", max_length=100, verbose_name="نام سایت")),
                ("site_tagline", models.CharField(default="رزرو نوبت، فیلم آموزشی و آکادمی تخصصی", max_length=200, verbose_name="شعار")),
                ("site_description", models.TextField(blank=True, verbose_name="توضیحات سایت")),
                ("announcement", models.CharField(blank=True, max_length=300, verbose_name="اعلان سراسری (بنر بالای سایت)")),
                ("contact_phone", models.CharField(blank=True, default="۰۲۱-۸۸۷۷۶۶۵۵", max_length=30, verbose_name="تلفن تماس")),
                ("contact_email", models.EmailField(blank=True, default="info@physioclinic.ir", max_length=254, verbose_name="ایمیل تماس")),
                ("address", models.CharField(blank=True, default="تهران، خیابان آزادی، پلاک ۱۲۳", max_length=200, verbose_name="آدرس")),
                ("working_hours", models.CharField(blank=True, default="شنبه تا پنجشنبه ۹ تا ۲۰", max_length=100, verbose_name="ساعات کاری")),
                ("otp_backend", models.CharField(choices=[("console", "چاپ در کنسول (توسعه)"), ("email", "ارسال با ایمیل (SMTP)")], default="console", max_length=10, verbose_name="روش ارسال کد تایید")),
                ("smtp_host", models.CharField(blank=True, max_length=200, verbose_name="SMTP هاست")),
                ("smtp_port", models.PositiveIntegerField(default=587, verbose_name="SMTP پورت")),
                ("smtp_user", models.CharField(blank=True, max_length=200, verbose_name="SMTP نام کاربری (ایمیل)")),
                ("smtp_password", models.CharField(blank=True, max_length=200, verbose_name="SMTP رمز (App Password)")),
                ("smtp_use_tls", models.BooleanField(default=True, verbose_name="استفاده از TLS")),
                ("email_from", models.EmailField(blank=True, max_length=254, verbose_name="فرستنده (From)")),
                ("google_client_id", models.CharField(blank=True, max_length=200, verbose_name="Google Client ID")),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"verbose_name": "تنظیمات سایت", "verbose_name_plural": "تنظیمات سایت"},
        ),
    ]