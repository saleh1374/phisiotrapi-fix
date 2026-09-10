from unittest.mock import patch

from rest_framework.test import APITestCase as TestCase
from django.urls import reverse

from accounts.models import OTP, User


class OTPAuthFlowTests(TestCase):
    def _request_otp(self, phone: str = "09123456789"):
        resp = self.client.post(
            reverse("otp-request"),
            data={"phone_number": phone},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        return OTP.objects.filter(phone_number=phone, is_used=False).latest("created_at")

    def test_otp_request_and_verify_registers_user(self):
        otp = self._request_otp()

        resp = self.client.post(
            reverse("otp-verify"),
            data={
                "phone_number": "09123456789",
                "code": otp.code,
                "full_name": "تست کاربر",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertIn("tokens", data)
        self.assertIn("access", data["tokens"])
        self.assertEqual(data["user"]["role"], "patient")

        user = User.objects.get(phone_number="09123456789")
        self.assertEqual(user.full_name, "تست کاربر")
        self.assertTrue(user.is_active)

    def test_is_new_flag_true_only_on_first_login(self):
        otp = self._request_otp()
        payload = {
            "phone_number": "09123456789",
            "code": otp.code,
        }
        first = self.client.post(reverse("otp-verify"), data=payload, format="json")
        self.assertEqual(first.status_code, 200, first.content)
        self.assertTrue(first.json()["is_new"])

        # A second login for the same phone must not be flagged as new.
        second_otp = self._request_otp()
        second = self.client.post(
            reverse("otp-verify"),
            data={"phone_number": "09123456789", "code": second_otp.code},
            format="json",
        )
        self.assertEqual(second.status_code, 200, second.content)
        self.assertFalse(second.json()["is_new"])

    def test_otp_is_single_use(self):
        otp = self._request_otp()
        payload = {
            "phone_number": "09123456789",
            "code": otp.code,
        }
        first = self.client.post(reverse("otp-verify"), data=payload, format="json")
        self.assertEqual(first.status_code, 200)

        # Replaying the same code must fail.
        replay = self.client.post(reverse("otp-verify"), data=payload, format="json")
        self.assertEqual(replay.status_code, 400)

    def test_wrong_code_fails_and_counts_attempts(self):
        otp = self._request_otp()

        resp = self.client.post(
            reverse("otp-verify"),
            data={"phone_number": "09123456789", "code": "000000"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

        otp.refresh_from_db()
        self.assertEqual(otp.attempts, 1)
        self.assertFalse(otp.is_used)

    def test_invalid_phone_rejected(self):
        resp = self.client.post(
            reverse("otp-request"),
            data={"phone_number": "12345"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_password_login_with_username(self):
        user = User.objects.create_user(username="sara", phone_number="09120000000", password="secret123")
        user.role = User.Role.ADMIN
        user.save()

        resp = self.client.post(
            reverse("login"),
            data={"username": "sara", "password": "secret123"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertIn("access", resp.json()["tokens"])

        # The phone number still works as the login identifier.
        by_phone = self.client.post(
            reverse("login"),
            data={"username": "09120000000", "password": "secret123"},
            format="json",
        )
        self.assertEqual(by_phone.status_code, 200, by_phone.content)

        bad = self.client.post(
            reverse("login"),
            data={"username": "sara", "password": "wrong"},
            format="json",
        )
        self.assertEqual(bad.status_code, 400)

    def test_me_requires_auth(self):
        resp = self.client.get(reverse("me"))
        self.assertEqual(resp.status_code, 401)


class RegisterTests(TestCase):
    def test_register_with_username_and_password(self):
        resp = self.client.post(
            reverse("register"),
            data={
                "username": "ali.rezaei",
                "password": "secret123",
                "full_name": "علی رضایی",
                "email": "ali@example.com",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        data = resp.json()
        self.assertTrue(data["is_new"])
        self.assertEqual(data["user"]["username"], "ali.rezaei")
        self.assertEqual(data["user"]["role"], "patient")
        self.assertIn("access", data["tokens"])

        user = User.objects.get(username="ali.rezaei")
        self.assertTrue(user.check_password("secret123"))
        self.assertIsNone(user.phone_number)

    def test_register_duplicate_username_rejected(self):
        payload = {"username": "ali.rezaei", "password": "secret123"}
        self.client.post(reverse("register"), data=payload, format="json")
        dup = self.client.post(reverse("register"), data=payload, format="json")
        self.assertEqual(dup.status_code, 400)

    def test_register_short_password_rejected(self):
        resp = self.client.post(
            reverse("register"),
            data={"username": "ali.rezaei", "password": "short"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)


class GoogleAuthTests(TestCase):
    @patch("accounts.services.verify_google_token")
    def test_google_auth_registers_new_user(self, mock_verify):
        mock_verify.return_value = {
            "email": "Sara@gmail.com",
            "name": "سارا محمدی",
            "aud": "client-id",
        }
        resp = self.client.post(
            reverse("google-auth"),
            data={"id_token": "fake-token"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertTrue(data["is_new"])
        self.assertEqual(data["user"]["email"], "sara@gmail.com")
        self.assertEqual(data["user"]["username"], "sara")
        self.assertIn("access", data["tokens"])

    @patch("accounts.services.verify_google_token")
    def test_google_auth_logs_in_existing_user(self, mock_verify):
        user = User.objects.create_user(
            username="sara", email="sara@gmail.com", full_name="سارا"
        )
        mock_verify.return_value = {"email": "sara@gmail.com", "name": "سارا محمدی"}
        resp = self.client.post(
            reverse("google-auth"),
            data={"id_token": "fake-token"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertFalse(resp.json()["is_new"])
        self.assertEqual(resp.json()["user"]["id"], str(user.id))

    @patch("accounts.services.verify_google_token")
    def test_google_auth_rejects_invalid_token(self, mock_verify):
        mock_verify.side_effect = ValueError("توکن گوگل نامعتبر است")
        resp = self.client.post(
            reverse("google-auth"),
            data={"id_token": "garbage"},
            format="json",
        )
        self.assertEqual(resp.status_code, 401)


class UserManagerTests(TestCase):
    def test_phone_normalization(self):
        user = User.objects.create_user(phone_number="+98 912 000 0000", password="x")
        self.assertEqual(user.phone_number, "09120000000")

    def test_create_superuser(self):
        admin = User.objects.create_superuser(phone_number="09121111111", password="x")
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertEqual(admin.role, User.Role.ADMIN)