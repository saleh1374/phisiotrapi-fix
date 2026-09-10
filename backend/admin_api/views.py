"""Custom admin panel API — dashboard stats, CRUD for every module, site settings.

All views require an authenticated admin (or superuser). The Django admin at
/admin/ remains available, this API powers the Next.js panel at /admin.
"""
import datetime

from django.db.models import Count, Q, Sum
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.serializers import UserSerializer
from academy.models import Certificate, Course, CourseChapter, Order
from academy.serializers import (
    ChapterSerializer,
    ChapterWriteSerializer,
    CourseDetailSerializer,
    CourseWriteSerializer,
    OrderSerializer,
)
from academy.services import grant_access
from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer, AppointmentStatusSerializer
from news.models import NewsFeed
from news.serializers import NewsFeedSerializer, NewsFeedWriteSerializer
from siteconfig.models import SiteSetting
from videos.models import Video
from videos.serializers import VideoSerializer, VideoWriteSerializer


def _is_admin(user: User) -> bool:
    return user.is_admin_user


def _deny():
    return Response({"detail": "فقط مدیر می‌تواند به این بخش دسترسی داشته باشد"}, status=status.HTTP_403_FORBIDDEN)


class AdminStatsView(APIView):
    """Dashboard numbers + chart series + recent items."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return _deny()

        today = timezone.localdate()
        week_start = today - datetime.timedelta(days=6)

        users = User.objects.all()
        appointments = Appointment.objects.all()
        orders = Order.objects.all()
        paid_orders = orders.filter(payment_status=Order.PaymentStatus.PAID)

        revenue = paid_orders.aggregate(total=Sum("amount_paid"))["total"] or 0

        # Last 7 days series (users created, appointments booked, orders placed).
        days = [week_start + datetime.timedelta(days=i) for i in range(7)]
        series = []
        for day in days:
            series.append(
                {
                    "date": day.isoformat(),
                    "users": users.filter(created_at__date=day).count(),
                    "appointments": appointments.filter(created_at__date=day).count(),
                    "orders": orders.filter(purchase_date__date=day).count(),
                }
            )

        appointment_statuses = {
            str(k): v
            for k, v in appointments.values_list("status").annotate(c=Count("id"))
        }

        counts = {
            "users": users.count(),
            "doctors": users.filter(role=User.Role.DOCTOR).count(),
            "patients": users.filter(role=User.Role.PATIENT).count(),
            "appointments": appointments.count(),
            "appointments_today": appointments.filter(appointment_date=today).count(),
            "pending_appointments": appointments.filter(
                status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED]
            ).count(),
            "videos": Video.objects.count(),
            "courses": Course.objects.count(),
            "paid_orders": paid_orders.count(),
            "revenue": revenue,
            "news": NewsFeed.objects.count(),
            "news_published": NewsFeed.objects.filter(is_published=True).count(),
            "certificates": Certificate.objects.count(),
        }

        return Response(
            {
                "counts": counts,
                "appointments_by_status": appointment_statuses,
                "series": series,
                "recent_users": UserSerializer(
                    users.select_related().order_by("-created_at")[:5], many=True
                ).data,
                "recent_orders": OrderSerializer(
                    orders.select_related("user", "course").order_by("-purchase_date")[:5],
                    many=True,
                ).data,
            }
        )


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
class AdminUsersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return _deny()
        qs = User.objects.all().order_by("-created_at")
        role = request.query_params.get("role")
        search = request.query_params.get("search")
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(
                Q(username__icontains=search)
                | Q(full_name__icontains=search)
                | Q(phone_number__icontains=search)
                | Q(email__icontains=search)
            )
        return Response(UserSerializer(qs, many=True).data)


class AdminUserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not _is_admin(request.user):
            return _deny()
        user = User.objects.filter(pk=pk).first()
        if user is None:
            return Response({"detail": "کاربر یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        allowed = {"role", "is_active", "full_name", "email"}
        for key in allowed:
            if key in request.data:
                setattr(user, key, request.data[key])
        user.save()
        return Response(UserSerializer(user).data)

    def delete(self, request, pk):
        if not _is_admin(request.user):
            return _deny()
        user = User.objects.filter(pk=pk).first()
        if user is None:
            return Response({"detail": "کاربر یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        if user == request.user:
            return Response({"detail": "نمی‌توانید حساب خودتان را حذف کنید"}, status=status.HTTP_400_BAD_REQUEST)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------
class AdminAppointmentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return _deny()
        qs = Appointment.objects.select_related("doctor", "patient").order_by("-appointment_date", "-start_time")
        st = request.query_params.get("status")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        if st:
            qs = qs.filter(status=st)
        if date_from:
            qs = qs.filter(appointment_date__gte=date_from)
        if date_to:
            qs = qs.filter(appointment_date__lte=date_to)
        return Response(AppointmentSerializer(qs, many=True).data)


class AdminAppointmentActionView(APIView):
    """Set any status (completed / no_show / canceled_by_admin / confirmed / pending)."""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not _is_admin(request.user):
            return _deny()
        appointment = Appointment.objects.filter(pk=pk).first()
        if appointment is None:
            return Response({"detail": "نوبت یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        serializer = AppointmentStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment.status = serializer.validated_data["status"]
        appointment.save(update_fields=["status"])
        return Response(AppointmentSerializer(appointment).data)


# ---------------------------------------------------------------------------
# Videos
# ---------------------------------------------------------------------------
class AdminVideosView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return _deny()
        return Response(VideoSerializer(Video.objects.all().order_by("-created_at"), many=True).data)

    def post(self, request):
        if not _is_admin(request.user):
            return _deny()
        serializer = VideoWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        video = serializer.save(uploaded_by=request.user)
        return Response(VideoSerializer(video).data, status=status.HTTP_201_CREATED)


class AdminVideoDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not _is_admin(request.user):
            return _deny()
        video = Video.objects.filter(pk=pk).first()
        if video is None:
            return Response({"detail": "فیلم یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        serializer = VideoWriteSerializer(video, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(VideoSerializer(video).data)

    def delete(self, request, pk):
        if not _is_admin(request.user):
            return _deny()
        video = Video.objects.filter(pk=pk).first()
        if video is None:
            return Response({"detail": "فیلم یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        video.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Courses + chapters
# ---------------------------------------------------------------------------
class AdminCoursesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return _deny()
        qs = Course.objects.select_related("instructor").prefetch_related("chapters").order_by("-created_at")
        return Response(CourseDetailSerializer(qs, many=True).data)

    def post(self, request):
        if not _is_admin(request.user):
            return _deny()
        serializer = CourseWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save(instructor=request.data.get("instructor") or request.user)
        return Response(CourseDetailSerializer(course).data, status=status.HTTP_201_CREATED)


class AdminCourseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not _is_admin(request.user):
            return _deny()
        course = Course.objects.filter(pk=pk).first()
        if course is None:
            return Response({"detail": "دوره یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        serializer = CourseWriteSerializer(course, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CourseDetailSerializer(course).data)

    def delete(self, request, pk):
        if not _is_admin(request.user):
            return _deny()
        course = Course.objects.filter(pk=pk).first()
        if course is None:
            return Response({"detail": "دوره یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminChaptersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id):
        if not _is_admin(request.user):
            return _deny()
        course = Course.objects.filter(pk=course_id).first()
        if course is None:
            return Response({"detail": "دوره یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChapterWriteSerializer(data={**request.data, "course": course_id})
        serializer.is_valid(raise_exception=True)
        chapter = serializer.save()
        return Response(ChapterSerializer(chapter).data, status=status.HTTP_201_CREATED)


class AdminChapterDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not _is_admin(request.user):
            return _deny()
        chapter = CourseChapter.objects.filter(pk=pk).first()
        if chapter is None:
            return Response({"detail": "سرفصل یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChapterWriteSerializer(chapter, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ChapterSerializer(chapter).data)

    def delete(self, request, pk):
        if not _is_admin(request.user):
            return _deny()
        chapter = CourseChapter.objects.filter(pk=pk).first()
        if chapter is None:
            return Response({"detail": "سرفصل یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        chapter.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# News
# ---------------------------------------------------------------------------
class AdminNewsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return _deny()
        qs = NewsFeed.objects.all().order_by("-published_at", "-created_at")
        return Response(NewsFeedSerializer(qs, many=True).data)

    def post(self, request):
        if not _is_admin(request.user):
            return _deny()
        serializer = NewsFeedWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        article = serializer.save()
        return Response(NewsFeedSerializer(article).data, status=status.HTTP_201_CREATED)


class AdminNewsDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not _is_admin(request.user):
            return _deny()
        article = NewsFeed.objects.filter(pk=pk).first()
        if article is None:
            return Response({"detail": "خبر یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        serializer = NewsFeedWriteSerializer(article, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(NewsFeedSerializer(article).data)

    def delete(self, request, pk):
        if not _is_admin(request.user):
            return _deny()
        article = NewsFeed.objects.filter(pk=pk).first()
        if article is None:
            return Response({"detail": "خبر یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        article.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------
class AdminOrdersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return _deny()
        qs = Order.objects.select_related("user", "course").order_by("-purchase_date")
        st = request.query_params.get("status")
        if st:
            qs = qs.filter(payment_status=st)
        data = []
        for order in qs:
            item = OrderSerializer(order).data
            item["user_name"] = order.user.full_name or order.user.username or order.user.phone_number
            data.append(item)
        return Response(data)


# ---------------------------------------------------------------------------
# Site settings
# ---------------------------------------------------------------------------
class PublicSettingsView(APIView):
    """Public subset of site settings (footer, banner, ...)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        s = SiteSetting.get()
        return Response(
            {
                "site_name": s.site_name,
                "site_tagline": s.site_tagline,
                "announcement": s.announcement,
                "contact_phone": s.contact_phone,
                "contact_email": s.contact_email,
                "address": s.address,
                "working_hours": s.working_hours,
                "google_client_id": s.google_client_id,
            }
        )


