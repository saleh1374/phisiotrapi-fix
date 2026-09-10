"""
Seed the database with demo data for every module:

  - admin / doctor / patient users
  - weekly schedules + holidays for the doctor
  - sample educational videos
  - sample academy courses with chapters
  - sample magazine articles (already published)

Usage:
    python manage.py seed_demo
"""
import datetime

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from academy.models import Course, CourseChapter
from appointments.models import DoctorSchedule, Holiday
from news.models import NewsFeed
from videos.models import Video

VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"


class Command(BaseCommand):
    help = "Seed demo data for all modules."

    def _ensure_username(self, user, username: str):
        """Give a demo user a readable username (keep existing custom ones)."""
        if user.username != username:
            user.username = username
            user.save(update_fields=["username"])

    @transaction.atomic
    def handle(self, *args, **options):
        # ---------------------------------------------------------- users
        admin, created_admin = User.objects.get_or_create(
            phone_number="09120000000",
            defaults={
                "username": "admin",
                "full_name": "مدیر کلینیک",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )
        self._ensure_username(admin, "admin")
        if created_admin or not admin.password or not admin.has_usable_password():
            admin.set_password("admin123")
            admin.save()
            self.stdout.write(self.style.SUCCESS("✓ ادمین (admin / admin123)"))

        doctor, created_doctor = User.objects.get_or_create(
            phone_number="09120000001",
            defaults={
                "username": "dr.sara",
                "full_name": "دکتر سارا محمدی",
                "role": User.Role.DOCTOR,
                "specialty": "فیزیوتراپی ورزشی",
                "medical_license_number": "12345",
                "bio": "متخصص توانبخشی و فیزیوتراپی ورزشی با بیش از ۱۰ سال سابقه؛ عضو انجمن جهانی فیزیوتراپی (WCPT).",
                "is_active": True,
            },
        )
        self._ensure_username(doctor, "dr.sara")
        if created_doctor or not doctor.password or not doctor.has_usable_password():
            doctor.set_password("demo1234")
            doctor.save()
            self.stdout.write(self.style.SUCCESS("✓ پزشک (dr.sara / demo1234)"))

        doctor2, created_doctor2 = User.objects.get_or_create(
            phone_number="09120000003",
            defaults={
                "username": "dr.amir",
                "full_name": "دکتر امیر کریمی",
                "role": User.Role.DOCTOR,
                "specialty": "توانبخشی عصبی",
                "medical_license_number": "54321",
                "bio": "متخصص توانبخشی بیماران عصبی-عضلانی و سکته مغزی.",
                "is_active": True,
            },
        )
        self._ensure_username(doctor2, "dr.amir")
        if created_doctor2 or not doctor2.password or not doctor2.has_usable_password():
            doctor2.set_password("demo1234")
            doctor2.save()
            self.stdout.write(self.style.SUCCESS("✓ پزشک دوم (dr.amir / demo1234)"))

        patient, created_patient = User.objects.get_or_create(
            phone_number="09120000002",
            defaults={
                "username": "ali.rezaei",
                "full_name": "علی رضایی",
                "role": User.Role.PATIENT,
                "is_active": True,
            },
        )
        self._ensure_username(patient, "ali.rezaei")
        if created_patient or not patient.password or not patient.has_usable_password():
            patient.set_password("demo1234")
            patient.save()
            self.stdout.write(self.style.SUCCESS("✓ بیمار (ali.rezaei / demo1234)"))

        # ------------------------------------------------------ schedules
        # دوشنبه تا پنجشنبه، ۹ تا ۱۷ با یک ساعت استراحت.
        if not DoctorSchedule.objects.filter(doctor=doctor).exists():
            for day in (0, 1, 2, 3):  # Mon..Thu (Python weekday)
                DoctorSchedule.objects.create(
                    doctor=doctor,
                    day_of_week=day,
                    start_work="09:00",
                    end_work="17:00",
                    break_start="13:00",
                    break_end="14:00",
                    session_duration=30,
                )
            self.stdout.write(self.style.SUCCESS("✓ شیفت هفتگی پزشک"))

        if not DoctorSchedule.objects.filter(doctor=doctor2).exists():
            for day in (1, 2, 4):  # Tue, Wed, Fri
                DoctorSchedule.objects.create(
                    doctor=doctor2,
                    day_of_week=day,
                    start_work="10:00",
                    end_work="18:00",
                    break_start="14:00",
                    break_end="15:00",
                    session_duration=30,
                )
            self.stdout.write(self.style.SUCCESS("✓ شیفت هفتگی پزشک دوم"))

        if not Holiday.objects.exists():
            # آخر هفته جاری (جمعه) تعطیل عمومی.
            today = datetime.date.today()
            days_until_friday = (4 - today.weekday()) % 7
            Holiday.objects.create(date=today + datetime.timedelta(days=days_until_friday), reason="تعطیل آخر هفته")
            self.stdout.write(self.style.SUCCESS("✓ تعطیلی عمومی"))

        # ---------------------------------------------------------- videos
        videos_data = [
            ("تمرینات تقویت عضلات کمر", Video.BodyPart.BACK, Video.InjuryType.DISC, 8),
            ("حرکات کششی گردن برای کارمندان", Video.BodyPart.NECK, Video.InjuryType.STRAIN, 6),
            ("توانبخشی زانو بعد از جراحی", Video.BodyPart.KNEE, Video.InjuryType.POST_SURGERY, 12),
            ("تمرینات تعادلی مچ پا", Video.BodyPart.ANKLE, Video.InjuryType.STRAIN, 5),
            ("تقویت عضلات شانه و کمربند", Video.BodyPart.SHOULDER, Video.InjuryType.ARTHROSIS, 9),
            ("ورزش درمانی برای آرتروز زانو", Video.BodyPart.KNEE, Video.InjuryType.ARTHROSIS, 10),
        ]
        for title, body_part, injury, duration in videos_data:
            Video.objects.get_or_create(
                title=title,
                defaults={
                    "description": f"فیلم آموزشی {title} توسط تیم فیزیوتراپی کلینیک تهیه شده است.",
                    "video_url": VIDEO_URL,
                    "thumbnail": "",
                    "body_part": body_part,
                    "injury_type": injury,
                    "is_public": True,
                    "uploaded_by": doctor,
                    "duration_minutes": duration,
                },
            )
        self.stdout.write(self.style.SUCCESS("✓ فیلم‌های آموزشی"))

        # --------------------------------------------------------- academy
        course1, _ = Course.objects.get_or_create(
            title="مقدمات فیزیوتراپی ورزشی",
            defaults={
                "description": "آشنایی کامل با اصول فیزیوتراپی ورزشی، آناتومی کاربردی و تمرینات پایه توانبخشی برای علاقه‌مندان.",
                "price": 0,
                "is_free": True,
                "level": Course.Level.BEGINNER,
                "total_hours": 4,
                "instructor": doctor,
            },
        )
        course2, _ = Course.objects.get_or_create(
            title="توانبخشی دیسک کمر (تخصصی)",
            defaults={
                "description": "برنامه جامع و مرحله‌به‌مرحله توانبخشی بیماران دیسک کمر: از ارزیابی تا بازگشت به فعالیت روزمره.",
                "price": 850_000,
                "discount_price": 680_000,
                "is_free": False,
                "level": Course.Level.EXPERT,
                "total_hours": 12,
                "instructor": doctor,
            },
        )
        chapters = [
            (course1, "آناتومی کاربردی ستون فقرات", 1),
            (course1, "اصول گرم کردن و کشش", 2),
            (course1, "تمرینات پایه ثبات مرکزی", 3),
            (course2, "ارزیابی و تشخیص افتراقی", 1),
            (course2, "فاز اول: کنترل درد و التهاب", 2),
            (course2, "فاز دوم: تقویت عضلات عمقی", 3),
            (course2, "فاز سوم: بازگشت به فعالیت", 4),
        ]
        for course, title, order in chapters:
            CourseChapter.objects.get_or_create(
                course=course,
                chapter_title=title,
                defaults={"video_url": VIDEO_URL, "duration_minutes": 15, "sort_order": order},
            )
        self.stdout.write(self.style.SUCCESS("✓ دوره‌های آکادمی"))

        # ------------------------------------------------------------- news
        news_data = [
            (
                "تحقیقات جدید: ورزش درمانی در کاهش کمردرد مزمن موثرتر از دارو",
                "New research: exercise therapy more effective than medication for chronic back pain",
                "مطالعه جدید نشان می‌دهد برنامه‌های ورزش درمانی تحت نظر فیزیوتراپیست، در بلندمدت نتایج بهتری نسبت به دارو درمانی برای بیماران کمردرد مزمن دارد.",
                NewsFeed.Category.CLINICAL,
            ),
            (
                "رونمایی از دستگاه جدید لیزر پرتوان برای توانبخشی ورزشکاران",
                "New high-power laser device unveiled for athlete rehabilitation",
                "محققان دستگاهی جدید با فناوری لیزر پرتوان طراحی کرده‌اند که روند ترمیم بافت‌های آسیب‌دیده ورزشکاران را تا ۴۰ درصد تسریع می‌کند.",
                NewsFeed.Category.TECH,
            ),
            (
                "بیست‌وپنجمین کنگره بین‌المللی فیزیوتراپی برگزار می‌شود",
                "25th International Physiotherapy Congress announced",
                "بیست‌وپنجمین کنگره بین‌المللی فیزیوتراپی با حضور متخصصان برجسته از ۴۰ کشور، سال آینده برگزار خواهد شد.",
                NewsFeed.Category.CONFERENCE,
            ),
            (
                "متد نوین توانبخشی با واقعیت مجازی وارد کلینیک‌ها شد",
                "New VR-based rehabilitation method enters clinics",
                "استفاده از واقعیت مجازی در توانبخشی بیماران سکته مغزی، انگیزه بیماران را برای انجام تمرینات به‌طور چشمگیری افزایش می‌دهد.",
                NewsFeed.Category.METHODS,
            ),
        ]
        for title_fa, title_en, summary_fa, category in news_data:
            NewsFeed.objects.get_or_create(
                source_url=f"https://example.com/news/{title_en.split()[0].lower()}",
                defaults={
                    "title_fa": title_fa,
                    "title_en": title_en,
                    "summary_fa": summary_fa,
                    "category": category,
                    "published_at": datetime.date.today(),
                    "is_published": True,
                },
            )
        self.stdout.write(self.style.SUCCESS("✓ اخبار مجله علمی"))

        self.stdout.write(self.style.SUCCESS("تمام شد! داده‌های نمونه آماده است."))