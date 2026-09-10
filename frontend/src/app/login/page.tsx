import type { Metadata } from "next";
import Image from "next/image";
import { CalendarCheck2, GraduationCap, ShieldCheck, Video } from "lucide-react";

import CredentialsAuthForm from "@/components/CredentialsAuthForm";

export const metadata: Metadata = {
  title: "ورود",
  description: "ورود به حساب کاربری کلینیک فیزیوتراپی",
};

export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[85vh] w-full max-w-6xl items-center justify-center px-4 py-12 sm:px-6">
      <div className="grid w-full items-center gap-10 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden rounded-3xl shadow-2xl lg:block">
          <Image
            src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=70"
            alt="ورزش درمانی در کلینیک"
            width={900}
            height={700}
            className="aspect-[4/5] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/90 via-navy-dark/20 to-transparent" />
          <div className="absolute bottom-0 p-8 text-white">
            <h1 className="text-2xl font-black">خوش آمدید 🌿</h1>
            <p className="mt-2 text-sm leading-7 text-white/80">
              با نام کاربری و رمز عبور یا حساب گوگل وارد شوید؛ نوبت رزرو کنید،
              فیلم‌های تجویزی پزشک را ببینید و به دوره‌های آکادمی دسترسی داشته باشید.
            </p>
            <div className="mt-4 flex gap-4 text-white/70">
              <span className="flex items-center gap-1.5 text-xs">
                <CalendarCheck2 className="h-4 w-4" /> رزرو آنلاین
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <Video className="h-4 w-4" /> تمرینات اختصاصی
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <GraduationCap className="h-4 w-4" /> گواهی معتبر
              </span>
            </div>
          </div>
        </div>
        <CredentialsAuthForm mode="login" />
      </div>
    </section>
  );
}