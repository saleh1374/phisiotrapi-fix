import hmac
import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model keyed by Iranian phone number."""

    class Role(models.TextChoices):
        PATIENT = "patient", "بیمار"
        DOCTOR = "doctor", "پزشک"
        ADMIN = "admin", "مدیر"
        AUTHOR = "author", "نویسنده"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField("نام و نام خانوادگی", max_length=100, blank=True)
    # Username is the primary login identifier; phone number is optional
    # (password + Google sign-in work without it).
    username = models.CharField("نام کاربری", max_length=30, unique=True, null=True, blank=True)
    national_code = models.CharField("کد ملی", max_length=10, unique=True, null=True, blank=True)
    phone_number = models.CharField("شماره موبایل", max_length=11, unique=True, null=True, blank=True)
    email = models.EmailField("ایمیل", max_length=255, unique=True, null=True, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.PATIENT)
    profile_pic = models.URLField("تصویر پروفایل", max_length=500, blank=True)

    # Doctor-only fields
    medical_license_number = models.CharField("شماره نظام پزشکی", max_length=50, blank=True)
    specialty = models.CharField("تخصص", max_length=100, blank=True)
    bio = models.TextField("بیوگرافی", blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "کاربر"
        verbose_name_plural = "کاربران"
        indexes = [
            models.Index(fields=["phone_number"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self):
        return self.full_name or self.phone_number

    @property
    def is_doctor(self) -> bool:
        return self.role == self.Role.DOCTOR

    @property
    def is_patient(self) -> bool:
        return self.role == self.Role.PATIENT

    @property
    def is_admin_user(self) -> bool:
        return self.role == self.Role.ADMIN or self.is_superuser

    @staticmethod
    def validate_national_code(code: str) -> bool:
        """Validate Iranian national code (کد ملی) using the checksum algorithm."""
        if not code or not code.isdigit() or len(code) != 10:
            return False
        check = int(code[9])
        total = sum(int(code[i]) * (10 - i) for i in range(9))
        remainder = total % 11
        if remainder < 2:
            return check == remainder
        return check == 11 - remainder


class OTP(models.Model):
    """One-Time-Password for phone verification (login / registration)."""

    class Purpose(models.TextChoices):
        AUTH = "auth", "احراز هویت"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=11, db_index=True)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=10, choices=Purpose.choices, default=Purpose.AUTH)
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "کد یکبارمصرف"
        verbose_name_plural = "کدهای یکبارمصرف"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.phone_number} - {self.code}"

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def is_valid_code(self, candidate: str) -> bool:
        """Check the code without burning attempts on wrong digits.

        Uses constant-time comparison to prevent timing attacks.
        """
        if self.is_used or self.is_expired:
            return False
        return hmac.compare_digest(self.code, candidate.strip())