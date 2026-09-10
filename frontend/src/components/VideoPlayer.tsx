"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface Props {
  title: string;
  url: string;
  onClose: () => void;
  onComplete?: () => void;
}

export default function VideoPlayer({ title, url, onClose, onComplete }: Props) {
  // Close on Escape; lock body scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-dark/80 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-5 py-3">
          <p className="truncate text-sm font-bold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-navy/60 hover:bg-navy/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <video
          controls
          autoPlay
          playsInline
          src={url}
          className="aspect-video w-full bg-black"
          onEnded={() => onComplete?.()}
        />
      </div>
    </div>
  );
}