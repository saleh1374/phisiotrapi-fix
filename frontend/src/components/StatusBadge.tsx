import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  // appointments
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-sky-100 text-sky-800",
  canceled_by_patient: "bg-red-100 text-red-700",
  canceled_by_admin: "bg-red-100 text-red-700",
  no_show: "bg-zinc-200 text-zinc-700",
  // payments
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-700",
  // prescriptions
  "انجام شده": "bg-emerald-100 text-emerald-800",
  "در انتظار": "bg-amber-100 text-amber-800",
  "دیر شده": "bg-red-100 text-red-700",
};

export default function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
        STATUS_STYLES[status] ?? "bg-navy/10 text-navy/70"
      )}
    >
      {label}
    </span>
  );
}