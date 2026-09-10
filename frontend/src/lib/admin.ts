export interface AdminStats {
  counts: {
    users: number;
    doctors: number;
    patients: number;
    appointments: number;
    appointments_today: number;
    pending_appointments: number;
    videos: number;
    courses: number;
    paid_orders: number;
    revenue: number;
    news: number;
    news_published: number;
    certificates: number;
  };
  appointments_by_status: Record<string, number>;
  series: { date: string; users: number; appointments: number; orders: number }[];
  recent_users: import("@/types").User[];
  recent_orders: Array<{
    id: string;
    user_name: string;
    course: { title: string } | null;
    amount_paid: number;
    payment_status: string;
    payment_status_display: string;
    transaction_code: string;
    purchase_date: string;
  }>;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  confirmed: "تایید شده",
  completed: "انجام شده",
  canceled_by_patient: "لغو توسط بیمار",
  canceled_by_admin: "لغو توسط مدیریت",
  no_show: "عدم حضور",
  paid: "پرداخت شده",
  failed: "ناموفق",
};

export const ROLE_LABELS: Record<string, string> = {
  patient: "بیمار",
  doctor: "پزشک",
  admin: "مدیر",
  author: "نویسنده",
};

export const BODY_PARTS = ["کمر", "گردن", "زانو", "شانه", "مچ پا", "لگن"];
export const INJURIES = ["دیسک", "آرتروز", "کشیدگی", "شکستگی", "بعد از جراحی"];
export const COURSE_LEVELS = ["مقدماتی", "پیشرفته", "تخصصی"];
export const NEWS_CATEGORIES = ["تحقیقات بالینی", "تکنولوژی روز", "همایش‌ها", "متدهای نوین"];

export const inputCls =
  "w-full rounded-xl border border-navy/20 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald";

export const labelCls = "mb-1.5 block text-sm font-medium text-navy/80";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald px-5 text-sm font-bold text-white shadow-md transition-colors hover:bg-emerald-light disabled:cursor-not-allowed disabled:opacity-60";

export const btnGhost =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-navy/15 px-4 text-sm font-semibold text-navy/70 transition-colors hover:bg-navy/5";

export const btnDanger =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50";