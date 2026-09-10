"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone, Stethoscope } from "lucide-react";
import Link from "next/link";

import { apiFetch } from "@/lib/api";

interface PublicSettings {
  site_name: string;
  site_tagline: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  working_hours: string;
}

export default function Footer() {
  const { data } = useQuery({
    queryKey: ["footer-settings"],
    queryFn: () => apiFetch<PublicSettings>("/public/settings/", {}, false),
    staleTime: 5 * 60_000,
  });

  const siteName = data?.site_name || "کلینیک فیزیوتراپی";
  const parts = siteName.trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts.pop() : siteName;

  return (
    <footer className="mt-16 bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald text-lg font-black">
              ف
            </span>
            {parts.join(" ")} <span className="text-gold">{lastName}</span>
          </p>
          <p className="mt-3 text-sm leading-7 text-white/70">
            {data?.site_tagline ||
              "ارائه‌دهنده خدمات تخصصی فیزیوتراپی، توانبخشی و آموزش‌های تخصصی با کادری مجرب و تجهیزات به‌روز."}
          </p>
        </div>

        <div>
          <p className="font-bold">دسترسی سریع</p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>
              <Link href="/appointment" title="رزرو نوبت آنلاین" className="hover:text-gold">
                رزرو نوبت آنلاین
              </Link>
            </li>
            <li>
              <Link href="/videos" title="فیلم‌های آموزشی" className="hover:text-gold">
                فیلم‌های آموزشی
              </Link>
            </li>
            <li>
              <Link href="/academy" title="دوره‌های آموزشی" className="hover:text-gold">
                دوره‌های آموزشی
              </Link>
            </li>
            <li>
              <Link href="/magazine" title="مجله علمی" className="hover:text-gold">
                مجله علمی
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-bold">خدمات</p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-gold" /> لیزرتراپی
            </li>
            <li className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-gold" /> تکارتراپی
            </li>
            <li className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-gold" /> طب سوزنی
            </li>
            <li className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-gold" /> ورزش درمانی
            </li>
          </ul>
        </div>

        <div>
          <p className="font-bold">تماس با ما</p>
          <ul className="mt-3 space-y-3 text-sm text-white/70">
            {data?.address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {data.address}
              </li>
            )}
            {data?.contact_phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-gold" />
                <span dir="ltr">{data.contact_phone}</span>
              </li>
            )}
            {data?.contact_email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-gold" />
                <span dir="ltr">{data.contact_email}</span>
              </li>
            )}
            {data?.working_hours && (
              <li className="text-xs text-white/50">{data.working_hours}</li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {siteName} — تمامی حقوق محفوظ است.
      </div>
    </footer>
  );
}