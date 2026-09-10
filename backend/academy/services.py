"""Academy business logic: enrollment, payment, progress, certificates."""
import hashlib
import uuid

from django.utils import timezone

from .models import Certificate, Course, CourseProgress, Order


def _generate_certificate_number() -> str:
    raw = uuid.uuid4().hex.upper()[:12]
    return f"PHY-{raw[:4]}-{raw[4:8]}-{raw[8:12]}"


def grant_access(user, course: Course) -> Order:
    """Create a paid order (simulated payment in dev mode) and grant access."""
    amount = course.final_price
    # Dev-mode payment: in production, route through Zarinpal here.
    transaction_code = f"MOCK-{uuid.uuid4().hex[:12].upper()}"
    order, created = Order.objects.get_or_create(
        user=user,
        course=course,
        defaults={
            "amount_paid": amount,
            "transaction_code": transaction_code,
            "payment_status": Order.PaymentStatus.PAID,
        },
    )
    if not created:
        # Upgrade an existing pending order to paid.
        order.amount_paid = amount
        order.transaction_code = transaction_code
        order.payment_status = Order.PaymentStatus.PAID
        order.save()
    return order


def enroll(user, course: Course) -> Order:
    """Enroll a user in a course. Free courses grant access instantly.

    For paid courses an existing pending order is reused (idempotent), so a
    patient can never accumulate duplicate unpaid orders for the same course.
    """
    existing = Order.objects.filter(
        user=user, course=course, payment_status=Order.PaymentStatus.PAID
    ).first()
    if existing:
        return existing
    if course.is_free or course.final_price == 0:
        return grant_access(user, course)
    pending = Order.objects.filter(
        user=user, course=course, payment_status=Order.PaymentStatus.PENDING
    ).first()
    if pending:
        return pending
    # Paid course: create a pending order; the frontend then "pays" (dev mock).
    return Order.objects.create(
        user=user, course=course, amount_paid=course.final_price, payment_status=Order.PaymentStatus.PENDING
    )


def user_course_progress(user, course: Course) -> dict:
    chapters = list(course.chapters.all())
    completed_ids = set(
        CourseProgress.objects.filter(user=user, course=course).values_list("chapter_id", flat=True)
    )
    total = len(chapters)
    done = sum(1 for c in chapters if c.id in completed_ids)
    percent = round(done / total * 100) if total else 0
    return {
        "percent": percent,
        "completed": done,
        "total": total,
        "completed_chapter_ids": [str(i) for i in completed_ids],
        "certificate_ready": total > 0 and done == total,
    }


def complete_chapter(user, course: Course, chapter) -> CourseProgress:
    progress, _ = CourseProgress.objects.get_or_create(user=user, course=course, chapter=chapter)
    return progress


def issue_certificate_if_ready(user, course: Course) -> Certificate | None:
    """Automatically issue a certificate once 100% of chapters are completed."""
    progress = user_course_progress(user, course)
    if not progress["certificate_ready"]:
        return None
    has_access = Order.objects.filter(user=user, course=course, payment_status=Order.PaymentStatus.PAID).exists()
    if not has_access:
        return None
    number = _generate_certificate_number()
    cert, created = Certificate.objects.get_or_create(
        user=user,
        course=course,
        defaults={
            "certificate_number": number,
            "qr_code_hash": hashlib.sha256(number.encode()).hexdigest()[:32],
        },
    )
    return cert


def certificate_verify(number: str) -> Certificate | None:
    return Certificate.objects.select_related("user", "course").filter(certificate_number=number.upper()).first()