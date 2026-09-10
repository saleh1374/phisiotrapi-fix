"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error in development only — never leak it to users.
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-7xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-4xl">
        😕
      </div>
      <h1 className="mt-6 text-2xl font-bold">مشکلی پیش آمد</h1>
      <p className="mt-3 max-w-md leading-8 text-navy/60">
        خطایی غیرمنتظره رخ داد. لطفاً دوباره تلاش کنید؛ اگر مشکل ادامه داشت،
        به پشتیبانی کلینیک اطلاع دهید.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-emerald px-8 text-base font-bold text-white shadow-md transition-colors hover:bg-emerald-light"
      >
        تلاش دوباره
      </button>
    </section>
  );
}