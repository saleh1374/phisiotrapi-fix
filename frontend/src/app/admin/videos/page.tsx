"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import Modal from "@/components/admin/Modal";
import { apiFetch, errorMessage } from "@/lib/api";
import { BODY_PARTS, INJURIES, btnDanger, btnGhost, btnPrimary, inputCls, labelCls } from "@/lib/admin";
import { faNum } from "@/lib/utils";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail: string;
  body_part: string;
  body_part_display: string;
  injury_type: string;
  injury_type_display: string;
  is_public: boolean;
  view_count: number;
  duration_minutes: number;
}

const EMPTY = {
  title: "",
  description: "",
  video_url: "",
  thumbnail: "",
  body_part: "کمر",
  injury_type: "دیسک",
  duration_minutes: 5,
  is_public: true,
};

export default function AdminVideosPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Video | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: () => apiFetch<Video[]>("/admin/videos/"),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing === "new"
        ? apiFetch("/admin/videos/", { method: "POST", body: JSON.stringify(form) })
        : apiFetch(`/admin/videos/${(editing as Video).id}/`, { method: "PATCH", body: JSON.stringify(form) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      setEditing(null);
    },
    onError: (e) => setFormError(errorMessage((e as { data?: unknown }).data, "خطا در ذخیره")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/videos/${id}/`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-videos"] }),
  });

  const openEdit = (v: Video) => {
    setForm({
      title: v.title,
      description: v.description,
      video_url: v.video_url,
      thumbnail: v.thumbnail,
      body_part: v.body_part,
      injury_type: v.injury_type,
      duration_minutes: v.duration_minutes,
      is_public: v.is_public,
    });
    setFormError(null);
    setEditing(v);
  };

  const openNew = () => {
    setForm(EMPTY);
    setFormError(null);
    setEditing("new");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">مدیریت فیلم‌ها</h1>
          <p className="mt-1 text-sm text-navy/60">{faNum(videos.length)} فیلم آموزشی</p>
        </div>
        <button type="button" onClick={openNew} className={btnPrimary}>
          <Plus className="h-4 w-4" />
          فیلم جدید
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-navy/10 bg-cream text-right text-xs text-navy/60">
              <th className="px-4 py-3 font-bold">عنوان</th>
              <th className="px-4 py-3 font-bold">ناحیه / آسیب</th>
              <th className="px-4 py-3 font-bold">مدت</th>
              <th className="px-4 py-3 font-bold">بازدید</th>
              <th className="px-4 py-3 font-bold">وضعیت</th>
              <th className="px-4 py-3 font-bold">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-navy/50">در حال بارگذاری...</td></tr>
            ) : videos.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-navy/50">فیلمی ثبت نشده</td></tr>
            ) : (
              videos.map((v) => (
                <tr key={v.id} className="hover:bg-cream/60">
                  <td className="max-w-64 px-4 py-3">
                    <p className="truncate font-bold">{v.title}</p>
                    <p className="truncate text-xs text-navy/50">{v.description}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-navy/70">
                    {v.body_part_display} / {v.injury_type_display}
                  </td>
                  <td className="px-4 py-3 text-xs text-navy/70">{faNum(v.duration_minutes)} دقیقه</td>
                  <td className="px-4 py-3 text-xs text-navy/70">
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{faNum(v.view_count)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${v.is_public ? "bg-emerald/10 text-emerald" : "bg-zinc-100 text-zinc-500"}`}>
                      {v.is_public ? "عمومی" : "خصوصی"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(v)} className={btnGhost} title="ویرایش">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirm(`فیلم «${v.title}» حذف شود؟`) && deleteMutation.mutate(v.id)}
                        className={btnDanger}
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing === "new" ? "فیلم جدید" : `ویرایش: ${(editing as Video).title}`}
          onClose={() => setEditing(null)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>عنوان *</label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>توضیحات</label>
              <textarea rows={2} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>آدرس ویدیو (URL) *</label>
              <input dir="ltr" className={inputCls} value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>تصویر بندانگشتی (URL — اختیاری)</label>
              <input dir="ltr" className={inputCls} value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>ناحیه بدن</label>
              <select className={inputCls} value={form.body_part} onChange={(e) => setForm({ ...form, body_part: e.target.value })}>
                {BODY_PARTS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>نوع آسیب</label>
              <select className={inputCls} value={form.injury_type} onChange={(e) => setForm({ ...form, injury_type: e.target.value })}>
                {INJURIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>مدت (دقیقه)</label>
              <input type="number" min={1} className={inputCls} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-bold text-navy/80">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                  className="h-5 w-5 accent-emerald"
                />
                نمایش عمومی
              </label>
            </div>
          </div>
          {formError && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className={btnGhost}>انصراف</button>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.title || !form.video_url}
              className={btnPrimary}
            >
              {saveMutation.isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              ذخیره
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}