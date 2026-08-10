"use client";

import type { ReactNode } from "react";
import { CharmeMark } from "@/components/charme/CharmeLogo";

type OpenAIInsightProps = {
  title?: string;
  text: string;
  children?: ReactNode;
  poweredBy?: "OpenAI" | false;
  className?: string;
};

/**
 * Tasteful attribution for content actually reasoned by OpenAI.
 * Only pass poweredBy="OpenAI" when plan.mode === "ai".
 */
export function OpenAIInsight({
  title = "CHARME Insight",
  text,
  children,
  poweredBy = false,
  className = "",
}: OpenAIInsightProps) {
  return (
    <article
      className={`charme-card insight-peacock relative overflow-hidden rounded-[1.75rem] border border-charme-border p-5 md:p-6 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 peacock-pattern opacity-[0.9]" />
      <div
        className="pointer-events-none absolute -right-6 -top-4 opacity-[0.08]"
        aria-hidden
      >
        <CharmeMark size={120} />
      </div>
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <CharmeMark size={22} />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charme-primary">
            {title}
          </p>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-charme-text md:text-[0.95rem]">{text}</p>
        {children}
        {poweredBy === "OpenAI" ? (
          <p className="mt-4 flex items-center gap-2 text-[11px] font-medium italic tracking-[0.02em] text-charme-muted">
            Powered by OpenAI
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function OpenAIAttribution({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="mt-3 text-[11px] font-medium italic tracking-[0.02em] text-charme-muted">
      Powered by OpenAI
    </p>
  );
}
