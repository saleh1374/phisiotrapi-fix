"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import LoadingState from "@/components/LoadingState";
import VideoPlayer from "@/components/VideoPlayer";
import { apiFetch, errorMessage } from "@/lib/api";
import { faNum, faPrice } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  chapter_title: string;
  video_url: string;
  pdf_attachment: string;
  duration_minutes: number;
  sort_order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  discount_price: number | null;
  final_price: number;
  cover_image: string;
  level_display: string;
  total_hours: string;
  is_free: boolean;
  instructor_name: string;
  chapters: Chapter[];
}

interface Progress {
  percent: number;
  completed: number;
  total: number;
  completed_chapter_ids: string[];
  certificate_ready: boolean;
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Chapter | null>(null);
  const [certificate, setCertificate] = useState<{ certificate_number: string } | null>(null);
  const [completedMsg, setCompletedMsg] = useState<string | null>(null);

  const { data: course } = useQuery({
    queryKey: ["course", params.id],
    queryFn: () => apiFetch<Course>(`/academy/courses/${params.id}/`, {}, false),
  });

  const { data: access, refetch: refetchAccess } = useQuery({
    queryKey: ["course-access", params.id, accessToken],
    queryFn: async () => {
      try {
        return await apiFetch<{ course: Course; progress: Progress }>(
          `/academy/courses/${params.id}/content/`
        );
      } catch {
        return null; // not enrolled / not logged in
      }
    },
    enabled: !!accessToken,
  });

  const enrollMutation = useMutation({
    mutationFn: () => apiFetch<{ id: string; payment_status: string }>(`/academy/courses/${params.id}/enroll/`, { method: "POST" }),
    onSuccess: async (order) => {
      if (order.payment_status === "paid") {
        await refetchAccess();
      } else {
        setPaying(true);
      }
    },
    onError: (e) => setPayError(errorMessage((e as { data?: unknown }).data, "خطا در ثبت سفارش")),
  });

