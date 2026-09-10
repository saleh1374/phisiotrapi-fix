"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Mail, Save, Settings as SettingsIcon, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch, errorMessage } from "@/lib/api";
import { btnPrimary, inputCls, labelCls } from "@/lib/admin";

interface Settings {
  site_name: string;
  site_tagline: string;
  site_description: string;
  announcement: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  working_hours: string;
  otp_backend: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_use_tls: boolean;
  email_from: string;
  google_client_id: string;
  smtp_password_set: boolean;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Settings | null>(null);
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiFetch<Settings>("/admin/settings/"),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch("/admin/settings/", {
        method: "PUT",
        body: JSON.stringify({ ...form, smtp_password: password }),
      }),
    onSuccess: () => {
      setSaved(true);
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setTimeout(() => setSaved(false), 4000);
    },
    onError: (e) => alert(errorMessage((e as { data?: unknown }).data, "خطا در ذخیره تنظیمات")),
  });

  if (!form) {
    return <p className="py-10 text-center text-navy/50">در حال بارگذاری تنظیمات...</p>;
  }

  const set = (key: keyof Settings, value: string | number | boolean) =>
    setForm({ ...form, [key]: value });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-black">تنظیمات سایت</h1>
      <p className="mt-1 text-sm text-navy/60">
        همه‌چیز از اطلاعات تماس تا روش ارسال کد تایید را از اینجا مدیریت کن
      </p>

      {/* Identity */}
      <section className="mt-6 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold">
          <SettingsIcon className="h-5 w-5 text-emerald" />
          مشخصات سایت
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>نام سایت</label>
            <input className={inputCls} value={form.site_name} onChange={(e) => set("site_name", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>شعار</label>
            <input className={inputCls} value={form.site_tagline} onChange={(e) => set("site_tagline", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>توضیحات سایت</label>
            <textarea rows={2} className={inputCls} value={form.site_description} onChange={(e) => set("site_description", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>اعلان سراسری (بنر بالای سایت — خالی = بدون بنر)</label>
            <input className={inputCls} value={form.announcement} onChange={(e) => set("announcement", e.target.value)} placeholder="مثلاً: کلینیک روزهای پنجشنبه تعطیل است" />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mt-5 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold">
          <Smartphone className="h-5 w-5 text-emerald" />
          اطلاعات تماس
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>تلفن تماس</label>
            <input className={inputCls} value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>ایمیل تماس</label>
            <input dir="ltr" className={inputCls} value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>آدرس</label>
            <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>ساعات کاری</label>
            <input className={inputCls} value={form.working_hours} onChange={(e) => set("working_hours", e.target.value)} />
          </div>
        </div>
      </section>

      {/* OTP delivery */}
      <section className="mt-5 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold">
          <Mail className="h-5 w-5 text-emerald" />
          ارسال کد تایید (ورود با کد)
        </h2>
        <p className="mt-1 text-xs leading-6 text-navy/50">
          «کنسول» کد را در لاگ سرور چاپ می‌کند (توسعه). «ایمیل» کد را با SMTP — مثلاً یک اکانت
          جیمیل با App Password — به ایمیل کاربر می‌فرستد.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>روش ارسال</label>
            <select className={inputCls} value={form.otp_backend} onChange={(e) => set("otp_backend", e.target.value)}>
              <option value="console">چاپ در کنسول (توسعه)</option>
              <option value="email">ارسال با ایمیل (SMTP)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>SMTP هاست</label>
            <input dir="ltr" className={inputCls} value={form.smtp_host} onChange={(e) => set("smtp_host", e.target.value)} placeholder="smtp.gmail.com" />
          </div>
          <div>
            <label className={labelCls}>پورت</label>
            <input type="number" className={inputCls} value={form.smtp_port} onChange={(e) => set("smtp_port", Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>نام کاربری (ایمیل فرستنده)</label>
            <input dir="ltr" className={inputCls} value={form.smtp_user} onChange={(e) => set("smtp_user", e.target.value)} placeholder="you@gmail.com" />
          </div>
          <div>
            <label className={labelCls}>رمز (App Password)</label>
            <input
              dir="ltr"
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={form.smtp_password_set ? "•••••••• (ذخیره شده — برای تغییر وارد کن)" : "رمز جدید"}
            />
          </div>
          <div>
            <label className={labelCls}>فرستنده (From — اختیاری)</label>
            <input dir="ltr" className={inputCls} value={form.email_from} onChange={(e) => set("email_from", e.target.value)} />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm font-bold text-navy/80">
              <input type="checkbox" checked={form.smtp_use_tls} onChange={(e) => set("smtp_use_tls", e.target.checked)} className="h-5 w-5 accent-emerald" />
              استفاده از TLS
            </label>
          </div>
        </div>
      </section>

      {/* Google */}
      <section className="mt-5 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <h2 className="font-bold">ورود با گوگل</h2>
        <div className="mt-4">
          <label className={labelCls}>Google OAuth Client ID</label>
          <input dir="ltr" className={inputCls} value={form.google_client_id} onChange={(e) => set("google_client_id", e.target.value)} placeholder="1234567890-xxx.apps.googleusercontent.com" />
          <p className="mt-1.5 text-xs text-navy/50">
            برای نمایش عمومی. (دکمهٔ گوگل در فرانت‌اند با متغیر NEXT_PUBLIC_GOOGLE_CLIENT_ID کنترل می‌شود.)
          </p>
        </div>
      </section>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className={btnPrimary}
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          ذخیره تنظیمات
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-bold text-emerald">
            <CheckCircle2 className="h-4 w-4" />
            ذخیره شد
          </span>
        )}
      </div>
    </div>
  );
}