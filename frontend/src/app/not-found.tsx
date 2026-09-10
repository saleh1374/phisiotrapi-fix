import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-7xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald text-4xl font-black text-white shadow-lg">
        ف
      </div>
      <p className="mt-6 text-7xl font-black text-gold">۴۰۴</p>
      <h1 className="mt-4 text-2xl font-bold">صفحه‌ای که دنبالش بودید پیدا نشد</h1>
      <p className="mt-3 max-w-md leading-8 text-navy/60">
        آدرس وارد شده اشتباه است یا صفحه مورد نظر جابه‌جا شده. به صفحه اصلی
        برگردید و دوباره تلاش کنید.
      </p>
      <Link
        href="/"
        title="بازگشت به صفحه اصلی"
        className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-emerald px-8 text-base font-bold text-white shadow-md transition-colors hover:bg-emerald-light"
      >
        بازگشت به خانه
      </Link>
    </section>
  );
}