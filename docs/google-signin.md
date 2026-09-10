# ورود با گوگل — راهنمای راه‌اندازی گام‌به‌گام

این راهنما توضیح می‌دهد چطور یک **OAuth Client ID** از کنسول Google Cloud بسازید و دکمهٔ «ورود با گوگل» را در پروژه فعال کنید.

> خلاصهٔ فنی: فرانت‌اند با کتابخانهٔ Google Identity Services (GIS) یک **ID Token** می‌گیرد و به `POST /api/auth/google/` می‌فرستد. بک‌اند آن را با سرویس رسمی Google (tokeninfo) اعتبارسنجی می‌کند و اگر `aud` با `GOOGLE_CLIENT_ID` یکی باشد، کاربر را ساخته/وارد می‌کند و JWT می‌دهد. فقط به «Client ID» نیاز دارید — نه Client Secret و نه Redirect URI.

---

## ۱) ورود به کنسول Google Cloud

1. به [console.cloud.google.com](https://console.cloud.google.com) بروید و با حساب گوگل خود وارد شوید.
2. اگر پروژه‌ای ندارید: از نوار بالای صفحه روی نام پروژه کلیک کنید → **New Project** → یک نام مثل `physio-clinic` بدهید → **Create**.

## ۲) صفحهٔ رضایت (OAuth consent screen)

1. از منوی همبرگری (☰) بروید به: **APIs & Services → OAuth consent screen**.
2. نوع کاربر را **External** انتخاب کنید (برای دمو/توسعه) → **Create**.
3. فرم را پر کنید:
   - **App name**: مثلاً «کلینیک فیزیوتراپی»
   - **User support email**: ایمیل خودتان
   - **Developer contact email**: ایمیل خودتان
4. در بخش **Scopes** تغییری لازم نیست (فقط `email` و `profile` پیش‌فرض کافی است).
5. **Test users**: اگر اپ در حالت Testing است (پیش‌فرض)، ایمیل حساب گوگلی که می‌خواهید با آن وارد شوید را اینجا اضافه کنید. (برای حذف این محدودیت بعداً دکمهٔ **Publish app** را بزنید.)

## ۳) ساخت OAuth Client ID

1. از منو بروید به: **APIs & Services → Credentials**.
2. روی **+ Create Credentials** کلیک کنید → **OAuth client ID**.
3. **Application type**: **Web application**
4. یک نام بدهید (مثلاً `web-client`).
5. در **Authorized JavaScript origins** این آدرس‌ها را اضافه کنید (فقط همین — این پروژه از Redirect URI استفاده نمی‌کند):
   - `http://localhost:3000` (توسعهٔ محلی)
   - اگر سایت واقعی دارید: `https://example.com` (دامنهٔ خودتان)
6. **Create** را بزنید.

## ۴) کپی کردن Client ID

در پنجرهٔ بازشده، رشتهٔ بلندی مثل این نمایش داده می‌شود:

```
1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

این همان **Client ID** است (شبیه ایمیل است ولی یک شناسه است). آن را کپی کنید — در مرحلهٔ بعد به آن نیاز دارید. (Client Secret لازم نیست.)

---

## ۵) تنظیم پروژه

### حالت محلی (بدون داکر)

**بک‌اند** — فایل `backend/.env` (از روی `backend/.env.example` کپی کنید اگر نیست):

```ini
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

**فرانت‌اند** — فایل `frontend/.env.local` (جدید بسازید):

```ini
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

### حالت داکر

فقط در فایل ریشهٔ `.env` (کپی از `.env.example`) قرار دهید — compose آن را به هر دو سرویس می‌رساند:

```ini
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

## ۶) ری‌استارت سرورها

متغیرهای محیطی موقع بالا آمدن سرور خوانده می‌شوند، پس حتماً سرورها را دوباره اجرا کنید:

```bash
# بک‌اند
cd backend && python manage.py runserver
# فرانت‌اند (ترمینال دوم)
cd frontend && npm run dev
```

یا در داکر:

```bash
docker compose up --build
```

## ۷) تست

1. به `http://localhost:3000/login` یا `/register` بروید.
2. زیر فرم، دکمهٔ **«ورود با Google»** را می‌بینید (اگر نمی‌بینید بخش «رفع مشکل» را بخوانید).
3. روی آن کلیک کنید → حساب گوگل خود را انتخاب کنید → باید مستقیم به داشبورد منتقل شوید.
4. اولین ورود، حساب جدید می‌سازد (ایمیل گوگل به‌عنوان ایمیل کاربر ذخیره می‌شود و یوزرنیم خودکار از ایمیل ساخته می‌شود). ورودهای بعدی همان حساب را وارد می‌کند.

---

## 🛠 رفع مشکل

| مشکل | علت | راه‌حل |
|---|---|---|
| دکمهٔ گوگل نمایش داده نمی‌شود | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` خالی است یا سرور ری‌استارت نشده | مقدار را در `.env.local` بگذارید و فرانت‌اند را دوباره اجرا کنید |
| خطای «توکن گوگل برای این اپلیکیشن صادر نشده است» (401) | `GOOGLE_CLIENT_ID` بک‌اند با Client ID واقعی فرق دارد | هر دو env را با همان Client ID کپی‌شده پر کنید و بک‌اند را ری‌استارت کنید |
| خطای «ورود با گوگل هنوز پیکربندی نشده است» | `GOOGLE_CLIENT_ID` در بک‌اند ست نشده | مرحلهٔ ۵ بک‌اند را انجام دهید |
| «Access blocked» از سمت گوگل | اپ در حالت Testing است و ایمیل شما در Test users نیست | ایمیل را به Test users اضافه کنید یا اپ را Publish کنید |
| خطای origin در کنسول گوگل | آدرس دقیق سایت در Authorized JavaScript origins ثبت نشده | `http://localhost:3000` (یا دامنهٔ تولید) را دقیق اضافه کنید |

## 📌 نکتهٔ امنیتی (تولید)

- برای دامنهٔ واقعی، `http://localhost:3000` را از origins حذف کنید و فقط دامنهٔ خودتان را بگذارید.
- اپ را از حالت Testing به **Production** (Publish) ببرید و صفحهٔ رضایت را با اطلاعات واقعی تکمیل کنید.