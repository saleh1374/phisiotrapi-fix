"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "خانه" },
  { href: "/appointment", label: "رزرو نوبت" },
  { href: "/videos", label: "فیلم‌های آموزشی" },
  { href: "/academy", label: "آکادمی" },
  { href: "/magazine", label: "مجله علمی" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" title="کلینیک فیزیوتراپی">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald text-xl font-black text-white shadow-md">
        ف
      </span>
      <span className="hidden text-lg font-bold sm:block">
        کلینیک <span className="text-emerald">فیزیوتراپی</span>
      </span>
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        {/* Desktop navigation */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                title={link.label}
                className={cn(
                  "inline-flex min-h-12 items-center rounded-lg px-4 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-navy/5 text-emerald"
                    : "text-navy/80 hover:bg-navy/5 hover:text-navy"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  title="پنل مدیریت"
                  className="inline-flex min-h-12 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white transition-colors hover:bg-navy-light"
                >
                  پنل مدیریت
                </Link>
              )}
              <Link
                href="/dashboard"
                title="داشبورد من"
                className="inline-flex min-h-12 items-center rounded-xl border border-emerald/30 px-4 text-sm font-semibold text-emerald transition-colors hover:bg-emerald/5"
              >
                {user.full_name || user.phone_number}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="خروج"
                className="inline-flex min-h-12 items-center gap-1.5 rounded-xl border border-navy/15 px-4 text-sm font-medium text-navy/70 transition-colors hover:bg-navy/5"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                title="ورود به حساب کاربری"
                className="inline-flex min-h-12 items-center rounded-xl border border-navy/15 px-4 text-sm font-medium text-navy/80 transition-colors hover:bg-navy/5"
              >
                ورود
              </Link>
              <Link
                href="/register"
                title="ثبت‌نام"
                className="inline-flex min-h-12 items-center rounded-xl bg-emerald px-5 text-sm font-bold text-white shadow-md transition-colors hover:bg-emerald-light"
              >
                ثبت‌نام
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger (min touch target 48px) */}
        <button
          type="button"
          aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-navy md:hidden"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile drawer — slides in from the right (RTL) */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-opacity md:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      >
        <div className="absolute inset-0 bg-navy-dark/50" />
        <aside
          className={cn(
            "absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300",
            menuOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-16 items-center justify-between border-b border-navy/10 px-4">
            <Logo />              <button
                type="button"
                aria-label="بستن منو"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-navy/70"
              >
                <X className="h-6 w-6" />
              </button>
          </div>

          <ul className="flex flex-col gap-1 p-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  title={link.label}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-navy/85 hover:bg-navy/5"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-3 border-t border-navy/10 p-4">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    title="پنل مدیریت"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-navy px-4 text-sm font-bold text-white"
                  >
                    پنل مدیریت
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  title="داشبورد من"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald px-4 text-sm font-bold text-white"
                >
                  داشبورد من
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-navy/15 px-4 text-sm font-medium text-navy/70"
                >
                  <LogOut className="h-4 w-4" />
                  خروج
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  title="ورود"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-navy/15 px-4 text-sm font-medium text-navy/80"
                >
                  ورود
                </Link>
                <Link
                  href="/register"
                  title="ثبت‌نام"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald px-4 text-sm font-bold text-white"
                >
                  ثبت‌نام
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </header>
  );
}