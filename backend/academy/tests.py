from rest_framework.test import APITestCase as TestCase
from django.urls import reverse

from accounts.models import User

from .models import Certificate, Course, CourseChapter, Order


def _make_user(phone="09120000002", role=User.Role.PATIENT):
    return User.objects.create_user(phone_number=phone, role=role, full_name="کاربر تست")


def _make_course(free=False, price=0):
    instructor = User.objects.create_user(phone_number="09120000001", role=User.Role.DOCTOR, full_name="مدرس")
    course = Course.objects.create(
        title="دوره تست",
        price=price,
        is_free=free,
        instructor=instructor,
    )
    for i in range(2):
        CourseChapter.objects.create(course=course, chapter_title=f"سرفصل {i}", sort_order=i)
    return course


class AcademyTests(TestCase):
    def setUp(self):
        self.user = _make_user()
        self.client.force_authenticate(self.user)

    def test_free_course_instant_access(self):
        course = _make_course(free=True)
        resp = self.client.post(reverse("course-enroll", args=[course.id]))
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertEqual(resp.json()["payment_status"], "paid")

    def test_paid_enroll_is_idempotent(self):
        course = _make_course(free=False, price=500_000)
        first = self.client.post(reverse("course-enroll", args=[course.id]))
        second = self.client.post(reverse("course-enroll", args=[course.id]))
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        # Re-enrolling must return the same pending order, not a duplicate.
        self.assertEqual(first.json()["id"], second.json()["id"])
        self.assertEqual(
            Order.objects.filter(user=self.user, course=course).count(),
            1,
        )

    def test_paid_course_requires_payment(self):
        course = _make_course(free=False, price=500_000)
        resp = self.client.post(reverse("course-enroll", args=[course.id]))
        self.assertEqual(resp.json()["payment_status"], "pending")

        # No access yet.
        content = self.client.get(reverse("course-content", args=[course.id]))
        self.assertEqual(content.status_code, 403)

        # Simulated payment.
        pay = self.client.post(reverse("pay-order"), data={"order_id": resp.json()["id"]}, format="json")
        self.assertEqual(pay.json()["payment_status"], "paid")
        self.assertTrue(pay.json()["transaction_code"].startswith("MOCK-"))

        content = self.client.get(reverse("course-content", args=[course.id]))
        self.assertEqual(content.status_code, 200)

    def test_certificate_issued_after_completing_all_chapters(self):
        course = _make_course(free=True)
        self.client.post(reverse("course-enroll", args=[course.id]))
        for chapter in course.chapters.all():
            resp = self.client.post(reverse("chapter-complete", args=[course.id, chapter.id]))
            self.assertEqual(resp.status_code, 200)
        self.assertTrue(Certificate.objects.filter(user=self.user, course=course).exists())

        cert = Certificate.objects.get(user=self.user, course=course)
        verify = self.client.get(reverse("certificate-verify") + f"?number={cert.certificate_number}")
        self.assertEqual(verify.status_code, 200)
        self.assertTrue(verify.json()["valid"])

    def test_certificate_not_issued_without_full_progress(self):
        course = _make_course(free=True)
        self.client.post(reverse("course-enroll", args=[course.id]))
        self.client.post(reverse("chapter-complete", args=[course.id, course.chapters.first().id]))
        self.assertFalse(Certificate.objects.filter(user=self.user, course=course).exists())

    def test_my_courses_and_certificates(self):
        course = _make_course(free=True)
        self.client.post(reverse("course-enroll", args=[course.id]))
        mine = self.client.get(reverse("my-courses")).json()
        self.assertEqual(len(mine), 1)
        self.assertEqual(mine[0]["progress"]["percent"], 0)