"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import Modal from "@/components/admin/Modal";
import { apiFetch, errorMessage } from "@/lib/api";
import { COURSE_LEVELS, btnDanger, btnGhost, btnPrimary, inputCls, labelCls } from "@/lib/admin";
import { faNum, faPrice } from "@/lib/utils";

interface Chapter {
  id: string;
  chapter_title: string;
  video_url: string;
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
  is_free: boolean;
  level: string;
  level_display: string;
  total_hours: string;
  cover_image: string;
  chapters: Chapter[];
}

const EMPTY = {
  title: "",
  description: "",
  price: 0,
  discount_price: "",
  is_free: false,
  level: "مقدماتی",
  total_hours: 1,
  cover_image: "",
};

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Course | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [chapterCourseId, setChapterCourseId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState({ chapter_title: "", video_url: "", duration_minutes: 15 });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => apiFetch<Course[]>("/admin/courses/"),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        discount_price: form.discount_price === "" ? null : Number(form.discount_price),
        price: form.is_free ? 0 : Number(form.price),
      };
      return editing === "new"
        ? apiFetch("/admin/courses/", { method: "POST", body: JSON.stringify(payload) })
        : apiFetch(`/admin/courses/${(editing as Course).id}/`, { method: "PATCH", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setEditing(null);
    },
    onError: (e) => setFormError(errorMessage((e as { data?: unknown }).data, "خطا در ذخیره دوره")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/courses/${id}/`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-courses"] }),
  });

  const chapterMutation = useMutation({
    mutationFn: ({ courseId, chapter }: { courseId: string; chapter: Chapter }) =>
      apiFetch(`/admin/courses/${courseId}/chapters/`, {
        method: "POST",
        body: JSON.stringify(chapter),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setChapterForm({ chapter_title: "", video_url: "", duration_minutes: 15 });
    },
  });

  const chapterDelete = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/chapters/${id}/`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-courses"] }),
  });

  const openEdit = (c: Course) => {
    setForm({
      title: c.title,
      description: c.description,
      price: c.price,
      discount_price: c.discount_price === null ? "" : String(c.discount_price),
      is_free: c.is_free,
      level: c.level,
      total_hours: Number(c.total_hours) || 1,
      cover_image: c.cover_image,
    });
    setFormError(null);
    setEditing(c);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">مدیریت دوره‌ها</h1>
          <p className="mt-1 text-sm text-navy/60">{faNum(courses.length)} دوره آکادمی</p>
        </div>
        <button
          type="button"
          onClick={() => { setForm(EMPTY); setFormError(null); setEditing("new"); }}
          className={btnPrimary}
        >
          <Plus className="h-4 w-4" />
          دوره جدید
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <p className="col-span-full py-10 text-center text-navy/50">در حال بارگذاری...</p>
        ) : courses.length === 0 ? (
          <p className="col-span-full py-10 text-center text-navy/50">دوره‌ای ثبت نشده</p>
        ) : (
          courses.map((c) => (
            <div key={c.id} className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold leading-6">{c.title}</h2>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${c.is_free ? "bg-emerald/10 text-emerald" : "bg-gold/20 text-navy"}`}>
                  {c.is_free ? "رایگان" : faPrice(c.final_price) + " ت"}
                </span>
              </div>
              <p className="mt-1 text-xs text-navy/50">
                {c.level_display} • {faNum(c.total_hours)} ساعت • {faNum(c.chapters.length)} سرفصل
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => openEdit(c)} className={btnGhost}>
                  <Pencil className="h-4 w-4" /> ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => confirm(`دوره «${c.title}» حذف شود؟`) && deleteMutation.mutate(c.id)}
                  className={btnDanger}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {c.chapters.length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-navy/5 pt-3">
                  {c.chapters.map((ch) => (
                    <li key={ch.id} className="flex items-center gap-2 text-xs text-navy/70">
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-emerald" />
                      <span className="min-w-0 flex-1 truncate">{ch.chapter_title}</span>
                      <span className="shrink-0 text-navy/40">{faNum(ch.duration_minutes)} دقیقه</span>
                      <button
                        type="button"
                        onClick={() => confirm(`سرفصل «${ch.chapter_title}» حذف شود؟`) && chapterDelete.mutate(ch.id)}
                        className="shrink-0 text-red-500 hover:text-red-700"
                        title="حذف سرفصل"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {chapterCourseId === c.id && (
                <div className="mt-4 rounded-xl border border-emerald/20 bg-emerald/5 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-emerald">افزودن سرفصل جدید</p>
                    <button
                      type="button"
                      onClick={() => setChapterCourseId(null)}
                      className="text-xs font-bold text-navy/50 hover:text-navy"
                    >
                      بستن ✕
                    </button>
                  </div>
                  <input
                    className={`${inputCls} mt-2`}
                    placeholder="عنوان سرفصل"
                    value={chapterForm.chapter_title}
                    onChange={(e) => setChapterForm({ ...chapterForm, chapter_title: e.target.value })}
                  />
                  <input
                    dir="ltr"
                    className={`${inputCls} mt-2`}
                    placeholder="آدرس ویدیو"
                    value={chapterForm.video_url}
                    onChange={(e) => setChapterForm({ ...chapterForm, video_url: e.target.value })}
                  />
                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      min={1}
                      className={`${inputCls} w-28`}
                      value={chapterForm.duration_minutes}
                      onChange={(e) => setChapterForm({ ...chapterForm, duration_minutes: Number(e.target.value) })}
                    />
                    <button
                      type="button"
                      disabled={!chapterForm.chapter_title || chapterMutation.isPending}
                      onClick={() => chapterMutation.mutate({ courseId: c.id, chapter: { ...chapterForm, sort_order: c.chapters.length + 1, id: "" } })}
                      className={btnPrimary}
                    >
                      <Plus className="h-4 w-4" /> افزودن
                    </button>
                  </div>
                </div>
              )}
              {chapterCourseId !== c.id && (
                <button
                  type="button"
                  onClick={() => { setChapterCourseId(c.id); setChapterForm({ chapter_title: "", video_url: "", duration_minutes: 15 }); }}
                  className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-emerald hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> افزودن سرفصل
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {editing && (
        <Modal
          title={editing === "new" ? "دوره جدید" : `ویرایش: ${(editing as Course).title}`}
          onClose={() => setEditing(null)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>عنوان *</label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>توضیحات</label>
              <textarea rows={3} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>تصویر جلد (URL — اختیاری)</label>
              <input dir="ltr" className={inputCls} value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>سطح</label>
              <select className={inputCls} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {COURSE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>ساعت کل</label>
              <input type="number" min={1} className={inputCls} value={form.total_hours} onChange={(e) => setForm({ ...form, total_hours: Number(e.target.value) })} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-bold text-navy/80">
                <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} className="h-5 w-5 accent-emerald" />
                رایگان
              </label>
              {!form.is_free && (
                <>
                  <div>
                    <label className={labelCls}>قیمت (تومان)</label>
                    <input type="number" min={0} className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className={labelCls}>قیمت با تخفیف (اختیاری)</label>
                    <input type="number" min={0} className={inputCls} value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} />
                  </div>
                </>
              )}
            </div>
          </div>
          {formError && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className={btnGhost}>انصراف</button>
            <button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title} className={btnPrimary}>
              {saveMutation.isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              ذخیره دوره
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}