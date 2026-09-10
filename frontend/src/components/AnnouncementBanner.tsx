"use client";

import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";

import { apiFetch } from "@/lib/api";

export default function AnnouncementBanner() {
  const { data } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () =>
      apiFetch<{ announcement: string }>("/public/settings/", {}, false),
    staleTime: 5 * 60_000,
  });

  if (!data?.announcement) return null;

  return (
    <div className="bg-gold px-4 py-2 text-center text-sm font-bold text-navy">
      <span className="inline-flex items-center gap-2">
        <Megaphone className="h-4 w-4 shrink-0" />
        {data.announcement}
      </span>
    </div>
  );
}