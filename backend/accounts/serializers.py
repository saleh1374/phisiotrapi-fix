from rest_framework import serializers

from . import services
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Public user representation returned to the frontend."""

    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "phone_number",
            "email",
            "role",
            "role_display",
            "profile_pic",
            "specialty",
            "medical_license_number",
            "bio",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "username", "phone_number", "role", "is_active", "created_at"]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Allows a user to update their own profile (phone is immutable)."""

    class Meta:
        model = User
        fields = ["full_name", "email", "national_code", "profile_pic", "bio"]
        extra_kwargs = {
            "email": {"required": False, "allow_null": True},
            "national_code": {"required": False, "allow_null": True},
        }

    def validate_national_code(self, value):
        if value and not User.validate_national_code(value):
            raise serializers.ValidationError("کد ملی نامعتبر است")
        return value


class OTPRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=16, write_only=True)

    def validate_phone_number(self, value: str) -> str:
        try:
            return services.normalize_phone(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc))


class OTPVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=16, write_only=True)
    code = serializers.CharField(min_length=4, max_length=6, write_only=True)
    full_name = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_phone_number(self, value: str) -> str:
        try:
            return services.normalize_phone(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc))

    def validate_code(self, value: str) -> str:
        if not value.strip().isdigit():
            raise serializers.ValidationError("کد باید فقط شامل عدد باشد")
        return value.strip()


class RegisterSerializer(serializers.Serializer):
    """Username + password registration (no phone number required)."""

    username = serializers.CharField(max_length=30)
    password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    full_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate_username(self, value: str) -> str:
        import re

        username = value.strip()
        if not re.fullmatch(r"[a-zA-Z0-9_.]+", username):
            raise serializers.ValidationError(
                "نام کاربری فقط می‌تواند شامل حروف، عدد، «.» و «_» باشد"
            )
        if len(username) < 3:
            raise serializers.ValidationError("نام کاربری باید حداقل ۳ کاراکتر باشد")
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("این نام کاربری قبلاً ثبت شده است")
        return username

    def validate_password(self, value: str) -> str:
        if len(value) < 8:
            raise serializers.ValidationError("رمز عبور باید حداقل ۸ کاراکتر باشد")
        return value


class PasswordLoginSerializer(serializers.Serializer):
    """Password login — accepts either the username or the phone number."""

    username = serializers.CharField(max_length=30, write_only=True)
    password = serializers.CharField(write_only=True)

    def validate_username(self, value: str) -> str:
        return value.strip()


class GoogleAuthSerializer(serializers.Serializer):
    """Google sign-in: the browser sends the Google ID token (JWT)."""

    id_token = serializers.CharField(write_only=True)