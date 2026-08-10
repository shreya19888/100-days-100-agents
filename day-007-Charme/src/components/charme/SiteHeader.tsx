"use client";

import Link from "next/link";
import { CharmeLogo } from "@/components/charme/CharmeLogo";
import { Button } from "@/components/ui/primitives";

const STEPS = ["Look", "Lenses", "Nourish", "Ritual", "Recheck"] as const;

export function SiteHeader({
  stepIndex,
  onLoadDemo,
  showTagline = false,
}: {
  stepIndex?: number;
  onLoadDemo?: () => void;
  showTagline?: boolean;
}) {
  return (
    <header className="relative z-20 mx-auto w-full max-w-6xl px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="group min-w-0">
          <CharmeLogo size={32} />
          {showTagline ? (
            <p className="mt-1 hidden text-[11px] tracking-[0.04em] text-charme-muted sm:block">
              Ancient wisdom. Modern skin intelligence.
            </p>
          ) : null}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-charme-muted md:flex">
          {STEPS.map((step, index) => (
            <span
              key={step}
              className={
                stepIndex !== undefined && index <= stepIndex ? "text-charme-text" : "opacity-60"
              }
            >
              {step}
            </span>
          ))}
        </nav>
        {onLoadDemo ? (
          <Button
            variant="ghost"
            className="shrink-0 px-3 py-2 text-xs uppercase tracking-[0.14em]"
            onClick={onLoadDemo}
          >
            Load Demo
          </Button>
        ) : (
          <div className="w-24" />
        )}
      </div>
    </header>
  );
}
