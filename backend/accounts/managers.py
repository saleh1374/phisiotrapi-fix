from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    """Manager for the custom user model (username-based, phone optional)."""

    use_in_migrations = True

    def _create_user(
        self,
        username: str | None,
        password: str | None,
        phone_number: str | None = None,
        **extra_fields,
    ):
        if not username and not phone_number:
            raise ValueError("نام کاربری یا شماره موبایل الزامی است")
        # Normalize: strip spaces/dashes, accept both 09xx and +989xx forms.
        if phone_number:
            phone = phone_number.replace(" ", "").replace("-", "")
            if phone.startswith("+98"):
                phone = "0" + phone[3:]
        else:
            phone = None
        user = self.model(username=username, phone_number=phone, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(
        self,
        username: str | None = None,
        password: str | None = None,
        phone_number: str | None = None,
        **extra_fields,
    ):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(username, password, phone_number, **extra_fields)

    def create_superuser(
        self,
        username: str | None = None,
        password: str | None = None,
        phone_number: str | None = None,
        **extra_fields,
    ):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", self.model.Role.ADMIN)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(username, password, phone_number, **extra_fields)