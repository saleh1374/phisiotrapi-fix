"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Loader2, XCircle } from "lucide-react";
import { useState } from "react";

import StatusBadge from "@/components/StatusBadge";
import { faLongDate } from "@/components/JalaliCalendar";
import { apiFetch } from "@/lib/api";
import { STATUS_LABELS, inputCls } from "@/lib/admin";
import { faNum } from "@/lib/utils";
import type { User } from "@/types";

interface Appointment {
  id: string;
  patient: User;
  doctor: User;
  service_type_display: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  status_display: string;
  description: string;
}

const ACTIONS: Array<{ status: string; label: string; cls: string }> = [
  { status: "confirmed", label: "تایید", cls: "bg-emerald/10 text-emerald hover:bg-emerald/20" },
  { status: "completed", label: "انجام شد", cls: "bg-sky-50 text-sky-700 hover:bg-sky-100" },
  { status: "no_show", label: "عدم حضور", cls: "bg-zinc-100 text-zinc-600 hover:bg-zinc-200" },
  { status: "canceled_by_admin", label: "لغو", cls: "bg-red-50 text-red-600 hover:bg-red-100" },
];

export default function AdminAppointmentsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["admin-appointments", status, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      return apiFetch<Appointment[]>(`/admin/appointments/${params.toString() ? `?${params}` : ""}`);
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/admin/appointments/${id}/status/`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-appointments"] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-black">مدیریت نوبت‌ها</h1>
      <p className="mt-1 text-sm text-navy/60">{faNum(appointments.length)} نوبت</p>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-navy/60">وضعیت</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} w-44`}>
            <option value="">همه</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-navy/60">از تاریخ</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputCls} w-40`} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-navy/60">تا تاریخ</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputCls} w-40`} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <p className="py-10 text-center text-navy/50">در حال بارگذاری...</p>
        ) : appointments.length === 0 ? (
          <p className="py-10 text-center text-navy/50">نوبتی با این فیلترها یافت نشد</p>
        ) : (
          appointments.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {a.patient.full_name || a.patient.username || a.patient.phone_number}
                  <span className="mr-2 text-sm font-normal text-navy/50">
                    ← {a.doctor.full_name || a.doctor.username}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-navy/60">
                  {faLongDate(a.appointment_date)} — ساعت {faNum(a.start_time)} تا {faNum(a.end_time)}
                  <span className="mr-2 rounded-full bg-navy/5 px-2 py-0.5 text-xs font-bold">{a.service_type_display}</span>
                </p>
                {a.description && <p className="mt-1 text-sm text-navy/50">📝 {a.description}</p>}
              </div>
              <StatusBadge status={a.status} label={a.status_display} />
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map((act) => (
                  <button
                    key={act.status}
                    type="button"
                    onClick={() => actionMutation.mutate({ id: a.id, status: act.status })}
                    disabled={actionMutation.isPending || a.status === act.status}
                    className={`inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${act.cls}`}
                  >
                    {act.status === "completed" ? (
                      <CheckCheck className="h-3.5 w-3.5" />
                    ) : act.status === "no_show" ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <Loader2 className="h-3.5 w-3.5" />
                    )}
                    {act.label}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}