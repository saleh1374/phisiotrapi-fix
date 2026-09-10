"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Trash2 } from "lucide-react";
import { useState } from "react";

import { apiFetch } from "@/lib/api";
import { ROLE_LABELS, btnDanger, inputCls } from "@/lib/admin";
import { faDate, faNum } from "@/lib/utils";
import type { User } from "@/types";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", search, role],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      return apiFetch<User[]>(`/admin/users/${params.toString() ? `?${params}` : ""}`);
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/admin/users/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/users/${id}/`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-black">مدیریت کاربران</h1>
      <p className="mt-1 text-sm text-navy/60">
        {faNum(users.length)} کاربر — تغییر نقش، فعال‌سازی و حذف
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام، یوزرنیم، موبایل یا ایمیل..."
            className={`${inputCls} pr-10`}
          />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputCls} w-40`}>
          <option value="">همه نقش‌ها</option>
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-navy/10 bg-cream text-right text-xs text-navy/60">
              <th className="px-4 py-3 font-bold">کاربر</th>
              <th className="px-4 py-3 font-bold">نقش</th>
              <th className="px-4 py-3 font-bold">وضعیت</th>
              <th className="px-4 py-3 font-bold">تاریخ عضویت</th>
              <th className="px-4 py-3 font-bold">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-navy/50">در حال بارگذاری...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-navy/50">کاربری یافت نشد</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-cream/60">
                  <td className="px-4 py-3">
                    <p className="font-bold">{u.full_name || "—"}</p>
                    <p className="text-xs text-navy/50" dir="ltr">
                      {u.username ?? ""} {u.phone_number ? `• ${faNum(u.phone_number)}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={patchMutation.isPending}
                      onChange={(e) =>
                        patchMutation.mutate({ id: u.id, data: { role: e.target.value } })
                      }
                      className="rounded-lg border border-navy/20 bg-white px-2 py-1.5 text-xs font-bold outline-none focus:border-emerald"
                    >
                      {Object.entries(ROLE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        patchMutation.mutate({ id: u.id, data: { is_active: !u.is_active } })
                      }
                      className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                        u.is_active
                          ? "bg-emerald/10 text-emerald hover:bg-emerald/20"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      {u.is_active ? "فعال" : "غیرفعال"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-navy/60">{faDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`کاربر «${u.full_name || u.username}» حذف شود؟`)) {
                          deleteMutation.mutate(u.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className={btnDanger}
                      title="حذف کاربر"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}