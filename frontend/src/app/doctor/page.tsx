"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCheck, Loader2, UserRound, Video as VideoIcon, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import StatusBadge from "@/components/StatusBadge";
import { faLongDate } from "@/components/JalaliCalendar";
import { apiFetch, errorMessage } from "@/lib/api";
import { faNum } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  patient: User;
  service_type_display: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  status_display: string;
  description: string;
}

interface Video {
  id: string;
  title: string;
  body_part_display: string;
}

export default function DoctorPage() {
  const router = useRouter();
  const { user, accessToken, hasHydrated } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"today" | "tomorrow" | "history">("today");
  const [prescribing, setPrescribing] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [prescribeMsg, setPrescribeMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!accessToken || !user) router.replace("/login");
    else if (user.role !== "doctor" && user.role !== "admin") router.replace("/dashboard");
  }, [accessToken, user, hasHydrated, router]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["doctor-appointments", tab],
    queryFn: () => apiFetch<Appointment[]>(`/appointments/doctor/?scope=${tab}`),
    enabled: !!accessToken && !!user && (user.role === "doctor" || user.role === "admin"),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["my-patients"],
    queryFn: () => apiFetch<User[]>("/videos/my-patients/"),
    enabled: !!accessToken && !!user && (user.role === "doctor" || user.role === "admin"),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => apiFetch<Video[]>("/videos/", {}, false),
    enabled: !!accessToken && !!user && (user.role === "doctor" || user.role === "admin"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/appointments/doctor/${id}/status/`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] }),
  });

  const prescribeMutation = useMutation({
    mutationFn: () =>
      apiFetch("/videos/prescribe/", {
        method: "POST",
        body: JSON.stringify({ patient_id: patientId, video_ids: videoIds, due_date: dueDate }),
      }),
    onSuccess: () => {
      setPrescribeMsg("فیلم‌ها با موفقیت برای بیمار تجویز شد ✅");
      setVideoIds([]);
      setPatientId("");
      setDueDate("");
      setTimeout(() => setPrescribeMsg(null), 4000);
    },
    onError: (e) =>
      setPrescribeMsg(errorMessage((e as { data?: unknown }).data, "خطا در تجویز")),
  });

  if (!accessToken || !user) return null;
  if (user.role !== "doctor" && user.role !== "admin") return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-black">پنل پزشک 👩‍⚕️</h1>
      <p className="mt-2 text-navy/60">{user.full_name} — {user.specialty || "فیزیوتراپیست"}</p>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["today", "نوبت‌های امروز"],
            ["tomorrow", "نوبت‌های فردا"],
            ["history", "تاریخچه"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-bold transition-colors",
              tab === key ? "bg-emerald text-white" : "bg-navy/5 text-navy/70 hover:bg-navy/10"
            )}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPrescribing((v) => !v)}
          className={cn(
            "mr-auto inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold transition-colors",
            prescribing ? "bg-navy text-white" : "bg-gold/20 text-navy hover:bg-gold/30"
          )}
        >
          <VideoIcon className="h-4 w-4" />
          تجویز فیلم به بیمار
        </button>
      </div>

      {/* Prescription panel */}
      {prescribing && (
        <div className="mt-6 rounded-2xl border border-gold/30 bg-cream p-6">
          <h2 className="font-bold">تجویز فیلم آموزشی برای بیمار</h2>
          {prescribeMsg && (
            <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald">{prescribeMsg}</p>
          )}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">بیمار</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full rounded-xl border border-navy/20 bg-white px-4 py-3 text-sm outline-none focus:border-emerald"
              >
                <option value="">انتخاب بیمار...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.phone_number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">سررسید انجام تمرینات</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-navy/20 bg-white px-4 py-3 text-sm outline-none focus:border-emerald"
              />
            </div>
          </div>
          <p className="mt-4 text-sm font-bold">انتخاب فیلم‌ها</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => {
              const selected = videoIds.includes(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() =>
                    setVideoIds((ids) => (selected ? ids.filter((i) => i !== v.id) : [...ids, v.id]))
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-right text-sm font-semibold transition-colors",
                    selected ? "border-emerald bg-emerald/5 text-emerald" : "border-navy/10 hover:border-emerald/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      selected ? "border-emerald bg-emerald text-white" : "border-navy/20"
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="truncate">{v.title}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={!patientId || videoIds.length === 0 || !dueDate || prescribeMutation.isPending}
            onClick={() => prescribeMutation.mutate()}
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald px-6 text-sm font-bold text-white shadow-md hover:bg-emerald-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {prescribeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            ثبت تجویز ({faNum(videoIds.length)} فیلم)
          </button>
        </div>
      )}

      {/* Appointments */}
      <div className="mt-6 space-y-3">
        {isLoading ? (
          <LoadingState />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon="📭"
            title={tab === "history" ? "هنوز نوبتی ثبت نشده" : "نوبتی برای امروز ندارید"}
            description="وقتی بیماران نوبت بگیرند، اینجا نمایش داده می‌شود."
          />
        ) : (
          appointments.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald/10">
                <UserRound className="h-6 w-6 text-emerald" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {a.patient.full_name || a.patient.phone_number}
                  <span className="mr-2 text-sm font-normal text-navy/50" dir="ltr">
                    {a.patient.phone_number}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-navy/60">
                  {faLongDate(a.appointment_date)} — ساعت {faNum(a.start_time)} تا {faNum(a.end_time)}
                  <span className="mr-2 rounded-full bg-navy/5 px-2 py-0.5 text-xs font-bold">
                    {a.service_type_display}
                  </span>
                </p>
                {a.description && <p className="mt-1 text-sm text-navy/50">📝 {a.description}</p>}
              </div>
              <StatusBadge status={a.status} label={a.status_display} />
              {a.status === "pending" || a.status === "confirmed" ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => statusMutation.mutate({ id: a.id, status: "completed" })}
                    title="انجام شد"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald/10 text-emerald hover:bg-emerald/20"
                  >
                    <CheckCheck className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => statusMutation.mutate({ id: a.id, status: "no_show" })}
                    title="عدم حضور بیمار"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}