"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, GraduationCap, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import LoadingState from "@/components/LoadingState";
import { apiFetch } from "@/lib/api";
import { faNum, faPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  discount_price: number | null;
  final_price: number;
  cover_image: string;
  level: string;
  level_display: string;
  total_hours: string;
  is_free: boolean;
  instructor_name: string;
}

const LEVELS = ["مقدماتی", "پیشرفته", "تخصصی"];

export default function AcademyPage() {
  const [level, setLevel] = useState<string | null>(null);
  const [kind, setKind] = useState<"all" | "free" | "paid">("all");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses", level, kind],
    queryFn: () => {
      const params = new URLSearchParams();
      if (level) params.set("level", level);
      if (kind !== "all") params.set("kind", kind);
      const qs = params.toString();
      return apiFetch<Course[]>(`/academy/courses/${qs ? `?${qs}` : ""}`, {}, false);
    },
  });

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-black">آکادمی تخصصی فیزیوتراپی 🎓</h1>
      <p className="mt-2 text-navy/60">
        دوره‌های آموزشی از مقدماتی تا تخصصی + گواهی‌نامه معتبر با کد اصالت
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setKind("all")}
          className={cn(
            "inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-bold",
            kind === "all" ? "bg-navy text-white" : "bg-navy/5 text-navy/70"
          )}
        >
          همه دوره‌ها
        </button>
        <button
          type="button"
          onClick={() => setKind("free")}
          className={cn(
            "inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-bold",
            kind === "free" ? "bg-emerald text-white" : "bg-navy/5 text-navy/70"
          )}
        >
          رایگان
        </button>
        <button
          type="button"
          onClick={() => setKind("paid")}
          className={cn(
            "inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-bold",
            kind === "paid" ? "bg-gold text-navy" : "bg-navy/5 text-navy/70"
          )}
        >
          پولی
        </button>
        <span className="mx-1 hidden h-10 w-px bg-navy/10 sm:block" />
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(level === l ? null : l)}
            className={cn(
              "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold",
              level === l ? "bg-emerald text-white" : "bg-navy/5 text-navy/70 hover:bg-navy/10"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingState className="mt-8" />
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/academy/${c.id}`}
              title={c.title}
              className="group overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-navy to-emerald">
                {c.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.cover_image} alt={c.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl">
                    <GraduationCap className="h-20 w-20 text-white/80" />
                  </div>
                )}
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy shadow">
                  {c.level_display}
                </span>
                {c.is_free && (
                  <span className="absolute left-3 top-3 rounded-full bg-emerald px-3 py-1 text-xs font-bold text-white shadow">
                    رایگان
                  </span>
                )}
              </div>
              <div className="p-5">
                <h2 className="font-bold leading-6">{c.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-navy/60">{c.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-navy/50">
                    <Clock className="h-3.5 w-3.5" />
                    {faNum(c.total_hours)} ساعت
                  </span>
                  <span className="text-xs text-navy/50">{c.instructor_name || "مدرس کلینیک"}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-navy/5 pt-3">
                  <p className="text-lg font-black text-emerald">
                    {c.is_free ? "رایگان" : `${faPrice(c.final_price)} تومان`}
                  </p>
                  <span className="flex items-center gap-1 text-sm font-bold text-emerald">
                    <PlayCircle className="h-4 w-4" />
                    مشاهده دوره
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}