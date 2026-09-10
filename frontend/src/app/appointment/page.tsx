"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import JalaliCalendar, { faLongDate } from "@/components/JalaliCalendar";
import EmptyState from "@/components/EmptyState";
import { apiFetch, errorMessage } from "@/lib/api";
import { cn, faNum } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import type { User } from "@/types";

const SERVICES = [
  "لیزر",
  "تکار",
  "طب سوزنی",
  "ورزش درمانی",
  "معاینه عمومی",
];

interface Doctor extends User {
  specialty: string;
}

interface Slot {
  start: string;
  end: string;
}

export default function AppointmentPage() {
  const router = useRouter();
  const { accessToken, hasHydrated } = useAuthStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [service, setService] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    date: string;
    start: string;
    doctorName: string;
    service: string;
  } | null>(null);

  useEffect(() => {
    if (hasHydrated && !accessToken) router.replace("/login");
  }, [accessToken, hasHydrated, router]);

  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => apiFetch<Doctor[]>("/appointments/doctors/", {}, false),
  });

  const { data: availableDays = [], isLoading: loadingDays } = useQuery({
    queryKey: ["available-days", doctor?.id],
    queryFn: () =>
      apiFetch<{ date: string; free_slots: number }[]>(
        `/appointments/doctors/${doctor!.id}/available-days/`,
        {},
        false
      ),
    enabled: !!doctor,
  });

  const availableMap = useMemo(
    () => new Map(availableDays.map((d) => [d.date, d.free_slots])),
    [availableDays]
  );

  const { data: slots = [], isFetching: loadingSlots } = useQuery({
    queryKey: ["slots", doctor?.id, date],
    queryFn: () =>
      apiFetch<Slot[]>(
        `/appointments/doctors/${doctor!.id}/slots/?date=${date}`,
        {},
        false
      ),
    enabled: !!doctor && !!date,
  });

  const confirmBooking = async () => {
    if (!doctor || !date || !slot) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/appointments/book/", {
        method: "POST",
        body: JSON.stringify({
          doctor_id: doctor.id,
          service_type: service,
          appointment_date: date,
          start_time: slot,
          description,
        }),
      });
      setSuccess({
        date,
        start: slot,
        doctorName: doctor.full_name || doctor.phone_number,
        service: service ?? "",
      });
    } catch (e) {
      setError(errorMessage((e as { data?: unknown }).data, "خطا در ثبت نوبت"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!accessToken) return null;

  if (success) {
    return (
      <section className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-emerald/20 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald/10">
            <CheckCircle2 className="h-10 w-10 text-emerald" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-emerald">نوبت شما ثبت شد 🎉</h1>
          <p className="mt-3 text-navy/60">جزئیات نوبت شما:</p>
          <div className="mt-5 space-y-3 rounded-2xl bg-cream p-5 text-right">
            <p className="flex items-center gap-2 font-semibold">
              <CalendarDays className="h-5 w-5 text-emerald" />
              {faLongDate(success.date)}
            </p>
            <p className="flex items-center gap-2 font-semibold">
              <Clock className="h-5 w-5 text-emerald" />
              ساعت {faNum(success.start)}
            </p>
            <p className="flex items-center gap-2 font-semibold">
              <UserRound className="h-5 w-5 text-emerald" />
              {success.doctorName}
            </p>
            <p className="flex items-center gap-2 font-semibold">
              <Stethoscope className="h-5 w-5 text-emerald" />
              {success.service}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald px-8 text-base font-bold text-white shadow-md hover:bg-emerald-light"
          >
            مشاهده نوبت‌های من
          </button>
        </div>
      </section>
    );
  }

  const progressLabel =
    step === 1 ? "انتخاب خدمت" : step === 2 ? "انتخاب پزشک" : step === 3 ? "انتخاب تاریخ" : "انتخاب ساعت";

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-black">رزرو نوبت آنلاین</h1>
      <p className="mt-2 text-navy/60">در ۴ مرحله، نوبت خود را رزرو کنید</p>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
        {["انتخاب خدمت", "انتخاب پزشک", "انتخاب تاریخ", "انتخاب ساعت"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap",
                step === i + 1 ? "bg-emerald text-white" : i + 1 < step ? "bg-emerald/15 text-emerald" : "bg-navy/5 text-navy/50"
              )}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
                {faNum(i + 1)}
              </span>
              {label}
            </div>
            {i < 3 && <div className="h-px w-6 bg-navy/10" />}
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm font-bold text-navy/70">
        مرحله {faNum(step)}: {progressLabel}
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Step 1 — service */}
      {step === 1 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setService(s);
                setStep(2);
              }}
              className="group flex min-h-24 items-center justify-between rounded-2xl border border-navy/10 bg-white p-5 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald/40 hover:shadow-md"
            >
              <span className="text-2xl">
                {s === "لیزر" ? "💡" : s === "تکار" ? "⚡" : s === "طب سوزنی" ? "📍" : s === "ورزش درمانی" ? "🏃" : "🩺"}
              </span>
              <span className="text-base font-bold">{s}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2 — doctor */}
      {step === 2 && (
        <div className="mt-4 space-y-3">
          {loadingDoctors ? (
            <p className="flex items-center gap-2 text-navy/50">
              <Loader2 className="h-5 w-5 animate-spin" /> در حال بارگذاری پزشکان...
            </p>
          ) : (
            doctors.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setDoctor(d);
                  setDate(null);
                  setSlot(null);
                  setStep(3);
                }}
                className="flex w-full items-center gap-4 rounded-2xl border border-navy/10 bg-white p-5 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald/40 hover:shadow-md"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald/10 text-2xl">
                  👩‍⚕️
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{d.full_name}</p>
                  <p className="mt-1 text-sm text-emerald">{d.specialty || "فیزیوتراپیست"}</p>
                </div>
                <ArrowRight className="h-5 w-5 rotate-180 text-navy/30" />
              </button>
            ))
          )}
        </div>
      )}

      {/* Step 3 — date (Jalali calendar) */}
      {step === 3 && doctor && (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            {loadingDays ? (
              <p className="flex items-center gap-2 text-navy/50">
                <Loader2 className="h-5 w-5 animate-spin" /> در حال بارگذاری تقویم...
              </p>
            ) : availableDays.length === 0 ? (
              <EmptyState
                icon="🗓️"
                title="نوبت خالی یافت نشد"
                description="این پزشک در ۳۰ روز آینده نوبت خالی ندارد. لطفاً پزشک یا تاریخ دیگری انتخاب کنید."
                action={
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex min-h-12 items-center rounded-xl bg-emerald px-6 text-sm font-bold text-white"
                  >
                    انتخاب پزشک دیگر
                  </button>
                }
              />
            ) : (
              <JalaliCalendar
                availableDays={availableMap}
                selectedDate={date}
                onSelect={(d) => {
                  setDate(d);
                  setSlot(null);
                  setStep(4);
                }}
              />
            )}
          </div>
          <div className="rounded-2xl border border-navy/10 bg-cream p-5">
            <p className="text-sm font-bold text-navy/70">پزشک انتخاب‌شده</p>
            <p className="mt-2 font-bold">{doctor.full_name}</p>
            <p className="mt-1 text-sm text-navy/60">{doctor.specialty || "فیزیوتراپیست"}</p>
            {doctor.bio && <p className="mt-3 text-sm leading-6 text-navy/60">{doctor.bio}</p>}
          </div>
        </div>
      )}

      {/* Step 4 — slot */}
      {step === 4 && doctor && date && (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 font-bold">{faLongDate(date)}</p>
            {loadingSlots ? (
              <p className="flex items-center gap-2 text-navy/50">
                <Loader2 className="h-5 w-5 animate-spin" /> در حال بررسی ساعات خالی...
              </p>
            ) : slots.length === 0 ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                متاسفانه این زمان پر شد؛ لطفاً تاریخ دیگری انتخاب کنید
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {slots.map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    onClick={() => setSlot(s.start)}
                    className={cn(
                      "min-h-12 rounded-xl border px-3 py-2 text-sm font-bold transition-colors",
                      slot === s.start
                        ? "border-emerald bg-emerald text-white shadow-md"
                        : "border-navy/15 bg-white text-navy hover:border-emerald/40"
                    )}
                  >
                    {faNum(s.start)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">توضیحات (اختیاری)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="مثلاً: شدت درد هنگام بلند کردن اجسام زیاد می‌شود..."
              className="w-full rounded-xl border border-navy/20 px-4 py-3 text-sm outline-none transition-colors focus:border-emerald"
            />
            <button
              type="button"
              disabled={!slot || submitting}
              onClick={confirmBooking}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald px-6 text-base font-bold text-white shadow-md hover:bg-emerald-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
              تایید نهایی و ثبت نوبت
            </button>
            {slot && (
              <p className="mt-3 text-center text-sm text-navy/60">
                نوبت شما: {faLongDate(date)} — ساعت {faNum(slot)}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}