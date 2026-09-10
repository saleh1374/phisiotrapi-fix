"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import LoadingState from "@/components/LoadingState";
import { apiFetch } from "@/lib/api";
import { faDate } from "@/lib/utils";

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

export default function ArticlePage() {
  const params = useParams<{ id: string }>();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ["news", params.id],
    queryFn: () => apiFetch<Article>(`/news/${params.id}/`, {}, false),
    retry: false,
  });

  if (isLoading) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <LoadingState label="در حال بارگذاری خبر..." />
      </section>
    );
  }

  if (error || !article) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-red-600">خبر یافت نشد</h1>
        <Link href="/magazine" title="بازگشت به مجله" className="mt-4 inline-block font-bold text-emerald hover:underline">
          بازگشت به مجله علمی
        </Link>
      </section>
    );
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/magazine"
        title="بازگشت به مجله"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy/60 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4 rotate-180" />
        مجله علمی
      </Link>

      <span className="mt-6 inline-block rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold text-emerald">
        {article.category_display}
      </span>
      <h1 className="mt-3 text-2xl font-black leading-relaxed sm:text-3xl">{article.title_fa}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-navy/50">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" />
          {article.published_at ? faDate(article.published_at) : "—"}
        </span>
        {article.source_url && (
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            title="مشاهده منبع اصلی"
            className="flex items-center gap-1.5 text-emerald hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            منبع اصلی
          </a>
        )}
      </div>

      {article.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.image_url}
          alt={article.title_fa}
          className="mt-6 aspect-video w-full rounded-2xl object-cover shadow-md"
        />
      )}

      <div className="mt-6 whitespace-pre-line leading-9 text-navy/85">
        {article.summary_fa}
      </div>

      {article.title_en && (
        <p className="mt-8 rounded-xl bg-cream p-4 text-sm text-navy/50" dir="ltr">
          {article.title_en}
        </p>
      )}
    </article>
  );
}