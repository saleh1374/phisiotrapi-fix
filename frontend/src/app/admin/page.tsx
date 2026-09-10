"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Award,
  CalendarCheck2,
  Clock,
  CreditCard,
  Film,
  GraduationCap,
  Newspaper,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import LoadingState from "@/components/LoadingState";
import { apiFetch } from "@/lib/api";
import { STATUS_LABELS, type AdminStats } from "@/lib/admin";
import { faNum, faPrice } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "#d4a373",
  confirmed: "#2d6a4f",
  completed: "#3f8a68",
  canceled_by_patient: "#ef4444",
  canceled_by_admin: "#f97316",
  no_show: "#94a3b8",
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch<AdminStats>("/admin/stats/"),
  });

  if (isLoading || !data) return <LoadingState label="در حال بارگذاری داشبورد..." />;

  const { counts, appointments_by_status, series, recent_users, recent_orders } = data;

  const statusChartData = Object.entries(appointments_by_status).map(([key, value]) => ({
    name: STATUS_LABELS[key] ?? key,
    value,
    color: STATUS_COLORS[key] ?? "#1b2a4a",
  }));

  const cards = [
    { label: "کل کاربران", value: faNum(counts.users), icon: Users, color: "bg-navy text-white" },
    { label: "بیماران", value: faNum(counts.patients), icon: Users, color: "bg-emerald text-white" },
    { label: "پزشکان", value: faNum(counts.doctors), icon: CalendarCheck2, color: "bg-gold text-navy" },
    { label: "نوبت‌های امروز", value: faNum(counts.appointments_today), icon: Clock, color: "bg-emerald-light text-white" },
    { label: "نوبت‌های در انتظار", value: faNum(counts.pending_appointments), icon: CalendarCheck2, color: "bg-gold text-navy" },
    { label: "درآمد کل", value: `${faPrice(counts.revenue)} ت`, icon: Wallet, color: "bg-navy text-white" },
    { label: "فیلم‌ها", value: faNum(counts.videos), icon: Film, color: "bg-emerald text-white" },
    { label: "دوره‌ها", value: faNum(counts.courses), icon: GraduationCap, color: "bg-navy-light text-white" },
    { label: "اخبار منتشرشده", value: faNum(counts.news_published), icon: Newspaper, color: "bg-gold text-navy" },
    { label: "گواهی‌نامه‌ها", value: faNum(counts.certificates), icon: Award, color: "bg-emerald-light text-white" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black">داشبورد مدیریت</h1>
      <p className="mt-1 text-sm text-navy/60">نمای کلی فعالیت کلینیک در یک نگاه</p>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`flex items-center gap-3 rounded-2xl p-4 shadow-sm ${c.color}`}
          >
            <c.icon className="h-7 w-7 shrink-0 opacity-80" />
            <div className="min-w-0">
              <p className="truncate text-lg font-black leading-6">{c.value}</p>
              <p className="truncate text-xs opacity-75">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="font-bold">روند ۷ روز اخیر</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" name="کاربران جدید" stroke="#1b2a4a" strokeWidth={2} />
                <Line type="monotone" dataKey="appointments" name="نوبت‌ها" stroke="#2d6a4f" strokeWidth={2} />
                <Line type="monotone" dataKey="orders" name="سفارش‌ها" stroke="#d4a373" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-bold">وضعیت نوبت‌ها</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip />
                <Bar dataKey="value" name="تعداد" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent lists */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="font-bold">آخرین کاربران</h2>
          <ul className="mt-3 divide-y divide-navy/5">
            {recent_users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-sm font-black text-emerald">
                  {u.full_name?.charAt(0) || u.username?.charAt(0) || "؟"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{u.full_name || u.username || u.phone_number}</p>
                  <p className="truncate text-xs text-navy/50" dir="ltr">
                    {u.username} {u.email ? `• ${u.email}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-navy/5 px-2.5 py-1 text-xs font-bold text-navy/70">
                  {u.role_display}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-bold">
            <CreditCard className="h-4 w-4 text-emerald" />
            آخرین سفارش‌ها
          </h2>
          <ul className="mt-3 divide-y divide-navy/5">
            {recent_orders.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold">
                  <GraduationCap className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{o.course?.title ?? "—"}</p>
                  <p className="truncate text-xs text-navy/50">{o.user_name}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-emerald">{faPrice(o.amount_paid)} ت</p>
                  <p className="text-xs text-navy/50">{STATUS_LABELS[o.payment_status] ?? o.payment_status_display}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}