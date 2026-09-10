"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, PlayCircle, Search } from "lucide-react";
import { useState } from "react";

import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import VideoPlayer from "@/components/VideoPlayer";
import { apiFetch } from "@/lib/api";
import { faNum } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail: string;
  body_part_display: string;
  injury_type_display: string;
  view_count: number;
  duration_minutes: number;
}

const BODY_PARTS = ["کمر", "گردن", "زانو", "شانه", "مچ پا", "لگن"];
const INJURIES = ["دیسک", "آرتروز", "کشیدگی", "شکستگی", "بعد از جراحی"];

export default function VideosPage() {
  const [bodyPart, setBodyPart] = useState<string | null>(null);
  const [injury, setInjury] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState<Video | null>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos", bodyPart, injury, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (bodyPart) params.set("body_part", bodyPart);
      if (injury) params.set("injury_type", injury);
      if (search) params.set("search", search);
      const qs = params.toString();
      return apiFetch<Video[]>(`/videos/${qs ? `?${qs}` : ""}`, {}, false);
    },
  });

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-black">کتابخانه فیلم‌های آموزشی 🎬</h1>
      <p className="mt-2 text-navy/60">
        تمرینات استاندارد برای هر ناحیه از بدن — تهیه‌شده توسط تیم فیزیوتراپی کلینیک
      </p>

      {/* Search */}
      <div className="relative mt-6 max-w-md">
        <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy/40" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در فیلم‌ها..."
          className="w-full rounded-xl border border-navy/20 py-3 pr-12 pl-4 text-sm outline-none transition-colors focus:border-emerald"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setBodyPart(null)}
          className={cn(
            "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors",
            !bodyPart ? "bg-navy text-white" : "bg-navy/5 text-navy/70 hover:bg-navy/10"
          )}
        >
          همه نواحی
        </button>
        {BODY_PARTS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBodyPart(bodyPart === b ? null : b)}
            className={cn(
              "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors",
              bodyPart === b ? "bg-emerald text-white" : "bg-navy/5 text-navy/70 hover:bg-navy/10"
            )}
          >
            {b}
          </button>
        ))}
        <span className="mx-1 hidden h-10 w-px bg-navy/10 sm:block" />
        {INJURIES.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInjury(injury === i ? null : i)}
            className={cn(
              "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors",
              injury === i ? "bg-gold text-navy" : "bg-navy/5 text-navy/70 hover:bg-navy/10"
            )}
          >
            {i}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingState className="mt-8" />
      ) : videos.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon="🎬"
            title="فیلمی یافت نشد"
            description="با فیلترهای دیگری جستجو کنید یا بعداً دوباره سر بزنید."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <article
              key={v.id}
              className="group overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <button
                type="button"
                onClick={() => setPlaying(v)}
                className="relative block aspect-video w-full overflow-hidden bg-navy-dark"
                title={`پخش ${v.title}`}
              >
                {v.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy to-emerald text-5xl">
                    🎥
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-navy-dark/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <PlayCircle className="h-14 w-14 text-white drop-shadow-lg" />
                </span>
                <span className="absolute bottom-2 left-2 rounded-md bg-navy-dark/70 px-2 py-0.5 text-xs font-bold text-white">
                  {faNum(v.duration_minutes)} دقیقه
                </span>
              </button>
              <div className="p-4">
                <h2 className="font-bold leading-6">{v.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-navy/60">{v.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold text-emerald">
                    {v.body_part_display}
                  </span>
                  <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-navy/70">
                    {v.injury_type_display}
                  </span>
                  <span className="mr-auto flex items-center gap-1 text-xs text-navy/40">
                    <Eye className="h-3.5 w-3.5" />
                    {faNum(v.view_count)} بازدید
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {playing && (
        <VideoPlayer title={playing.title} url={playing.video_url} onClose={() => setPlaying(null)} />
      )}
    </section>
  );
}