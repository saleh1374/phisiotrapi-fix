import type { Metadata } from "next";
import Image from "next/image";
import { HeartPulse, ShieldCheck, Sparkles } from "lucide-react";

import CredentialsAuthForm from "@/components/CredentialsAuthForm";

export const metadata: Metadata = {
  title: "ثبت‌نام",
  description: "ثبت‌نام در کلینیک فیزیوتراپی",
};

export default function RegisterPage() {
  return (
    <section className="mx-auto flex min-h-[85vh] w-full max-w-6xl items-center justify-center px-4 py-12 sm:px-6">
      <div className="grid w-full items-center gap-10 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden rounded-3xl shadow-2xl lg:block">
          <Image
            src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&q=70"
            alt="تمرینات توانبخشی"
            width={900}
            height={700}
            className="aspect-[4/5] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald/90 via-emerald/20 to-transparent" />
          <div className="absolute bottom-0 p-8 text-white">
            <h1 className="text-2xl font-black">به جمع ما بپیوندید ✨</h1>
            <p className="mt-2 text-sm leading-7 text-white/85">
              ثبت‌نام با نام کاربری و رمز عبور یا حساب گوگل، فقط در چند ثانیه.
              حساب شما ساخته می‌شود و به تمام خدمات کلینیک دسترسی خواهید داشت.
            </p>
            <div className="mt-4 flex gap-4 text-white/85">
              <span className="flex items-center gap-1.5 text-xs">
                <ShieldCheck className="h-4 w-4" /> امن و بدون نیاز به شماره موبایل
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <HeartPulse className="h-4 w-4" /> سلامتی شما مهم است
              </span>
            </div>
          </div>
        </div>
        <CredentialsAuthForm mode="register" />
      </div>
    </section>
  );
}