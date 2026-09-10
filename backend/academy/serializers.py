from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import Certificate, Course, CourseChapter, Order


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseChapter
        fields = ["id", "chapter_title", "video_url", "pdf_attachment", "duration_minutes", "sort_order"]


class CourseSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source="get_level_display", read_only=True)
    instructor_name = serializers.CharField(source="instructor.full_name", read_only=True, default="")
    final_price = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "price",
            "discount_price",
            "final_price",
            "cover_image",
            "level",
            "level_display",
            "total_hours",
            "is_free",
            "instructor_name",
            "created_at",
        ]


class CourseDetailSerializer(CourseSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ["chapters"]


class CourseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["title", "description", "price", "discount_price", "cover_image", "level", "total_hours", "is_free", "instructor"]


class ChapterWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseChapter
        fields = ["course", "chapter_title", "video_url", "pdf_attachment", "duration_minutes", "sort_order"]


class OrderSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)

    class Meta:
        model = Order
        fields = ["id", "course", "amount_paid", "payment_status", "payment_status_display", "transaction_code", "discount_code", "purchase_date"]


class CertificateSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Certificate
        fields = ["id", "certificate_number", "user_name", "course_title", "issue_date"]


class CourseWithProgressSerializer(CourseSerializer):
    progress = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ["progress"]

    def get_progress(self, obj):
        from .services import user_course_progress

        return user_course_progress(self.context["request"].user, obj)


class PayOrderSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()