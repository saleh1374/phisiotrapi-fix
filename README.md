# 🩺 کلینیک فیزیوتراپی — پلتفرم جامع

وب‌اپلیکیشن جامع برای یک کلینیک فیزیوتراپی با **چهار ماژول کامل و قابل استفاده**:

1. **سیستم رزرو نوبت هوشمند** 📅 — تقویم شمسی، مدیریت شیفت‌ها و جلوگیری از رزرو همزمان با قفل تراکنشی
2. **کتابخانه فیلم‌های آموزشی** 🎬 — کتابخانه عمومی + تجویز فیلم توسط پزشک و پیگیری پیشرفت بیمار
3. **آکادمی آنلاین تخصصی** 🎓 — فروش دوره‌ها، پیگیری پیشرفت و گواهی‌نامه معتبر با QR کد قابل استعلام
4. **خبرخوان خودکار هوشمند** 📰 — اسکن منابع جهانی (هر ۶ ساعت با Celery)، ترجمه خودکار به فارسی و انتشار پس از تایید

## ✨ امکانات

### رزرو نوبت
- تقویم **شمسی (جلالی)** با نمایش روزهای دارای نوبت خالی و تعطیلات
- انتخاب خدمت (لیزر، تکار، طب سوزنی، ورزش درمانی، معاینه عمومی) → پزشک → تاریخ → ساعت
- **جلوگیری از رزرو همزمان**: تراکنش دیتابیس + قفل ردیفی (Row-Level Lock) + محدودیت UNIQUE
- حداقل ۲ ساعت فاصله با نوبت، لغو آنلاین توسط بیمار، مدیریت وضعیت توسط پزشک (انجام شد / عدم حضور)

### فیلم‌های آموزشی
- کتابخانه عمومی با فیلتر ناحیه بدن و نوع آسیب + پلیر اختصاصی
- تجویز فیلم توسط پزشک با سررسید + دکمه «تمرین را انجام دادم» + نوار پیشرفت

### آکادمی
- دوره‌های رایگان/پولی با فیلتر سطح
- پرداخت شبیه‌سازی‌شده در حالت توسعه (در تولید: اتصال به زرین‌پال)
- پیشرفت خودکار سرفصل‌ها → صدور خودکار **گواهی‌نامه با شماره یکتا و QR کد** + صفحه استعلام اصالت عمومی

### مجله علمی
- اسکن ۳ فید معتبر جهانی، ترجمه با Google/Gemini API (بدون کلید: ترجمه دیکشنری داخلی)
- دسته‌بندی خودکار بر اساس کلمات کلیدی، انتشار پس از تایید ادمین
- اجرای خودکار هر ۶ ساعت با Celery Beat + امکان نوشتن خبر دستی

## 🛠 تکنولوژی‌ها

| بخش | تکنولوژی |
|-----|----------|
| فرانت‌اند | Next.js 14 (App Router)، TypeScript، TailwindCSS v4، RTL + فونت وزیرمتن، Zustand، TanStack Query، React Hook Form + Zod، lucide-react |
| بک‌اند | Django 5، Django REST Framework، JWT (30 min access)، Argon2، Celery + Redis، Gunicorn |
| دیتابیس | PostgreSQL 15+ (در توسعه قابل تعویض با SQLite) |
| زیرساخت | Docker Compose (PostgreSQL + Redis + Backend + Frontend) |

## 🚀 راه‌اندازی سریع

### گزینه ۱ — با Docker (پیشنهادی)

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_demo
```

- فرانت‌اند: http://localhost:3000
- API + Swagger: http://localhost:8000/api/docs/
- پنل ادمین Django: http://localhost:8000/admin/

### گزینه ۲ — بدون Docker (توسعه محلی)

```bash
# بک‌اند
cd backend
python -m venv .venv && source .venv/bin/activate   # ویندوز: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
export DATABASE_ENGINE=sqlite3                       # توسعه سریع بدون PostgreSQL
python manage.py migrate
python manage.py seed_demo
python manage.py runserver