  const payMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiFetch("/academy/pay/", { method: "POST", body: JSON.stringify({ order_id: orderId }) }),
    onSuccess: async () => {
      setPaying(false);
      await refetchAccess();
    },
    onError: (e) => setPayError(errorMessage((e as { data?: unknown }).data, "پرداخت ناموفق بود")),
  });

  const completeMutation = useMutation({
    mutationFn: (chapterId: string) =>
      apiFetch<{ progress: Progress; certificate: { certificate_number: string } | null }>(
        `/academy/courses/${params.id}/chapters/${chapterId}/complete/`,
        { method: "POST" }
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(["course-access", params.id, accessToken], (old: typeof access) =>
        old ? { ...old, progress: data.progress } : old
      );
      if (data.certificate) {
        setCertificate(data.certificate);
        setCompletedMsg("تبریک! شما دوره را با موفقیت به پایان رساندید و گواهی‌نامه شما صادر شد 🎉");
      } else if (data.progress.certificate_ready === false) {
        setCompletedMsg(`سرفصل ثبت شد — پیشرفت: ٪${faNum(data.progress.percent)}`);
      }
      setTimeout(() => setCompletedMsg(null), 5000);
    },
  });

  if (!course) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-16">
        <LoadingState label="در حال بارگذاری دوره..." />
      </section>
    );
  }

  const isEnrolled = !!access;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-navy to-navy-light text-white shadow-xl">
        <div className="grid gap-6 p-8 sm:p-10 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="rounded-full bg-emerald/30 px-3 py-1 text-xs font-bold text-emerald-light">
              {course.level_display}
            </span>
            <h1 className="mt-3 text-2xl font-black sm:text-3xl">{course.title}</h1>
            <p className="mt-3 max-w-2xl leading-8 text-white/75">{course.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {faNum(course.total_hours)} ساعت آموزش
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" /> {faNum(course.chapters.length)} سرفصل
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> گواهی‌نامه معتبر با کد اصالت
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3">
            {isEnrolled ? (
              <div className="rounded-2xl bg-white/10 p-5 text-center backdrop-blur">
                <p className="text-3xl font-black text-gold">٪{faNum(access.progress.percent)}</p>
                <p className="mt-1 text-sm text-white/70">
                  {faNum(access.progress.completed)} از {faNum(access.progress.total)} سرفصل تکمیل شده
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/10 p-5 text-center backdrop-blur">
                {course.is_free ? (
                  <>
                    <p className="text-2xl font-black text-gold">رایگان</p>
                    <button
                      type="button"
                      onClick={() => enrollMutation.mutate()}
                      disabled={enrollMutation.isPending}
                      className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald px-6 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {enrollMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      شروع یادگیری
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-white/60 line-through">{faPrice(course.price)}</p>
                    <p className="text-2xl font-black text-gold">{faPrice(course.final_price)} تومان</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!accessToken) {
                          router.push("/login");
                          return;
                        }
                        enrollMutation.mutate();
                      }}
                      disabled={enrollMutation.isPending}
                      className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold px-6 text-sm font-black text-navy disabled:opacity-60"
                    >
                      {enrollMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      خرید دوره
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {payError && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{payError}</p>
      )}

      {/* Dev-mode payment dialog */}
      {paying && (
        <div className="mt-6 rounded-2xl border border-gold/40 bg-cream p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <CreditCard className="h-5 w-5 text-gold" /> پرداخت امن (حالت توسعه)
          </h2>
          <p className="mt-2 text-sm leading-6 text-navy/60">
            در محیط تولید به درگاه بانکی زرین‌پال متصل می‌شود. در حالت توسعه، پرداخت به‌صورت
            شبیه‌سازی انجام می‌شود.
          </p>
          <button
            type="button"
            onClick={() => payMutation.mutate(enrollMutation.data?.id ?? "")}
            disabled={payMutation.isPending}
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald px-6 text-sm font-bold text-white shadow-md disabled:opacity-60"
          >
            {payMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            پرداخت {faPrice(course.final_price)} تومان
          </button>
        </div>
      )}

      {completedMsg && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald">
          {completedMsg}
        </p>
      )}

      {/* Certificate */}
      {certificate && (
        <div className="mt-6 rounded-2xl border border-emerald/30 bg-emerald/5 p-6">
          <h2 className="flex items-center gap-2 text-lg font-black text-emerald">
            <Award className="h-6 w-6" /> گواهی‌نامه شما صادر شد
          </h2>
          <p className="mt-2 text-sm text-navy/70">
            شماره گواهی: <span dir="ltr" className="font-black">{certificate.certificate_number}</span>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link
              href={`/academy/certificates/${certificate.certificate_number}`}
              title="مشاهده و دانلود گواهی"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald px-6 text-sm font-bold text-white shadow-md hover:bg-emerald-light"
            >
              <BadgeCheck className="h-4 w-4" />
              مشاهده گواهی و QR کد
            </Link>
          </div>
        </div>
      )}

      {/* Chapters */}
      <h2 className="mt-10 text-xl font-bold">سرفصل‌های دوره</h2>
      <div className="mt-4 space-y-3">
        {course.chapters.map((ch, i) => {
          const done = access?.progress.completed_chapter_ids.includes(ch.id) ?? false;
          const locked = !isEnrolled;
          return (
            <div
              key={ch.id}
              className={cn(
                "flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm",
                locked ? "border-navy/10" : "border-navy/10"
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black",
                  done ? "bg-emerald text-white" : "bg-navy/5 text-navy/60"
                )}
              >
                {done ? <CheckCircle2 className="h-5 w-5" /> : faNum(i + 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{ch.chapter_title}</p>
                <p className="mt-0.5 text-xs text-navy/50">{faNum(ch.duration_minutes)} دقیقه</p>
              </div>
              {locked ? (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-navy/40">
                  <Lock className="h-4 w-4" /> پس از تهیه دوره
                </span>
              ) : done ? (
                <span className="text-sm font-bold text-emerald">✓ تکمیل شده</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(ch)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald px-5 text-sm font-bold text-white hover:bg-emerald-light"
                >
                  <PlayCircle className="h-4 w-4" />
                  تماشا
                </button>
              )}
            </div>
          );
        })}
      </div>

      {playing && (
        <VideoPlayer
          title={playing.chapter_title}
          url={playing.video_url}
          onClose={() => setPlaying(null)}
          onComplete={() => completeMutation.mutate(playing.id)}
        />
      )}
    </section>
  );
}