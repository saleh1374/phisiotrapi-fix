from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import OTP, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-created_at"]
    list_display = ["username", "full_name", "phone_number", "role", "is_active", "last_login", "created_at"]
    list_filter = ["role", "is_active", "is_staff"]
    search_fields = ["username", "phone_number", "full_name", "national_code", "email"]
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("اطلاعات شخصی", {"fields": ("full_name", "national_code", "email", "phone_number", "profile_pic")}),
        (
            "اطلاعات پزشک",
            {"fields": ("role", "medical_license_number", "specialty", "bio")},
        ),
        ("دسترسی‌ها", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("تاریخ‌ها", {"fields": ("last_login", "created_at")}),
    )
    readonly_fields = ["created_at"]
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("username", "phone_number", "password1", "password2")}),
    )


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ["phone_number", "code", "purpose", "is_used", "attempts", "expires_at"]
    list_filter = ["is_used", "purpose"]
    search_fields = ["phone_number"]