# فرانت‌اند (ترمینال دوم)
cd frontend
npm install
npm run dev
```

## 👤 کاربران نمونه (سیدر)

| نقش | نام کاربری | رمز |
|------|-----------|-----|
| ادمین | `admin` | `admin123` |
| پزشک | `dr.sara` | `demo1234` |
| پزشک دوم | `dr.amir` | `demo1234` |
| بیمار | `ali.rezaei` | `demo1234` |

> در فرم ورود، به‌جای نام کاربری می‌توان شماره موبایل را هم وارد کرد (در صورت ثبت). ورود با گوگل هم در دسترس است (نیازمند `GOOGLE_CLIENT_ID`). در محیط تولید رمز ادمین را حتماً تغییر دهید.

## 📖 مسیرهای اصلی سایت

| مسیر | توضیح |
|------|-------|
| `/` | صفحه اصلی |
| `/appointment` | رزرو نوبت آنلاین (۴ مرحله با تقویم شمسی) |
| `/videos` | کتابخانه فیلم‌های آموزشی |
| `/academy` | فهرست دوره‌ها |
| `/academy/[id]` | جزئیات دوره، خرید و تماشای سرفصل‌ها |
| `/academy/certificates/[number]` | استعلام اصالت گواهی (هدف QR کد) |
| `/magazine` | مجله علمی |
| `/magazine/[id]` | صفحه خبر |
| `/admin` | **پنل مدیریت اختصاصی** (داشبورد با نمودار + مدیریت کامل + تنظیمات سایت) |
| `/dashboard` | داشبورد بیمار (نوبت‌ها / تمرینات / دوره‌ها) |
| `/doctor` | پنل پزشک (نوبت‌ها + تجویز فیلم) |
| `/login` ، `/register` | ورود / ثبت‌نام با نام کاربری و رمز یا گوگل |

## 🔒 امنیت

- ثبت‌نام/ورود با **نام کاربری و رمز عبور** (هش Argon2) + **ورود با گوگل** (تأیید توکن با `google-auth` + fallback به tokeninfo)
- ورود با شماره موبایل و OTP نیز همچنان در API موجود است (اختیاری)
- JWT + Refresh Token (توکن دسترسی ۳۰ دقیقه، چرخش خودکار) و Rate Limit ورود (۵ در دقیقه)
- Rate Limit روی رزرو نوبت و ثبت‌نام دوره (۱۰ در دقیقه)
- مقایسه OTP با `hmac.compare_digest` (مقاوم در برابر timing attack)
- قفل تراکنشی برای جلوگیری از رزرو همزمان + محدودیت UNIQUE در دیتابیس
- CORS محدود، اعتبارسنجی ورودی‌ها در همه API ها + اعتبارسنجی کد ملی
- هدرهای امنیتی در حالت تولید (HSTS, XSS filter, content-type nosniff)
- لاگینگ ساختاریافته برای تمام ماژول‌ها + handler خطای سفارشی DRF

## 🧪 تست‌ها

```bash
cd backend && DATABASE_ENGINE=sqlite3 python manage.py test   # ۳۴ تست
cd frontend && npm run build                                  # تایپ‌چک کامل
```

## 📌 نکات تولید

- **ورود با گوگل**: از کنسول Google Cloud یک OAuth Client ID بسازید و در `GOOGLE_CLIENT_ID` (بک‌اند) و `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (فرانت‌اند) قرار دهید؛ بدون آن دکمه گوگل نمایش داده نمی‌شود — [راهنمای گام‌به‌گام فارسی](docs/google-signin.md)
- اتصال درگاه زرین‌پال: در `academy/services.py` (تابع `grant_access`)
- ترجمه واقعی: کلید `GOOGLE_TRANSLATE_API_KEY` یا `GEMINI_API_KEY` را در `.env` بگذارید
- پیامک واقعی (در صورت فعال‌سازی ورود با موبایل): بک‌اند `OTP_SMS_BACKEND` را از `console` به سرویس پیامکی تغییر دهید
- ویدیوها/تصاویر: آدرس Cloudinary/S3 را در فیلدهای `video_url` / `thumbnail` قرار دهید
- **پروداکشن**: از `docker-compose.prod.yml` استفاده کنید: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`