import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CalendarCheck2,
  Dumbbell,
  GraduationCap,
  MapPin,
  Newspaper,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Video,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: CalendarCheck2,
    title: "رزرو نوبت هوشمند",
    desc: "انتخاب پزشک، تاریخ و ساعت با تقویم شمسی؛ بدون نیاز به تماس تلفنی و با جلوگیری از رزرو همزمان.",
  },
  {
    icon: Video,
    title: "فیلم‌های آموزشی اختصاصی",
    desc: "تمرینات تجویز شده توسط پزشک، همراه با پیگیری خودکار پیشرفت شما.",
  },
  {
    icon: GraduationCap,
    title: "آکادمی تخصصی",
    desc: "دوره‌های آموزشی فیزیوتراپی با گواهی‌نامه معتبر و کد اصالت قابل استعلام.",
  },
  {
    icon: Newspaper,
    title: "مجله علمی",
    desc: "جدیدترین تحقیقات و متدهای روز جهان، اسکن و ترجمه شده به فارسی روان.",
  },
];

const SERVICES = [
  { name: "لیزرتراپی", icon: Sparkles },
  { name: "تکارتراپی", icon: Zap },
  { name: "طب سوزنی", icon: MapPin },
  { name: "ورزش درمانی", icon: Dumbbell },
  { name: "معاینه عمومی", icon: Stethoscope },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["LocalBusiness", "MedicalClinic"],
      name: "کلینیک فیزیوتراپی",
      description: "کلینیک تخصصی فیزیوتراپی با خدمات لیزر، تکار، طب سوزنی و ورزش درمانی",
      telephone: "+98-21-88776655",
      address: {
        "@type": "PostalAddress",
        streetAddress: "خیابان آزادی، پلاک ۱۲۳",
        addressLocality: "تهران",
        addressCountry: "IR",
      },
      openingHours: "Sa-Th 09:00-20:00",
      priceRange: "$$",
    },
    {
      "@type": "Physician",
      name: "دکتر سارا محمدی",
      specialty: "فیزیوتراپی ورزشی",
      worksFor: { "@type": "MedicalClinic", name: "کلینیک فیزیوتراپی" },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy to-navy-light text-white">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=70"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald/30 px-4 py-1.5 text-sm font-semibold text-emerald-light ring-1 ring-emerald/40">
              <ShieldCheck className="h-4 w-4" />
              کلینیک تخصصی فیزیوتراپی و توانبخشی
            </span>
            <h1 className="mt-5 font-black leading-snug">
              سلامتی شما،
              <br />
              اولویت ماست 🌿
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/75 sm:text-lg">
              رزرو نوبت آنلاین با تقویم شمسی، فیلم‌های آموزشی اختصاصی، دوره‌های
              تخصصی با گواهی معتبر و جدیدترین اخبار دنیای فیزیوتراپی — همه در
              یک پلتفرم.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/appointment"
                title="رزرو نوبت آنلاین"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald px-6 text-base font-bold text-white shadow-lg transition-colors hover:bg-emerald-light"
              >
                <CalendarCheck2 className="h-5 w-5" />
                رزرو نوبت
              </Link>
              <Link
                href="/videos"
                title="کتابخانه فیلم‌ها"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/25 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                <PlayCircle className="h-5 w-5" />
                فیلم‌های آموزشی
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/20">
              <Image
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=900&q=70"
                alt="جلسه فیزیوتراپی بیمار در کلینیک"
                width={900}
                height={600}
                priority
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["+۱۲", "سال سابقه"],
                ["+۸هزار", "بیمار موفق"],
                ["+۲۰", "پزشک متخصص"],
                ["٪۹۵", "رضایت بیماران"],
              ].map(([num, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur">
                  <p className="text-xl font-black text-gold sm:text-2xl">{num}</p>
                  <p className="mt-1 text-xs text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-bold">خدمات کلینیک</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-navy/60">
          درمان تخصصی با به‌روزترین تجهیزات و روش‌های علمی روز دنیا
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SERVICES.map((s) => (
            <div
              key={s.name}
              className="rounded-2xl border border-navy/10 bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                <s.icon className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-bold">{s.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features with image */}
      <section id="features" className="bg-cream py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center font-bold">چهار ماژول اصلی پلتفرم</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-navy/60">
            از رزرو نوبت تا آموزش و پیگیری — یک تجربه کامل و یکپارچه
          </p>
          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald text-white">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-7 text-navy/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Appointment showcase */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative order-2 overflow-hidden rounded-3xl shadow-xl lg:order-1">
            <Image
              src="https://images.unsplash.com/photo-1579154204601-01588f351e67?w=900&q=70"
              alt="فیزیوتراپیست در حال درمان بیمار"
              width={900}
              height={600}
              className="aspect-[3/2] w-full object-cover"
            />
          </div>
          <div className="order-1 lg:order-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald/10 px-4 py-1.5 text-sm font-bold text-emerald">
              <CalendarCheck2 className="h-4 w-4" />
              رزرو هوشمند
            </span>
            <h2 className="mt-4 font-bold">نوبت بگیرید، بدون تماس تلفنی 📅</h2>
            <ul className="mt-5 space-y-3 text-navy/70">
              {[
                "تقویم شمسی با نمایش روزهای دارای نوبت خالی",
                "انتخاب خدمت، پزشک، تاریخ و ساعت در ۴ مرحله",
                "جلوگیری از رزرو همزمان با قفل تراکنشی دیتابیس",
                "لغو آنلاین نوبت و پیگیری تاریخچه درمان",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald" />
                  <span className="leading-7">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/appointment"
              title="رزرو نوبت آنلاین"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald px-6 text-base font-bold text-white shadow-md transition-colors hover:bg-emerald-light"
            >
              همین حالا رزرو کنید
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Academy teaser */}
      <section id="academy" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-emerald to-emerald-light text-white shadow-xl">
          <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold">
                <Award className="h-4 w-4" />
                گواهی‌نامه معتبر با QR کد
              </span>
              <h2 className="mt-4 font-bold">آکادمی تخصصی فیزیوتراپی 🎓</h2>
              <p className="mt-3 leading-8 text-white/85">
                دوره‌های آموزشی از مقدماتی تا تخصصی با مدرسان مجرب. پس از اتمام
                ۱۰۰٪ دوره، گواهی‌نامه رسمی با شماره یکتا و کد اصالت دریافت
                می‌کنید که با اسکن QR قابل استعلام است.
              </p>
              <Link
                href="/academy"
                title="مشاهده دوره‌ها"
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 text-base font-bold text-emerald shadow-lg transition-transform hover:scale-105"
              >
                مشاهده دوره‌ها
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Image
                src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=70"
                alt="کلاس آموزشی ورزش درمانی"
                width={600}
                height={400}
                className="aspect-[3/2] w-full rounded-2xl object-cover shadow-lg"
              />
              <Image
                src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=70"
                alt="تمرینات توانبخشی"
                width={600}
                height={400}
                className="aspect-[3/2] w-full rounded-2xl object-cover shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Magazine teaser */}
      <section id="magazine" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-1.5 text-sm font-bold text-navy/80">
              <Newspaper className="h-4 w-4" />
              خبرخوان خودکار
            </span>
            <h2 className="mt-4 font-bold">مجله علمی فیزیوتراپی 📰</h2>
            <p className="mt-3 leading-8 text-navy/60">
              معتبرترین منابع جهانی فیزیوتراپی هر ۶ ساعت اسکن می‌شوند؛ مقالات
              به فارسی روان ترجمه و پس از تایید تیم علمی منتشر می‌شوند. همیشه
              از آخرین تحقیقات بالینی باخبر باشید.
            </p>
            <Link
              href="/magazine"
              title="ورود به مجله علمی"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-navy px-6 text-base font-bold text-white shadow-md transition-colors hover:bg-navy-light"
            >
              ورود به مجله
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
          <div className="order-1 overflow-hidden rounded-3xl shadow-xl lg:order-2">
            <Image
              src="https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=900&q=70"
              alt="مجله علمی فیزیوتراپی"
              width={900}
              height={600}
              className="aspect-[3/2] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-navy p-8 text-center text-white sm:p-12">
          <div className="absolute inset-0 opacity-10">
            <Image
              src="https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1600&q=70"
              alt=""
              fill
              className="object-cover"
            />
          </div>
          <div className="relative">
            <h2 className="font-bold">همین حالا نوبت خود را رزرو کنید</h2>
            <p className="mx-auto mt-3 max-w-lg leading-8 text-white/70">
              ثبت‌نام تنها چند ثانیه زمان می‌برد؛ با نام کاربری و رمز عبور یا
              حساب گوگل وارد شوید و از تمام خدمات استفاده کنید.
            </p>
            <Link
              href="/register"
              title="شروع کنید"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold px-8 text-base font-black text-navy shadow-lg transition-colors hover:bg-gold-light"
            >
              شروع کنید
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}