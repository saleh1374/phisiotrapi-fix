from django.urls import reverse
from rest_framework.test import APITestCase as TestCase

from accounts.models import User
from siteconfig.models import SiteSetting


def _admin():
    return User.objects.create_user(username="boss", password="secret123", role=User.Role.ADMIN)


def _patient():
    return User.objects.create_user(username="patient1", password="secret123")


class AdminStatsTests(TestCase):
    def test_stats_require_admin(self):
        patient = _patient()
        self.client.force_authenticate(patient)
        resp = self.client.get(reverse("admin-stats"))
        self.assertEqual(resp.status_code, 403)

    def test_stats_for_admin(self):
        self.client.force_authenticate(_admin())
        resp = self.client.get(reverse("admin-stats"))
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertIn("counts", data)
        self.assertIn("series", data)
        self.assertEqual(len(data["series"]), 7)


class AdminSettingsTests(TestCase):
    def test_settings_round_trip_and_public(self):
        self.client.force_authenticate(_admin())
        put = self.client.put(
            reverse("admin-settings"),
            data={"announcement": "تست بنر", "otp_backend": "email"},
            format="json",
        )
        self.assertEqual(put.status_code, 200, put.content)

        s = SiteSetting.get()
        self.assertEqual(s.announcement, "تست بنر")
        self.assertEqual(s.otp_backend, "email")

        public = self.client.get(reverse("public-settings"))
        self.assertEqual(public.status_code, 200)
        self.assertEqual(public.json()["announcement"], "تست بنر")

    def test_settings_password_never_leaked(self):
        s = SiteSetting.get()
        s.smtp_password = "topsecret"
        s.save()
        self.client.force_authenticate(_admin())
        resp = self.client.get(reverse("admin-settings"))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertNotIn("topsecret", str(data))
        self.assertTrue(data["smtp_password_set"])


class AdminUserManagementTests(TestCase):
    def test_update_role_and_guard(self):
        self.client.force_authenticate(_admin())
        patient = _patient()
        resp = self.client.patch(
            reverse("admin-user-detail", args=[patient.id]),
            data={"role": "doctor", "is_active": False},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        patient.refresh_from_db()
        self.assertEqual(patient.role, "doctor")
        self.assertFalse(patient.is_active)