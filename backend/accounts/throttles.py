from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle


class OTPThrottle(ScopedRateThrottle):
    """Limits OTP requests per minute (brute-force protection)."""

    scope = "otp"


class LoginThrottle(ScopedRateThrottle):
    """Limits password login attempts per minute."""

    scope = "login"


class BookingThrottle(ScopedRateThrottle):
    """Limits appointment booking attempts to prevent spam."""

    scope = "booking"


class EnrollThrottle(ScopedRateThrottle):
    """Limits course enrollment attempts to prevent spam."""

    scope = "enroll"


class BurstRateThrottle(AnonRateThrottle):
    """General burst protection for anonymous users."""

    rate = "30/min"


class SustainedRateThrottle(AnonRateThrottle):
    """Sustained rate protection for anonymous users."""

    rate = "200/hour"
