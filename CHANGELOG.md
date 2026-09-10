# 📋 Changelog — اصلاحات و بهبودها

## [1.1.0] — اصلاحات امنیتی، باگ‌ها و زیرساخت

### 🔴 امنیت (بحرانی)

1. **SECRET_KEY ناامن** — مقدار پیش‌فرض حذف شد. در حالت تولید بدون تنظیم `DJANGO_SECRET_KEY` سرور بالا نمیاد.
2. **DEBUG/ALLOWED_HOSTS** — در حالت تولید `DEBUG=True` یا `ALLOWED_HOSTS=*` باعث خطا میشه.
3. **Access Token** — از ۲۴ ساعت به ۳۰ دقیقه کاهش یافت.
4. **Google token verification** — از کتابخانه `google-auth` برای تایید رمزنگاری توکن استفاده میشه (fallback به tokeninfo برای dev).
5. **OTP timing attack** — مقایسه کد OTP با `hmac.compare_digest` (constant-time).
6. **Runtime settings mutation** — تابع `_send_otp_email` دیگه تنظیمات جنگو رو تغییر نمیده. از `get_connection()` استفاده میکنه.
7. **PasswordLoginView** — از `authenticate()` استفاده میکنه به جای `check_password()` دستی.
8. **هدرهای امنیتی** — در حالت تولید: HSTS, XSS filter, content-type nosniff, SSL redirect, secure cookies.

### 🟠 زیرساخت

9. **Backend Dockerfile** — از `runserver` به `gunicorn` تغییر کرد (پروداکشن).
10. **Frontend Dockerfile** — multi-stage build با `npm run build` + standalone server.
11. **docker-compose.yml** — پورت‌های PostgreSQL و Redis دیگه expose نمیشن.
12. **celery-beat** — healthcheck اضافه شد.
13. **docker-compose.prod.yml** — فایل جدای پروداکشن اضافه شد.

### 🟡 باگ‌های منطقی

14. **نقشه روز هفته (بحرانی!)** — تابع `_persian_weekday()` اضافه شد. تقویم شمسی (شنبه=0) حالا درست به Python weekday (دوشنبه=0) مپ میشه. فرمول: `(python_weekday + 2) % 7`
15. **Race condition** — `book_appointment()` حالا availability رو داخل lock با استفاده از `_build_free_slots()` بررسی میکنه (نه با صدا زدن `free_slots()` که خودش query میزد).
16. **is_new flag** — از مقایسه شکننده `created_at == last_login` به بررسی معتبرتر تغییر کرد.
17. **MyCoursesView** — دوره‌های رایگان حالا در لیست دوره‌های کاربر نمایش داده میشن.

### 🔵 کیفیت کد و معماری

18. **صفحه‌بندی** — `PAGE_SIZE=20` اضافه شد (تمام لیست‌ها).
19. **Exception handler** — `config/exceptions.py` اضافه شد. خطاهای 500 حالا JSON برمیگردن.
20. **لاگینگ** — تنظیمات لاگینگ ساختاریافته برای تمام ماژول‌ها اضافه شد.
21. **Rate limiting** — throttle روی رزرو نوبت (`booking: 10/min`) و ثبت‌نام دوره (`enroll: 10/min`).
22. **next.config.mjs** — `output: "standalone"` + الگوهای تصویر بیشتر (Cloudinary, S3).

### 🟣 عملکرد

23. **available_days()** — بهینه‌سازی N+1 query. تمام schedule، holiday و appointment ها در یک batch لود میشن.
24. **free_slots()** — از `_build_free_slots()` مشترک استفاده میکنه.

### ⚪ جزئیات

25. **اعتبارسنجی کد ملی** — الگوریتم checksum ایرانی به مدل User اضافه شد.
26. **.env.example** — هشدارهای امنیتی اضافه شد.
27. **requirements.txt** — `google-auth` و `gunicorn` اضافه شد.
28. **README** — مستندات امنیت و پروداکشن به‌روزرسانی شد.
