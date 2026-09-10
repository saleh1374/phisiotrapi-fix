"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import Modal from "@/components/admin/Modal";
import { apiFetch, errorMessage } from "@/lib/api";
import { NEWS_CATEGORIES, btnDanger, btnGhost, btnPrimary, inputCls, labelCls } from "@/lib/admin";
import { faDate, faNum } from "@/lib/utils";

interface Article {
  id: string;
  title_fa: string;
  title_en: string;
  summary_fa: string;
  image_url: string;
  category: string;
  category_display: string;
  source_url: string;
  is_published: boolean;
  published_at: string;
}

const EMPTY = {
  title_fa: "",
  title_en: "",
  summary_fa: "",
  image_url: "",
  category: "تحقیقات بالینی",
  source_url: "",
  is_published: true,
};

export default function AdminNewsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Article | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-news"],
    queryFn: () => apiFetch<Article[]>("/admin/news/"),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing === "new"
        ? apiFetch("/admin/news/", { method: "POST", body: JSON.stringify(form) })
        : apiFetch(`/admin/news/${(editing as Article).id}/`, { method: "PATCH", body: JSON.stringify(form) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      setEditing(null);
    },
    onError: (e) => setFormError(errorMessage((e as { data?: unknown }).data, "خطا در ذخیره خبر")),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) =>
      apiFetch(`/admin/news/${id}/`, { method: "PATCH", body: JSON.stringify({ is_published }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-news"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/news/${id}/`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-news"] }),
  });

  const openEdit = (a: Article) => {
    setForm({
      title_fa: a.title_fa,
      title_en: a.title_en,
      summary_fa: a.summary_fa,
      image_url: a.image_url,
      category: a.category,
      source_url: a.source_url,
      is_published: a.is_published,
    });
    setFormError(null);
    setEditing(a);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">مدیریت اخبار</h1>
          <p className="mt-1 text-sm text-navy/60">{faNum(articles.length)} خبر</p>
        </div>
        <button
          type="button"
          onClick={() => { setForm(EMPTY); setFormError(null); setEditing("new"); }}
          className={btnPrimary}
        >
          <Plus className="h-4 w-4" />
          خبر جدید
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <p className="py-10 text-center text-navy/50">در حال بارگذاری...</p>
        ) : articles.length === 0 ? (
          <p className="py-10 text-center text-navy/50">خبری ثبت نشده</p>
        ) : (
          articles.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-6">{a.title_fa}</p>
                <p className="mt-0.5 text-xs text-navy/50">
                  {a.category_display} • {a.published_at ? faDate(a.published_at) : "—"}
                  {a.title_en && <span className="mr-2" dir="ltr">{a.title_en}</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleMutation.mutate({ id: a.id, is_published: !a.is_published })}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  a.is_published ? "bg-emerald/10 text-emerald hover:bg-emerald/20" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                {a.is_published ? "منتشر شده" : "پیش‌نویس"}
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(a)} className={btnGhost} title="ویرایش">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => confirm(`خبر «${a.title_fa}» حذف شود؟`) && deleteMutation.mutate(a.id)}
                  className={btnDanger}
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editing && (
        <Modal title={editing === "new" ? "خبر جدید" : "ویرایش خبر"} onClose={() => setEditing(null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>عنوان فارسی *</label>
              <input className={inputCls} value={form.title_fa} onChange={(e) => setForm({ ...form, title_fa: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>عنوان انگلیسی (اختیاری)</label>
              <input dir="ltr" className={inputCls} value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>دسته‌بندی</label>
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {NEWS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>متن خبر *</label>
              <textarea rows={5} className={inputCls} value={form.summary_fa} onChange={(e) => setForm({ ...form, summary_fa: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>تصویر (URL)</label>
              <input dir="ltr" className={inputCls} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>لینک منبع</label>
              <input dir="ltr" className={inputCls} value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm font-bold text-navy/80">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="h-5 w-5 accent-emerald" />
                انتشار فوری
              </label>
            </div>
          </div>
          {formError && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className={btnGhost}>انصراف</button>
            <button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title_fa || !form.summary_fa} className={btnPrimary}>
              {saveMutation.isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              ذخیره خبر
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}