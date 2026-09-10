"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Spinner from "@/components/Spinner";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import type { AuthResponse } from "@/types";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: number;
              shape?: "rectangular" | "pill";
              text?: string;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

const loginSchema = z.object({
  username: z.string().min(1, "نام کاربری یا شماره موبایل را وارد کنید"),
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

const registerSchema = z.object({
  full_name: z.string().optional(),
  username: z
    .string()
    .min(3, "نام کاربری باید حداقل ۳ کاراکتر باشد")
    .regex(/^[a-zA-Z0-9_.]+$/, "نام کاربری فقط حروف، عدد، «.» و «_» می‌پذیرد"),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function CredentialsAuthForm({
  mode,
}: {
  mode: "login" | "register";
}) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", username: "", password: "" },
  });

  const finishAuth = useCallback(
    (data: AuthResponse) => {
      setAuth(data.tokens, data.user);
      router.push("/dashboard");
    },
    [setAuth, router]
  );

  const googleLogin = useCallback(
    async (credential: string) => {
      setError(null);
      try {
        const data = await apiFetch<AuthResponse>(
          "/auth/google/",
          { method: "POST", body: JSON.stringify({ id_token: credential }) },
          false
        );
        finishAuth(data);
      } catch (e) {
        setError(
          errorMessage((e as { data?: unknown }).data, "ورود با گوگل ناموفق بود")
        );
      }
    },
    [finishAuth]
  );

  // Load Google Identity Services and render the sign-in button.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res) => googleLogin(res.credential),
      });
      if (googleButtonRef.current) {
        window.google?.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          shape: "rectangular",
          locale: "fa",
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [googleLogin]);

  const submitting = loginForm.formState.isSubmitting || registerForm.formState.isSubmitting;

  const handleLogin = async (values: LoginForm) => {
    setError(null);
    try {
      const data = await apiFetch<AuthResponse>(
        "/auth/login/",
        { method: "POST", body: JSON.stringify(values) },
        false
      );
      finishAuth(data);
    } catch (e) {
      setError(
        errorMessage((e as { data?: unknown }).data, "نام کاربری یا رمز عبور اشتباه است")
      );
    }
  };

  const handleRegister = async (values: RegisterForm) => {
    setError(null);
    try {
      const data = await apiFetch<AuthResponse>(
        "/auth/register/",
        { method: "POST", body: JSON.stringify(values) },
        false
      );
      finishAuth(data);
    } catch (e) {
      setError(
        errorMessage((e as { data?: unknown }).data, "خطا در ثبت‌نام")
      );
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-navy/10 bg-white p-6 shadow-xl sm:p-8">
      {mode === "login" ? (
        <form onSubmit={loginForm.handleSubmit(handleLogin)} noValidate>
          <h2 className="text-xl font-bold">ورود به حساب کاربری</h2>
          <p className="mt-2 text-sm leading-6 text-navy/60">
            با نام کاربری یا شماره موبایل و رمز عبور وارد شوید.
          </p>

          <div className="mt-5">
            <label htmlFor="login_username" className="mb-1.5 block text-sm font-medium">
              نام کاربری یا شماره موبایل
            </label>
            <input
              id="login_username"
              type="text"
              autoComplete="username"
              dir="ltr"
              placeholder="ali.rezaei"
              className="w-full rounded-xl border border-navy/20 px-4 py-3 text-base outline-none transition-colors focus:border-emerald"
              {...loginForm.register("username")}
            />
            {loginForm.formState.errors.username && (
              <p className="mt-1.5 text-sm text-red-600">
                {loginForm.formState.errors.username.message}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="login_password" className="mb-1.5 block text-sm font-medium">
              رمز عبور
            </label>
            <div className="relative">
              <input
                id="login_password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                dir="ltr"
                placeholder="••••••••"
                className="w-full rounded-xl border border-navy/20 px-4 py-3 pl-12 text-base outline-none transition-colors focus:border-emerald"
                {...loginForm.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-navy/50 hover:text-navy"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {loginForm.formState.errors.password && (
              <p className="mt-1.5 text-sm text-red-600">
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald px-5 text-base font-bold text-white shadow-md transition-colors hover:bg-emerald-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Spinner />}
            ورود
          </button>

          <p className="mt-4 text-center text-sm text-navy/60">
            حساب کاربری ندارید؟{" "}
            <Link href="/register" title="ثبت‌نام" className="font-semibold text-emerald hover:underline">
              ثبت‌نام کنید
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={registerForm.handleSubmit(handleRegister)} noValidate>
          <h2 className="text-xl font-bold">ثبت‌نام در کلینیک</h2>
          <p className="mt-2 text-sm leading-6 text-navy/60">
            با نام کاربری و رمز عبور حساب بسازید؛ فقط چند ثانیه طول می‌کشد.
          </p>

          <div className="mt-5">
            <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium">
              نام و نام خانوادگی <span className="text-navy/40">(اختیاری)</span>
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              placeholder="مثلاً علی رضایی"
              className="w-full rounded-xl border border-navy/20 px-4 py-3 text-base outline-none transition-colors focus:border-emerald"
              {...registerForm.register("full_name")}
            />
          </div>

          <div className="mt-4">
            <label htmlFor="reg_username" className="mb-1.5 block text-sm font-medium">
              نام کاربری
            </label>
            <input
              id="reg_username"
              type="text"
              autoComplete="username"
              dir="ltr"
              placeholder="ali.rezaei"
              className="w-full rounded-xl border border-navy/20 px-4 py-3 text-base outline-none transition-colors focus:border-emerald"
              {...registerForm.register("username")}
            />
            {registerForm.formState.errors.username && (
              <p className="mt-1.5 text-sm text-red-600">
                {registerForm.formState.errors.username.message}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="reg_password" className="mb-1.5 block text-sm font-medium">
              رمز عبور
            </label>
            <div className="relative">
              <input
                id="reg_password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                dir="ltr"
                placeholder="حداقل ۸ کاراکتر"
                className="w-full rounded-xl border border-navy/20 px-4 py-3 pl-12 text-base outline-none transition-colors focus:border-emerald"
                {...registerForm.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-navy/50 hover:text-navy"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {registerForm.formState.errors.password && (
              <p className="mt-1.5 text-sm text-red-600">
                {registerForm.formState.errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald px-5 text-base font-bold text-white shadow-md transition-colors hover:bg-emerald-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Spinner />}
            ساخت حساب و ورود
          </button>

          <p className="mt-4 text-center text-sm text-navy/60">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link href="/login" title="ورود" className="font-semibold text-emerald hover:underline">
              وارد شوید
            </Link>
          </p>
        </form>
      )}

      {GOOGLE_CLIENT_ID && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-navy/40">
            <span className="h-px flex-1 bg-navy/10" />
            یا ورود با
            <span className="h-px flex-1 bg-navy/10" />
          </div>
          <div ref={googleButtonRef} className="flex justify-center" />
        </>
      )}
    </div>
  );
}