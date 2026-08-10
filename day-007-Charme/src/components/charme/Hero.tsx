"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { CharmeLogo, CharmeMark } from "@/components/charme/CharmeLogo";

export function Hero({
  onStart,
  onHowItWorks,
}: {
  onStart: () => void;
  onHowItWorks: () => void;
}) {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-6 md:pb-28 md:pt-10">
      <div className="pointer-events-none absolute inset-0 peacock-pattern" />
      <div className="pointer-events-none absolute -right-24 top-8 h-80 w-80 rounded-full bg-charme-primary/8 blur-3xl animate-float-soft" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-charme-accent/10 blur-3xl" />

      {/* Oversized peacock watermark — same mark language as logo */}
      <div
        className="pointer-events-none absolute -right-8 top-1/2 hidden -translate-y-1/2 opacity-[0.09] md:block lg:right-4 lg:opacity-[0.11]"
        aria-hidden
      >
        <CharmeMark size={380} />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-charme-border bg-charme-surface/80 px-3 py-1.5">
            <CharmeMark size={18} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-charme-accent">
              Indian wellness · AI skin intelligence
            </span>
          </div>

          <CharmeLogo size={40} className="mb-4" />

          <p className="mt-2 font-display text-3xl leading-tight text-charme-text md:text-4xl">
            Ancient wisdom.
            <br />
            Modern skin intelligence.
          </p>
          <p className="mt-6 max-w-xl font-display text-2xl leading-snug text-charme-text/90 md:text-3xl">
            Your skin doesn&apos;t need to look like anyone else&apos;s.
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-charme-muted md:text-lg">
            CHARME helps you understand your skin, explore what interests you, and choose what—if
            anything—you want to change. Beauty has always carried wisdom across generations; we
            bring that together with modern skin intelligence.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button onClick={onStart}>
              Begin Your Ritual
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={onHowItWorks}>
              How CHARME works
            </Button>
          </div>
          <p className="mt-8 max-w-lg text-sm italic leading-relaxed text-charme-muted">
            Much of what we learn about beauty isn&apos;t discovered in an app. It&apos;s passed down —
            a grandmother&apos;s ritual, a mother&apos;s kitchen wisdom, a daughter&apos;s curiosity.
          </p>
        </div>

        <div className="relative animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="mx-auto flex max-w-md flex-col items-center">
            <div className="relative mb-8 flex h-60 w-48 items-center justify-center md:h-72 md:w-56">
              <div className="mirror-frame absolute inset-0" />
              <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
                <CharmeMark size={64} />
                <p className="font-display text-xl leading-snug text-charme-text/85">
                  Look
                  <br />
                  <span className="text-base text-charme-muted">Nourish</span>
                  <br />
                  Ritual
                </p>
              </div>
            </div>

            <div className="charme-card jaali-border relative w-full overflow-hidden rounded-[2rem] p-6 md:p-7">
              <div className="pointer-events-none absolute inset-0 peacock-pattern opacity-60" />
              <div className="relative space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-charme-accent">
                  The CHARME loop
                </p>
                {[
                  "LOOK — YouCam skin snapshot",
                  "UNDERSTAND — modern + traditional lenses",
                  "NOURISH — ahara (food) from your kitchen",
                  "RITUAL — dinacharya (daily rhythm)",
                  "RECHECK — adapt with care",
                ].map((item, index) => (
                  <div key={item} className="flex gap-3 border-b border-charme-border/70 pb-3 last:border-0">
                    <span className="font-display text-xl text-charme-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="pt-1 text-sm text-charme-text">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