class AdminSettingsView(APIView):
    """Read/write the full settings row (admin only)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return _deny()
        s = SiteSetting.get()
        data = {
            "site_name": s.site_name,
            "site_tagline": s.site_tagline,
            "site_description": s.site_description,
            "announcement": s.announcement,
            "contact_phone": s.contact_phone,
            "contact_email": s.contact_email,
            "address": s.address,
            "working_hours": s.working_hours,
            "otp_backend": s.otp_backend,
            "smtp_host": s.smtp_host,
            "smtp_port": s.smtp_port,
            "smtp_user": s.smtp_user,
            "smtp_use_tls": s.smtp_use_tls,
            "email_from": s.email_from,
            "google_client_id": s.google_client_id,
            # Masked: the panel never reveals the stored password.
            "smtp_password_set": bool(s.smtp_password),
            "updated_at": s.updated_at,
        }
        return Response(data)

    def put(self, request):
        if not _is_admin(request.user):
            return _deny()
        s = SiteSetting.get()
        fields = [
            "site_name", "site_tagline", "site_description", "announcement",
            "contact_phone", "contact_email", "address", "working_hours",
            "otp_backend", "smtp_host", "smtp_port", "smtp_user",
            "smtp_use_tls", "email_from", "google_client_id",
        ]
        for f in fields:
            if f in request.data:
                setattr(s, f, request.data[f])
        # Empty smtp_password keeps the existing secret.
        if request.data.get("smtp_password"):
            s.smtp_password = request.data["smtp_password"]
        s.save()
        return Response({"detail": "تنظیمات ذخیره شد"}, status=status.HTTP_200_OK)