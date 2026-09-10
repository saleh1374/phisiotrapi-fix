"use client";

import {
  CalendarDays,
  CreditCard,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Settings,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const NAV = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/appointments", label: "نوبت‌ها", icon: CalendarDays },
  { href: "/admin/videos", label: "فیلم‌ها", icon: Video },
  { href: "/admin/courses", label: "دوره‌ها", icon: GraduationCap },
  { href: "/admin/news", label: "اخبار", icon: Newspaper },
  { href: "/admin/orders", label: "سفارش‌ها", icon: CreditCard },
  { href: "/admin/settings", label: "تنظیمات سایت", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, accessToken, hasHydrated, clearAuth } = useAuthStore();

  useEffect(() => {
    // Wait for the persisted session to hydrate before deciding to redirect.
    if (!hasHydrated) return;
    if (!accessToken || !user) router.replace("/login");
    else if (user.role !== "admin") router.replace("/dashboard");
  }, [accessToken, user, hasHydrated, router]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-cream">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-lg font-black text-white">
              م
            </span>
            <div>
              <p className="text-sm font-black leading-5">پنل مدیریت</p>
              <p className="text-xs text-navy/50">کلینیک فیزیوتراپی</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              title="مشاهده سایت"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-navy/15 px-3 text-sm font-semibold text-navy/80 hover:bg-navy/5"
            >
              <ExternalLink className="h-4 w-4" />
              مشاهده سایت
            </Link>
            <button
              type="button"
              onClick={() => {
                clearAuth();
                router.push("/");
              }}
              title="خروج"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              خروج
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-t border-navy/5 px-3 py-2 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold",
                pathname === item.href
                  ? "bg-emerald text-white"
                  : "text-navy/70 hover:bg-navy/5"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col gap-1 border-l border-navy/10 p-4 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold transition-colors",
                pathname === item.href
                  ? "bg-emerald text-white shadow-md"
                  : "text-navy/70 hover:bg-white hover:text-navy"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}