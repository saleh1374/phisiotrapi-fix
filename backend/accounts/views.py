from django.contrib.auth import authenticate
from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from . import services
from .models import User
from .serializers import (
    GoogleAuthSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    PasswordLoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .throttles import LoginThrottle, OTPThrottle


def _tokens_for(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class OTPRequestView(APIView):
    """Step 1 of the OTP flow: request a 6-digit code for a phone number."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [OTPThrottle]
    serializer_class = OTPRequestSerializer

    @extend_schema(
        request=OTPRequestSerializer,
        responses={200: OpenApiResponse(description="کد پیامک شد")},
    )
    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.request_otp(serializer.validated_data["phone_number"])
        return Response(
            {"detail": "کد تایید پیامک شد"},
            status=status.HTTP_200_OK,
        )


class OTPVerifyView(APIView):
    """Step 2 of the OTP flow: verify the code and receive JWT tokens.

    New phone numbers are auto-registered (patient role) — OTP doubles as
    both login and registration. Idempotent per code: a used code can never
    be replayed.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [OTPThrottle]
    serializer_class = OTPVerifySerializer

    @extend_schema(
        request=OTPVerifySerializer,
        responses={200: UserSerializer},
    )
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user = services.verify_otp(data["phone_number"], data["code"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # Capture the full name on first registration.
        if data.get("full_name") and not user.full_name:
            user.full_name = data["full_name"]
            user.save(update_fields=["full_name"])

        return Response(
            {
                "tokens": _tokens_for(user),
                "user": UserSerializer(user).data,
                "is_new": data.get("full_name") is not None and not user.full_name,
            },
            status=status.HTTP_200_OK,
        )


class RegisterView(APIView):
    """Username + password registration (no phone number needed)."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginThrottle]
    serializer_class = RegisterSerializer

    @extend_schema(
        request=RegisterSerializer,
        responses={201: UserSerializer},
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = User.objects.create_user(
            username=data["username"],
            password=data["password"],
            full_name=data.get("full_name", ""),
        )
        if data.get("email"):
            user.email = data["email"]
            user.save(update_fields=["email"])

        return Response(
            {
                "tokens": _tokens_for(user),
                "user": UserSerializer(user).data,
                "is_new": True,
            },
            status=status.HTTP_201_CREATED,
        )


class PasswordLoginView(APIView):
    """Password login — accepts either the username or the phone number."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginThrottle]
    serializer_class = PasswordLoginSerializer

    @extend_schema(
        request=PasswordLoginSerializer,
        responses={200: UserSerializer},
    )
    def post(self, request):
        serializer = PasswordLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        identifier = data["username"]

        # Use Django's authenticate() so auth backends and signals fire properly.
        user = authenticate(request, username=identifier, password=data["password"])
        if user is None:
            # Fallback: identifier might be a phone number (authenticate uses USERNAME_FIELD)
            user_obj = User.objects.filter(phone_number=identifier).first()
            if user_obj and user_obj.is_active and user_obj.check_password(data["password"]):
                user = user_obj

        if user is None or not user.is_active:
            return Response(
                {"detail": "نام کاربری یا رمز عبور اشتباه است"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Update last_login
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        return Response(
            {
                "tokens": _tokens_for(user),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class GoogleAuthView(APIView):
    """Google sign-in: verifies the browser-provided ID token and logs in / registers."""

    permission_classes = [permissions.AllowAny]
    serializer_class = GoogleAuthSerializer

    @extend_schema(
        request=GoogleAuthSerializer,
        responses={200: UserSerializer},
    )
    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payload = services.verify_google_token(serializer.validated_data["id_token"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_401_UNAUTHORIZED)

        email = payload["email"].lower()
        user = User.objects.filter(email__iexact=email).first()
        created = user is None
        if created:
            user = User.objects.create_user(
                username=services.username_from_email(email),
                password=None,
                full_name=payload.get("name", ""),
                email=email,
            )
        if not user.is_active:
            return Response(
                {"detail": "حساب کاربری شما غیرفعال است"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(
            {
                "tokens": _tokens_for(user),
                "user": UserSerializer(user).data,
                "is_new": created,
            },
            status=status.HTTP_200_OK,
        )


class MeView(generics.RetrieveUpdateAPIView):
    """View / update the currently authenticated user's profile."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ProfileUpdateSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        # Preserve the full serializer output in the response.
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = ProfileUpdateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(instance).data)