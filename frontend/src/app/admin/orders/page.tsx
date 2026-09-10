"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { apiFetch } from "@/lib/api";
import { STATUS_LABELS, inputCls } from "@/lib/admin";
import { faDate, faNum, faPrice } from "@/lib/utils";

interface Order {
  id: string;
  user_name: string;
  course: { title: string } | null;
  amount_paid: number;
  payment_status: string;
  payment_status_display: string;
  transaction_code: string;
  purchase_date: string;
}

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: () => apiFetch<Order[]>(`/admin/orders/${status ? `?status=${status}` : ""}`),
  });

  const total = orders.reduce((sum, o) => sum + o.amount_paid, 0);

  return (
    <div>
      <h1 className="text-2xl font-black">سفارش‌ها</h1>
      <p className="mt-1 text-sm text-navy/60">
        {faNum(orders.length)} سفارش — مجموع: <span className="font-black text-emerald">{faPrice(total)} تومان</span>
      </p>

      <div className="mt-5">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} w-44`}>
          <option value="">همه وضعیت‌ها</option>
          <option value="paid">پرداخت شده</option>
          <option value="pending">در انتظار پرداخت</option>
          <option value="failed">ناموفق</option>
        </select>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-navy/10 bg-cream text-right text-xs text-navy/60">
              <th className="px-4 py-3 font-bold">کاربر</th>
              <th className="px-4 py-3 font-bold">دوره</th>
              <th className="px-4 py-3 font-bold">مبلغ</th>
              <th className="px-4 py-3 font-bold">وضعیت</th>
              <th className="px-4 py-3 font-bold">کد تراکنش</th>
              <th className="px-4 py-3 font-bold">تاریخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-navy/50">در حال بارگذاری...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-navy/50">سفارشی یافت نشد</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-cream/60">
                  <td className="px-4 py-3 font-bold">{o.user_name}</td>
                  <td className="max-w-56 truncate px-4 py-3 text-navy/70">{o.course?.title ?? "—"}</td>
                  <td className="px-4 py-3 font-black text-emerald">{faPrice(o.amount_paid)} ت</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      o.payment_status === "paid"
                        ? "bg-emerald/10 text-emerald"
                        : o.payment_status === "failed"
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-700"
                    }`}>
                      {STATUS_LABELS[o.payment_status] ?? o.payment_status_display}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-navy/60" dir="ltr">{o.transaction_code || "—"}</td>
                  <td className="px-4 py-3 text-xs text-navy/60">{o.purchase_date ? faDate(o.purchase_date) : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}