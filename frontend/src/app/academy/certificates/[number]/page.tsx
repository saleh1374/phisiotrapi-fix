"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { useParams } from "next/navigation";

import LoadingState from "@/components/LoadingState";
import { apiFetch } from "@/lib/api";
import { faDate, faNum } from "@/lib/utils";

interface Certificate {
  certificate_number: string;
  user_name: string;
  course_title: string;
  issue_date: string;
}

export default function CertificateVerifyPage() {
  const params = useParams<{ number: string }>();
  const number = params.number;

  const { data, isLoading } = useQuery({
    queryKey: ["certificate-verify", number],
    queryFn: () =>
      apiFetch<{ valid: boolean; certificate: Certificate }>(
        `/academy/certificates/verify/?number=${number}`,
        {},
        false
      ),
    retry: false,
  });

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/academy/certificates/${number}`
      : "";

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 py-12">
      {isLoading ? (
        <LoadingState label="در حال استعلام..." />
      ) : !data || !data.valid ? (
        <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <ShieldAlert className="mx-auto h-14 w-14 text-red-500" />
          <h1 className="mt-4 text-xl font-black text-red-700">گواهی معتبر نیست</h1>
          <p className="mt-2 text-sm text-red-600">
            گواهی با شماره <span dir="ltr">{number}</span> در سامانه یافت نشد.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-2xl border-2 border-emerald/30 bg-white shadow-2xl">
          {/* Certificate header */}
          <div className="bg-gradient-to-l from-navy to-emerald p-8 text-center text-white">
            <p className="text-4xl">🏅</p>
            <h1 className="mt-3 text-2xl font-black">گواهی‌نامه معتبر</h1>
            <p className="mt-1 text-sm text-white/70">آکادمی تخصصی فیزیوتراپی</p>
          </div>

          <div className="p-8 text-center">
            <p className="text-sm text-navy/60">این گواهی به‌صورت رسمی صادر شده است برای:</p>
            <p className="mt-3 text-3xl font-black text-navy">{data.certificate.user_name}</p>
            <p className="mt-6 text-sm text-navy/60">پس از گذراندن موفقیت‌آمیز دوره</p>
            <p className="mt-2 text-xl font-black text-emerald">{data.certificate.course_title}</p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 border-t border-navy/10 pt-6">
              <div className="text-center">
                <p className="text-xs text-navy/50">شماره گواهی</p>
                <p className="mt-1 font-black" dir="ltr">
                  {data.certificate.certificate_number}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-navy/50">تاریخ صدور</p>
                <p className="mt-1 font-black">{faDate(data.certificate.issue_date)}</p>
              </div>
            </div>

            {/* QR code */}
            <div className="mt-8 flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}`}
                alt={`QR کد استعلام گواهی ${number}`}
                width={180}
                height={180}
                className="rounded-xl border border-navy/10"
              />
              <p className="flex items-center gap-1.5 text-xs text-navy/50">
                <BadgeCheck className="h-4 w-4 text-emerald" />
                این QR کد با اسکن، به همین صفحه استعلام هدایت می‌شود
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}