import type { Metadata, Viewport } from "next";

import AnnouncementBanner from "@/components/AnnouncementBanner";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Providers from "@/components/Providers";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "کلینیک فیزیوتراپی | رزرو نوبت، فیلم آموزشی و آکادمی تخصصی",
    template: "%s | کلینیک فیزیوتراپی",
  },
  description:
    "کلینیک فیزیوتراپی — رزرو نوبت آنلاین، کتابخانه فیلم‌های آموزشی اختصاصی، آکادمی دوره‌های تخصصی و مجله علمی فیزیوتراپی.",
  applicationName: "کلینیک فیزیوتراپی",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1b2a4a",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="flex min-h-screen flex-col bg-white text-navy antialiased">
        <Providers>
          <AnnouncementBanner />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}