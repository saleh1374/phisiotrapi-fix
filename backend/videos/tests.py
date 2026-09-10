import datetime

from rest_framework.test import APITestCase as TestCase
from django.urls import reverse

from accounts.models import User

from .models import PatientPrescription, Video


def _make_user(phone, role=User.Role.PATIENT, name="کاربر"):
    return User.objects.create_user(phone_number=phone, full_name=name, role=role)


class VideoLibraryTests(TestCase):
    def setUp(self):
        self.doctor = _make_user("09120000001", User.Role.DOCTOR, "دکتر تست")
        self.patient = _make_user("09120000002", User.Role.PATIENT, "بیمار تست")
        self.video = Video.objects.create(
            title="تمرینات کمر",
            video_url="https://example.com/v1.mp4",
            body_part=Video.BodyPart.BACK,
            injury_type=Video.InjuryType.DISC,
            is_public=True,
            uploaded_by=self.doctor,
        )
        self.private_video = Video.objects.create(
            title="فیلم خصوصی",
            video_url="https://example.com/v2.mp4",
            body_part=Video.BodyPart.KNEE,
            injury_type=Video.InjuryType.STRAIN,
            is_public=False,
            uploaded_by=self.doctor,
        )

    def test_public_list_excludes_private(self):
        resp = self.client.get(reverse("video-list"))
        self.assertEqual(resp.status_code, 200)
        titles = [v["title"] for v in resp.json()]
        self.assertIn("تمرینات کمر", titles)
        self.assertNotIn("فیلم خصوصی", titles)

    def test_filter_by_body_part(self):
        resp = self.client.get(reverse("video-list") + "?body_part=" + Video.BodyPart.BACK)
        self.assertEqual(len(resp.json()), 1)

    def test_view_count_increments(self):
        self.client.get(reverse("video-detail", args=[self.video.id]))
        self.video.refresh_from_db()
        self.assertEqual(self.video.view_count, 1)

    def test_prescribe_and_complete(self):
        self.client.force_authenticate(self.doctor)
        resp = self.client.post(
            reverse("prescribe-videos"),
            data={
                "patient_id": str(self.patient.id),
                "video_ids": [str(self.video.id)],
                "due_date": (datetime.date.today() + datetime.timedelta(days=7)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)

        self.client.force_authenticate(self.patient)
        mine = self.client.get(reverse("my-videos")).json()
        self.assertEqual(mine["total"], 1)
        self.assertEqual(mine["progress_percent"], 0)

        done = self.client.post(reverse("complete-video", args=[mine["items"][0]["id"]]), format="json")
        self.assertEqual(done.status_code, 200)
        mine = self.client.get(reverse("my-videos")).json()
        self.assertEqual(mine["progress_percent"], 100)

    def test_doctor_cannot_prescribe_to_non_patient(self):
        self.client.force_authenticate(self.doctor)
        other = _make_user("09120000004", User.Role.DOCTOR, "پزشک دیگر")
        resp = self.client.post(
            reverse("prescribe-videos"),
            data={
                "patient_id": str(other.id),
                "video_ids": [str(self.video.id)],
                "due_date": "2026-12-01",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 404)