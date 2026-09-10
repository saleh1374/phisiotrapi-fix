from django.db.models import Q
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import Certificate, Course, CourseChapter, Order
from .serializers import (
    CertificateSerializer,
    ChapterSerializer,
    ChapterWriteSerializer,
    CourseDetailSerializer,
    CourseSerializer,
    CourseWriteSerializer,
    CourseWithProgressSerializer,
    OrderSerializer,
    PayOrderSerializer,
)
from accounts.throttles import EnrollThrottle


class CourseListView(generics.ListAPIView):
    """Public course catalogue with filters: level, free/paid, search."""

    permission_classes = [permissions.AllowAny]
    serializer_class = CourseSerializer

    def get_queryset(self):
        qs = Course.objects.select_related("instructor").prefetch_related("chapters")
        level = self.request.query_params.get("level")
        kind = self.request.query_params.get("kind")  # free | paid
        search = self.request.query_params.get("search")
        if level:
            qs = qs.filter(level=level)
        if kind == "free":
            qs = qs.filter(is_free=True)
        elif kind == "paid":
            qs = qs.filter(is_free=False)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        return qs


class CourseDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CourseDetailSerializer
    queryset = Course.objects.select_related("instructor").prefetch_related("chapters")


class CourseCreateView(generics.CreateAPIView):
    """Create a course (admin/author only)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CourseWriteSerializer

    def perform_create(self, serializer):
        if not (self.request.user.is_admin_user or self.request.user.role == "author"):
            self.permission_denied(self.request)
        serializer.save(instructor=self.request.user)


class ChapterCreateView(generics.CreateAPIView):
    """Add a chapter to a course (admin/author only)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChapterWriteSerializer

    def perform_create(self, serializer):
        if not (self.request.user.is_admin_user or self.request.user.role == "author"):
            self.permission_denied(self.request)
        serializer.save()


class EnrollView(APIView):
    """Enroll in a course: free → instant access, paid → pending order to pay."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [EnrollThrottle]

    @extend_schema(responses=OrderSerializer)
    def post(self, request, pk):
        course = Course.objects.filter(pk=pk).first()
        if course is None:
            return Response({"detail": "دوره یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        order = services.enroll(request.user, course)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class PayOrderView(APIView):
    """Simulated payment in dev mode: marks the pending order as paid.

    In production this endpoint would redirect to Zarinpal and verify the
    callback; the transaction_code would come from the gateway.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=PayOrderSerializer, responses=OrderSerializer)
    def post(self, request):
        serializer = PayOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = Order.objects.filter(pk=serializer.validated_data["order_id"], user=request.user).first()
        if order is None:
            return Response({"detail": "سفارش یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        if order.payment_status == Order.PaymentStatus.PAID:
            return Response(OrderSerializer(order).data)
        services.grant_access(request.user, order.course)
        order.refresh_from_db()
        return Response(OrderSerializer(order).data)


class MyCoursesView(APIView):
    """The user's courses (paid/free access) with progress."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        course_ids = Order.objects.filter(
            user=request.user,
            payment_status=Order.PaymentStatus.PAID,
        ).values_list("course_id", flat=True)
        courses = (
            Course.objects.filter(pk__in=course_ids)
            .select_related("instructor")
            .prefetch_related("chapters")
            .order_by("-created_at")
        )
        return Response(CourseWithProgressSerializer(courses, many=True, context={"request": request}).data)


class CourseContentView(APIView):
    """Course chapters for an enrolled user (video/PDF access)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        course = Course.objects.filter(pk=pk).first()
        if course is None:
            return Response({"detail": "دوره یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        has_access = Order.objects.filter(user=request.user, course=course, payment_status=Order.PaymentStatus.PAID).exists()
        if not has_access:
            return Response({"detail": "برای مشاهده محتوا ابتدا باید دوره را تهیه کنید"}, status=status.HTTP_403_FORBIDDEN)
        progress = services.user_course_progress(request.user, course)
        data = {
            "course": CourseDetailSerializer(course).data,
            "progress": progress,
        }
        return Response(data)


class CompleteChapterView(APIView):
    """Mark a chapter as watched (progress tracking)."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=CourseDetailSerializer)
    def post(self, request, pk, chapter_id):
        course = Course.objects.filter(pk=pk).first()
        chapter = CourseChapter.objects.filter(pk=chapter_id, course_id=pk).first()
        if course is None or chapter is None:
            return Response({"detail": "سرفصل یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        has_access = Order.objects.filter(user=request.user, course=course, payment_status=Order.PaymentStatus.PAID).exists()
        if not has_access:
            return Response({"detail": "دسترسی ندارید"}, status=status.HTTP_403_FORBIDDEN)
        services.complete_chapter(request.user, course, chapter)
        cert = services.issue_certificate_if_ready(request.user, course)
        return Response(
            {
                "progress": services.user_course_progress(request.user, course),
                "certificate": CertificateSerializer(cert).data if cert else None,
            }
        )


class MyCertificatesView(APIView):
    """Certificates earned by the user."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        certs = Certificate.objects.filter(user=request.user).select_related("course").order_by("-issue_date")
        return Response(CertificateSerializer(certs, many=True).data)


class CertificateVerifyView(APIView):
    """Public certificate authenticity check (used by the QR code)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        number = request.query_params.get("number", "").strip()
        if not number:
            return Response({"detail": "شماره گواهی را وارد کنید"}, status=status.HTTP_400_BAD_REQUEST)
        cert = services.certificate_verify(number)
        if cert is None:
            return Response({"valid": False, "detail": "گواهی با این شماره یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"valid": True, "certificate": CertificateSerializer(cert).data})