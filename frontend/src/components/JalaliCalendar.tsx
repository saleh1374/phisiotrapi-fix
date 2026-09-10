"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { faNum } from "@/lib/utils";
import { buildMonthGrid, JALALI_MONTHS, toJalali } from "@/lib/jalali";
import { cn } from "@/lib/utils";

interface Props {
  /** Map of iso date → free slots count (from the backend). */
  availableDays: Map<string, number>;
  selectedDate: string | null;
  onSelect: (date: string) => void;
  /** Dates that must not be selectable (e.g. general holidays). */
  disabledDates?: Set<string>;
}

export default function JalaliCalendar({
  availableDays,
  selectedDate,
  onSelect,
  disabledDates = new Set(),
}: Props) {
  const [todayJY, todayJM] = toJalali(new Date());
  const [jy, setJy] = useState(todayJY);
  const [jm, setJm] = useState(todayJM);

  const cells = useMemo(() => buildMonthGrid(jy, jm), [jy, jm]);

  const navigate = (delta: number) => {
    let nextM = jm + delta;
    let nextY = jy;
    if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    } else if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setJm(nextM);
    setJy(nextY);
  };

  const goToToday = () => {
    setJy(todayJY);
    setJm(todayJM);
  };

  return (
    <div className="select-none rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="ماه قبل"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-navy/10 text-navy/70 transition-colors hover:bg-navy/5"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={goToToday}
          className="text-base font-bold"
          title="بازگشت به ماه جاری"
        >
          {JALALI_MONTHS[jm - 1]} {faNum(jy)}
        </button>
        <button
          type="button"
          onClick={() => navigate(1)}
          aria-label="ماه بعد"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-navy/10 text-navy/70 transition-colors hover:bg-navy/5"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday header (Saturday first) */}
      <div className="mt-4 grid grid-cols-7 text-center text-sm font-bold text-navy/50">
        {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((w, i) => (
          <div key={i} className="py-2">
            {w}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell.date) {
            return <div key={`b${i}`} className="h-11" />;
          }
          const count = availableDays.get(cell.date) ?? 0;
          const disabled = disabledDates.has(cell.date) || count === 0;
          const selected = selectedDate === cell.date;

          return (
            <button
              key={cell.date}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(cell.date)}
              title={disabled ? "نوبت خالی ندارد" : `${faNum(count)} نوبت خالی`}
              className={cn(
                "relative flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition-all",
                selected
                  ? "bg-emerald text-white shadow-md"
                  : disabled
                    ? "cursor-not-allowed text-navy/25"
                    : "text-navy hover:bg-emerald/10",
                cell.isToday && !selected && "ring-1 ring-gold"
              )}
            >
              {faNum(cell.jd)}
              {count > 0 && !selected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-navy/5 pt-3 text-xs text-navy/60">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald" />
          دارای نوبت خالی
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-navy/20 bg-white" />
          بدون نوبت / تعطیل
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full ring-1 ring-gold" />
          امروز
        </span>
      </div>
    </div>
  );
}

/** Helper: iso string → Persian weekday + day, e.g. «دوشنبه ۱۵ مهر». */
export function faLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const g = new Date(y, m - 1, d);
  const [jy, jm, jd] = toJalali(g);
  const weekday = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"][g.getDay()];
  return `${weekday} ${faNum(jd)} ${JALALI_MONTHS[jm - 1]}`;
}