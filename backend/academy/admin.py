from django.contrib import admin

from .models import Certificate, Course, CourseChapter, CourseProgress, Order


class ChapterInline(admin.TabularInline):
    model = CourseChapter
    extra = 1


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["title", "level", "price", "is_free", "instructor", "created_at"]
    list_filter = ["level", "is_free"]
    search_fields = ["title"]
    inlines = [ChapterInline]


@admin.register(CourseChapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ["chapter_title", "course", "sort_order", "duration_minutes"]
    list_filter = ["course"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["user", "course", "amount_paid", "payment_status", "transaction_code", "purchase_date"]
    list_filter = ["payment_status", "purchase_date"]
    search_fields = ["user__full_name", "user__phone_number", "course__title"]


@admin.register(CourseProgress)
class CourseProgressAdmin(admin.ModelAdmin):
    list_display = ["user", "course", "chapter", "completed_at"]


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ["certificate_number", "user", "course", "issue_date"]
    search_fields = ["certificate_number", "user__full_name", "course__title"]