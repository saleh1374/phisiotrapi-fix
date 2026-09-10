import Spinner from "@/components/Spinner";

export default function LoadingState({
  label = "در حال بارگذاری...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 py-10 text-navy/50 ${className ?? ""}`}
    >
      <Spinner className="text-emerald" />
      {label}
    </p>
  );
}