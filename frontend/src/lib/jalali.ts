/**
 * Jalali (Persian/Solar Hijri) calendar conversion — based on the well-known
 * jalaali-js algorithm. All functions work with 1-based months/days.
 */

function div(a: number, b: number): number {
  return ~~(a / b);
}

function mod(a: number, b: number): number {
  return a - ~~(a / b) * b;
}

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
];

export interface JalCalResult {
  leap: number;
  gy: number;
  march: number;
}

export function jalCal(jy: number): JalCalResult {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jm = 0;
  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

export function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

export function d2g(jdn: number): [number, number, number] {
  let j = 4 * jdn + 139361631;
  j =
    j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return [gy, gm, gd];
}

export function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

export function d2j(jdn: number): [number, number, number] {
  const gy = d2g(jdn)[0];
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let jd = jdn - jdn1f;
  if (jd >= 0) {
    if (jd <= 185) {
      const jm = 1 + div(jd, 31);
      const jday = mod(jd, 31) + 1;
      return [jy, jm, jday];
    }
    jd = jd - 186;
  } else {
    jy = jy - 1;
    jd = jd + 179;
    if (r.leap === 1) jd = jd + 1;
  }
  const jm = 7 + div(jd, 30);
  const jday = mod(jd, 30) + 1;
  return [jy, jm, jday];
}

/** Gregorian date → Jalali [year, month, day]. */
export function toJalali(date: Date): [number, number, number] {
  return d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()));
}

/** Jalali [year, month, day] → Gregorian Date (local midnight). */
export function fromJalali(jy: number, jm: number, jd: number): Date {
  const jdn = j2d(jy, jm, jd);
  const [gy, gm, gd] = d2g(jdn);
  return new Date(gy, gm - 1, gd);
}

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

/** Number of days in a Jalali month (Esfand depends on leap year). */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalCal(jy).leap === 1 ? 30 : 29;
}

export interface CalendarDay {
  /** Gregorian ISO date (yyyy-mm-dd). */
  date: string;
  /** Jalali day number. */
  jd: number;
  /** Day-of-week index (0 = Saturday). */
  weekday: number;
  isToday: boolean;
}

/** Build the visible grid for a given Jalali month (42 cells, Saturday-first). */
export function buildMonthGrid(jy: number, jm: number): CalendarDay[] {
  const firstOfMonth = fromJalali(jy, jm, 1);
  // 0 = Sunday in JS; Jalali weeks start Saturday → shift.
  let startWeekday = (firstOfMonth.getDay() + 1) % 7;
  const length = jalaliMonthLength(jy, jm);
  const todayIso = isoDate(new Date());

  const cells: CalendarDay[] = [];
  // Leading cells from the previous month (blank).
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ date: "", jd: 0, weekday: i, isToday: false });
  }
  for (let jd = 1; jd <= length; jd += 1) {
    const g = fromJalali(jy, jm, jd);
    cells.push({
      date: isoDate(g),
      jd,
      weekday: (startWeekday + jd - 1) % 7,
      isToday: isoDate(g) === todayIso,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: "", jd: 0, weekday: cells.length % 7, isToday: false });
  }
  return cells;
}