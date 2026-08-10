import Link from "next/link";
import type { ReactNode } from "react";
import { SAFETY_FOOTER } from "@/lib/charme/safety";

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-charme-primary text-charme-ivory hover:bg-[#1a2638] shadow-[0_10px_30px_rgba(36,52,77,0.22)]"
      : variant === "secondary"
        ? "bg-transparent text-charme-text border border-charme-accent/35 hover:border-charme-accent hover:bg-charme-accent/10"
        : "bg-transparent text-charme-muted hover:text-charme-text";

  if (href) {
    return (
      <Link href={href} className={`${base} ${styles} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-2xl animate-fade-up">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-charme-clay">
          {eyebrow}
        </p>
      ) : null}
      <div className="ornament-line mb-4 max-w-[10rem]">
        <span className="ornament-dot" />
      </div>
      <h2 className="font-display text-4xl leading-tight text-charme-ink md:text-5xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-base leading-relaxed text-charme-muted md:text-lg">{subtitle}</p> : null}
    </div>
  );
}

export function SafetyFooter() {
  return (
    <footer className="relative border-t border-charme-line/80 px-6 py-10 text-center text-xs leading-relaxed text-charme-muted">
      <div className="ornament-line mx-auto mb-6 max-w-xs">
        <span className="ornament-dot" />
      </div>
      <p className="mx-auto max-w-3xl">{SAFETY_FOOTER}</p>
    </footer>
  );
}

export function DemoBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-4 z-50 rounded-full border border-charme-saffron/30 bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-charme-muted shadow-sm backdrop-blur">
      Demo Mode
    </div>
  );
}
