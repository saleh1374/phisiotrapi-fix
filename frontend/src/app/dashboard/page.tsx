"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  PlayCircle,
  Stethoscope,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { faLongDate } from "@/components/JalaliCalendar";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import VideoPlayer from "@/components/VideoPlayer";
import { apiFetch } from "@/lib/api";
import { cn, faDate, faNum, faPrice } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import type { User } from "@/types";

interface Appointment {
  id: string;
  doctor: User;
  service_type_display: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  status_display: string;
}

interface Prescription {
  id: string;
  video: {
    id: string;
    title: string;
    description: string;
    video_url: string;
    body_part_display: string;
    injury_type_display: string;
    duration_minutes: number;
  };
  doctor_name: string;
  due_date: string;
  is_done: boolean;
  status_display: string;
  progress_note: string;
}

interface MyVideos {
  progress_percent: number;
  total: number;
  done: number;
  items: Prescription[];
}

interface MyCourse {
  id: string;
  title: string;
  final_price: number;
  is_free: boolean;
  level_display: string;
  progress: { percent: number; total: number; completed: number };
}

interface Certificate {
  id: string;
  certificate_number: string;
  course_title: string;
  issue_date: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, accessToken, hasHydrated, clearAuth } = useAuthStore();
  const [tab, setTab] = useState<"appointments" | "exercises" | "courses">("appointments");
  const [playing, setPlaying] = useState<Prescription | null>(null);

  useEffect(() => {
    if (hasHydrated && (!accessToken || !user)) router.replace("/login");
  }, [accessToken, user, hasHydrated, router]);

  const { data: appointments = [] } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () => apiFetch<Appointment[]>("/appointments/mine/"),
    enabled: !!accessToken,
  });

  const { data: myVideos } = useQuery({
    queryKey: ["my-videos"],
    queryFn: () => apiFetch<MyVideos>("/videos/mine/"),
    enabled: !!accessToken && user?.role === "patient",
  });

  const { data: myCourses = [] } = useQuery({
    queryKey: ["my-courses"],
    queryFn: () => apiFetch<MyCourse[]>("/academy/mine/"),
    enabled: !!accessToken && user?.role === "patient",
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["my-certificates"],
    queryFn: () => apiFetch<Certificate[]>("/academy/certificates/"),
    enabled: !!accessToken && user?.role === "patient",
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/appointments/${id}/cancel/`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-appointments"] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/videos/mine/${id}/complete/`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-videos"] }),
  });

  if (!user || !accessToken) return null;

  const upcoming = appointments.filter((a) =>
    ["pending", "confirmed"].includes(a.status)
  );
  const past = appointments.filter((a) => !["pending", "confirmed"].includes(a.status));

  const tabs = [
    { key: "appointments" as const, label: "نوبت‌های من", icon: CalendarDays, count: upcoming.length },
    { key: "exercises" as const, label: "تمرینات من", icon: Video, count: myVideos?.items.length ?? 0 },
    { key: "courses" as const, label: "دوره‌های من", icon: GraduationCap, count: myCourses.length },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      {/* Welcome card */}
      <div className="rounded-2xl bg-gradient-to-l from-navy to-navy-light p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/60">سلام 👋</p>
            <h1 className="mt-1 text-2xl font-black">{user.full_name || faNum(user.phone_number)}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald px-3 py-1 text-xs font-bold">{user.role_display}</span>
              {user.specialty && (
                <span className="rounded-full bg-gold/90 px-3 py-1 text-xs font-bold text-navy">{user.specialty}</span>
              )}
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                عضو از {faDate(user.created_at)}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {(user.role === "doctor" || user.role === "admin") && (
              <Link
                href="/doctor"
                title="پنل پزشک"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-black text-navy transition-colors hover:bg-gold-light"
              >
                <Stethoscope className="h-4 w-4" />
                پنل پزشک
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                clearAuth();
                router.push("/");
              }}
              className="inline-flex min-h-12 items-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white/90 hover:bg-white/10"
            >
              خروج
            </button>
          </div>
        </div>
      </div>

      {/* Patient tabs */}
      {user.role === "patient" && (
        <>
          <div className="mt-8 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold transition-colors",
                  tab === t.key ? "bg-emerald text-white shadow-md" : "bg-navy/5 text-navy/70 hover:bg-navy/10"
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.count > 0 && (
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      tab === t.key ? "bg-white/20" : "bg-navy/10"
                    )}
                  >
                    {faNum(t.count)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Appointments tab */}
          {tab === "appointments" && (
            <div className="mt-6 space-y-3">
              {upcoming.length === 0 && past.length === 0 ? (
                <EmptyState
                  icon="📅"
                  title="هنوز نوبتی ثبت نکرده‌اید"
                  description="در چند ثانیه به‌صورت آنلاین نوبت بگیرید."
                  action={
                    <Link
                      href="/appointment"
                      title="رزرو نوبت"
                      className="inline-flex min-h-12 items-center rounded-xl bg-emerald px-6 text-sm font-bold text-white shadow-md"
                    >
                      رزرو نوبت آنلاین
                    </Link>
                  }
                />
              ) : (
                <>
                  {upcoming.map((a) => (
                    <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-emerald/20 bg-white p-5 shadow-sm">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald/10">
                        <Clock className="h-6 w-6 text-emerald" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{a.doctor.full_name}</p>
                        <p className="mt-0.5 text-sm text-navy/60">
                          {faLongDate(a.appointment_date)} — ساعت {faNum(a.start_time)}
                          <span className="mr-2 rounded-full bg-navy/5 px-2 py-0.5 text-xs font-bold">
                            {a.service_type_display}
                          </span>
                        </p>
                      </div>
                      <StatusBadge status={a.status} label={a.status_display} />
                      <button
                        type="button"
                        onClick={() => cancelMutation.mutate(a.id)}
                        disabled={cancelMutation.isPending}
                        className="inline-flex min-h-11 items-center rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        لغو نوبت
                      </button>
                    </div>
                  ))}
                  {past.length > 0 && (
                    <>
                      <p className="pt-4 text-sm font-bold text-navy/50">تاریخچه نوبت‌ها</p>
                      {past.map((a) => (
                        <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-navy/10 bg-white/60 p-5">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy/5">
                            <CalendarDays className="h-6 w-6 text-navy/40" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold">{a.doctor.full_name}</p>
                            <p className="mt-0.5 text-sm text-navy/60">
                              {faLongDate(a.appointment_date)} — ساعت {faNum(a.start_time)}
                            </p>
                          </div>
                          <StatusBadge status={a.status} label={a.status_display} />
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Exercises tab */}
          {tab === "exercises" && myVideos && (
            <div className="mt-6">
              {myVideos.total > 0 && (
                <div className="mb-6 rounded-2xl border border-navy/10 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">پیشرفت تمرینات</p>
                    <p className="text-sm font-black text-emerald">٪{faNum(myVideos.progress_percent)}</p>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-navy/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-emerald to-emerald-light transition-all"
                      style={{ width: `${myVideos.progress_percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-navy/50">
                    {faNum(myVideos.done)} از {faNum(myVideos.total)} تمرین انجام شده
                  </p>
                </div>
              )}

              {myVideos.items.length === 0 ? (
                <EmptyState
                  icon="🎬"
                  title="تمرینی برای شما تجویز نشده"
                  description="پزشک شما بعد از معاینه، فیلم‌های تمرینی اختصاصی برایتان تجویز می‌کند."
                />
              ) : (
                <div className="space-y-3">
                  {myVideos.items.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald/10">
                        <Video className="h-6 w-6 text-emerald" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{p.video.title}</p>
                        <p className="mt-0.5 text-sm text-navy/60">
                          تجویز توسط {p.doctor_name} — سررسید {faDate(p.due_date)}
                        </p>
                        {p.progress_note && <p className="mt-1 text-sm text-navy/50">📝 {p.progress_note}</p>}
                      </div>
                      <StatusBadge status={p.status_display} label={p.status_display} />
                      {p.is_done ? (
                        <span className="flex items-center gap-1.5 text-sm font-bold text-emerald">
                          <CheckCircle2 className="h-5 w-5" /> انجام شد
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setPlaying(p)}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald px-5 text-sm font-bold text-white hover:bg-emerald-light"
                          >
                            <PlayCircle className="h-4 w-4" />
                            تماشا
                          </button>
                          <button
                            type="button"
                            onClick={() => completeMutation.mutate(p.id)}
                            disabled={completeMutation.isPending}
                            className="inline-flex min-h-11 items-center rounded-xl border border-emerald/30 px-4 text-sm font-semibold text-emerald hover:bg-emerald/5 disabled:opacity-50"
                          >
                            {completeMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "تمرین را انجام دادم"
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Courses tab */}
          {tab === "courses" && (
            <div className="mt-6">
              {certificates.length > 0 && (
                <div className="mb-6 space-y-3">
                  <p className="font-bold">گواهی‌نامه‌های من 🏅</p>
                  {certificates.map((c) => (
                    <Link
                      key={c.id}
                      href={`/academy/certificates/${c.certificate_number}`}
                      title="مشاهده گواهی"
                      className="flex flex-wrap items-center gap-4 rounded-2xl border border-gold/40 bg-gold/10 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Award className="h-8 w-8 shrink-0 text-gold" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{c.course_title}</p>
                        <p className="mt-0.5 text-xs text-navy/50">
                          شماره گواهی: <span dir="ltr">{c.certificate_number}</span>
                        </p>
                      </div>
                      <span className="text-xs font-bold text-navy/60">{faDate(c.issue_date)}</span>
                    </Link>
                  ))}
                </div>
              )}

              {myCourses.length === 0 && certificates.length === 0 ? (
                <EmptyState
                  icon="🎓"
                  title="هنوز دوره‌ای تهیه نکرده‌اید"
                  description="از آکادمی تخصصی ما شروع کنید و با گواهی‌نامه معتبر مهارت بیاموزید."
                  action={
                    <Link
                      href="/academy"
                      title="مشاهده دوره‌ها"
                      className="inline-flex min-h-12 items-center rounded-xl bg-emerald px-6 text-sm font-bold text-white shadow-md"
                    >
                      مشاهده دوره‌ها
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {myCourses.map((c) => (
                    <Link
                      key={c.id}
                      href={`/academy/${c.id}`}
                      title={c.title}
                      className="block rounded-2xl border border-navy/10 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">{c.title}</p>
                          <p className="mt-1 text-xs text-navy/50">{c.level_display} — {c.is_free ? "رایگان" : faPrice(c.final_price) + " تومان"}</p>
                        </div>
                        <div className="w-40">
                          <div className="flex justify-between text-xs font-bold">
                            <span>پیشرفت</span>
                            <span className="text-emerald">٪{faNum(c.progress.percent)}</span>
                          </div>
                          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-navy/10">
                            <div
                              className="h-full rounded-full bg-emerald transition-all"
                              style={{ width: `${c.progress.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Non-patient notice */}
      {user.role !== "patient" && (
        <div className="mt-8">
          <EmptyState
            icon="👩‍⚕️"
            title="به پنل پزشک خوش آمدید"
            description="مدیریت نوبت‌ها، وضعیت بیماران و تجویز فیلم‌های آموزشی از پنل پزشک انجام می‌شود."
            action={
              <Link
                href="/doctor"
                title="ورود به پنل پزشک"
                className="inline-flex min-h-12 items-center rounded-xl bg-emerald px-6 text-sm font-bold text-white shadow-md"
              >
                ورود به پنل پزشک
              </Link>
            }
          />
        </div>
      )}

      {playing && (
        <VideoPlayer
          title={playing.video.title}
          url={playing.video.video_url}
          onClose={() => setPlaying(null)}
          onComplete={() => completeMutation.mutate(playing.id)}
        />
      )}
    </section>
  );
}