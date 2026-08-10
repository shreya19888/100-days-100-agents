"use client";

import type { SkinConcern } from "@/types";
import { severityLabel } from "@/lib/charme/labels";
import { isIdentityConcern } from "@/lib/charme/skin-dignity";

export function SkinConcernCard({
  concern,
  index,
  honorPigment = false,
}: {
  concern: SkinConcern;
  index: number;
  honorPigment?: boolean;
}) {
  const identity = honorPigment && isIdentityConcern(concern.key);

  return (
    <article className="charme-card rounded-[1.5rem] p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="font-display text-3xl text-charme-saffron">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            identity
              ? "bg-charme-primary/10 text-charme-primary"
              : "bg-charme-sandalwood/60 text-charme-muted"
          }`}
        >
          {severityLabel(concern.severity, identity ? concern.key : undefined)}
        </span>
      </div>
      <h4 className="mt-4 font-display text-3xl text-charme-ink">{concern.label}</h4>
      <p className="mt-3 text-sm text-charme-muted">
        {identity
          ? "Seen and honored · optional to explore"
          : `${concern.uiScore} · cosmetic measurement`}
      </p>
      {!identity ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-charme-sand">
          <div
            className="h-full rounded-full bg-gradient-to-r from-charme-leaf to-charme-saffron"
            style={{ width: `${Math.max(8, Math.min(100, concern.uiScore))}%` }}
          />
        </div>
      ) : null}
    </article>
  );
}
