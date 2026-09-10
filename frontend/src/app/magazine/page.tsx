"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Newspaper } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import { apiFetch } from "@/lib/api";
import { faDate, faNum } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  title_fa: string;
  title_en: string;
  summary_fa: string;
  image_url: string;
  category_display: string;
  source_url: string;
  published_at: string;
}

const CATEGORIES = ["تکنولوژی روز", "تحقیقات بالینی", "همایش‌ها", "متدهای نوین"];

export default function MagazinePage() {
  const [category, setCategory] = useState<string | null>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["news", category],
    queryFn: () => {
      const qs = category ? `?category=${encodeURIComponent(category)}` : "";
      return apiFetch<Article[]>(`/news/${qs}`, {}, false);
    },
  });

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-2xl font-black">
        <Newspaper className="h-7 w-7 text-emerald" />
        مجله علمی فیزیوتراپی
      </h1>
      <p className="mt-2 text-navy/60">
        جدیدترین تحقیقات، متدهای نوین و رویدادهای دنیای فیزیوتراپی — به فارسی روان
      </p>

      {/* Category filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={cn(
            "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold",
            !category ? "bg-navy text-white" : "bg-navy/5 text-navy/70 hover:bg-navy/10"
          )}
        >
          همه
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(category === c ? null : c)}
            className={cn(
              "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold",
              category === c ? "bg-emerald text-white" : "bg-navy/5 text-navy/70 hover:bg-navy/10"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState className="mt-8" />
      ) : articles.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon="📰"
            title="خبری یافت نشد"
            description="در این دسته هنوز خبری منتشر نشده است."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/magazine/${a.id}`}
              title={a.title_fa}
              className="group overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              {a.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.image_url}
                  alt={a.title_fa}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-navy to-emerald text-6xl">
                  📰
                </div>
              )}
              <div className="p-5">
                <span className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold text-emerald">
                  {a.category_display}
                </span>
                <h2 className="mt-3 font-bold leading-7 transition-colors group-hover:text-emerald">
                  {a.title_fa}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-navy/60">{a.summary_fa}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-navy/40">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {a.published_at ? faDate(a.published_at) : faNum("—")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}