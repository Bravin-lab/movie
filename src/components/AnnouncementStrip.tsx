"use client";

import { useState } from "react";

const announcementText =
  "Download option added in v2.0.1 • Streaming improvements coming soon...";

export default function AnnouncementStrip() {
  const [isDismissed, setIsDismissed] = useState(false);

  const dismiss = () => {
    setIsDismissed(true);

  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className="mt-3 overflow-hidden rounded-2xl border px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
      style={{
        background: "linear-gradient(90deg, #120d2b, #2b145c)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        color: "#d8d8ff",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="marquee-track flex min-w-max items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.25em] sm:text-[12px]">
            <span className="inline-flex items-center gap-3 whitespace-nowrap">
              <span
                className="rounded-full px-3 py-1 text-[0.65rem] tracking-[0.45em]"
                style={{
                  background: "rgba(138, 92, 246, 0.2)",
                  border: "1px solid #8b5cf6",
                  color: "#c4b5fd",
                }}
              >
                [Announcement]
              </span>
              <span>{announcementText}</span>
            </span>
            <span className="inline-flex items-center gap-3 whitespace-nowrap" aria-hidden="true">
              <span
                className="rounded-full px-3 py-1 text-[0.65rem] tracking-[0.45em]"
                style={{
                  background: "rgba(138, 92, 246, 0.2)",
                  border: "1px solid #8b5cf6",
                  color: "#c4b5fd",
                }}
              >
                [Announcement]
              </span>
              <span>{announcementText}</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/15 text-lg font-light transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Dismiss announcement"
          title="Dismiss announcement"
        >
          ✕
        </button>
      </div>
    </div>
  );
}