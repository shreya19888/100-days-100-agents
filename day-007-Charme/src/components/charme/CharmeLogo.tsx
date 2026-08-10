"use client";

type LogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  size?: number;
  variant?: "full" | "mono";
};

/** Minimal Indian peacock forming a "C" — elegant, not literal */
export function CharmeMark({
  className = "",
  size = 32,
  variant = "full",
}: {
  className?: string;
  size?: number;
  variant?: "full" | "mono";
}) {
  const indigo = variant === "mono" ? "currentColor" : "#24344D";
  const neem = variant === "mono" ? "currentColor" : "#66735A";
  const marigold = variant === "mono" ? "currentColor" : "#C49A3A";
  const terracotta = variant === "mono" ? "currentColor" : "#A85C45";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={variant === "mono" ? `text-charme-primary ${className}` : className}
      aria-hidden
    >
      <path
        d="M68 22c-8-10-22-14-34-10C18 18 10 34 12 50c2 18 16 30 34 30 8 0 16-2 22-7"
        stroke={indigo}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M62 28c-6-7-16-11-26-8C22 24 16 36 17 48c1.2 13 12 22 26 22 6 0 12-1.4 16-4.5"
        stroke={indigo}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M56 34c-4.5-5-12-7.5-19-5.5C27 31 23 39 24 47c0.8 9 8.5 15.5 18 15.5 4.2 0 8.2-1 11-3.2"
        stroke={neem}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={variant === "mono" ? 0.55 : 1}
      />
      <path
        d="M50 40c-3-3.2-7.5-4.8-12-3.4-4.2 1.3-7 5.4-6.5 9.8 0.5 5.2 4.8 8.8 10.2 8.8"
        stroke={indigo}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <ellipse
        cx="58"
        cy="26"
        rx="5.2"
        ry="6.4"
        transform="rotate(-28 58 26)"
        fill={indigo}
      />
      {variant === "full" ? (
        <>
          <ellipse
            cx="58"
            cy="26"
            rx="3.2"
            ry="4"
            transform="rotate(-28 58 26)"
            fill={neem}
          />
          <ellipse
            cx="58.2"
            cy="25.4"
            rx="1.35"
            ry="1.7"
            transform="rotate(-28 58.2 25.4)"
            fill={marigold}
          />
          <circle cx="58.5" cy="24.8" r="0.55" fill={terracotta} />
          <ellipse
            cx="64"
            cy="48"
            rx="3.4"
            ry="4.2"
            transform="rotate(12 64 48)"
            fill={indigo}
            opacity="0.9"
          />
          <ellipse
            cx="64"
            cy="48"
            rx="2"
            ry="2.5"
            transform="rotate(12 64 48)"
            fill={neem}
          />
          <circle cx="64.3" cy="47.4" r="0.85" fill={marigold} />
        </>
      ) : (
        <ellipse
          cx="58"
          cy="26"
          rx="2.4"
          ry="3"
          transform="rotate(-28 58 26)"
          fill="none"
          stroke={indigo}
          strokeWidth="1.2"
          opacity="0.4"
        />
      )}
      <path
        d="M54 18c2.5-4 6-6.5 10-7-1.2 3.2-1 6.2 0.8 8.8"
        stroke={indigo}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="52.5" cy="20.5" r="1.6" fill={indigo} />
    </svg>
  );
}

/** Small feather-C for tight UI */
export function CharmeFeatherMark({
  className = "",
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M46 14C38 6 24 5 16 14 7 24 8 42 18 50c8 6.5 20 7 28 2"
        stroke="#24344D"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M42 20c-5.5-5-14-6-20-1.5-7 5-7 17-1 23 5 5.2 14 6 20 2.5"
        stroke="#24344D"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
      <ellipse cx="40" cy="18" rx="5" ry="6.2" transform="rotate(-30 40 18)" fill="#24344D" />
      <ellipse cx="40" cy="18" rx="3" ry="3.8" transform="rotate(-30 40 18)" fill="#66735A" />
      <ellipse
        cx="40.2"
        cy="17.3"
        rx="1.3"
        ry="1.6"
        transform="rotate(-30 40.2 17.3)"
        fill="#C49A3A"
      />
    </svg>
  );
}

export function CharmeLogo({
  className = "",
  markClassName = "",
  showWordmark = true,
  size = 34,
}: LogoProps) {
  /* Mark : wordmark ≈ 1 : 2.5 — peacock stays secondary to CHARME */
  const wordSize = Math.round(size * 1.05);

  return (
    <span className={`inline-flex items-center gap-[0.55em] text-charme-text ${className}`}>
      <CharmeMark size={size} className={markClassName} />
      {showWordmark ? (
        <span
          className="font-display leading-none tracking-[0.14em] text-charme-text"
          style={{ fontSize: `${wordSize}px` }}
        >
          CHARME
        </span>
      ) : null}
    </span>
  );
}
