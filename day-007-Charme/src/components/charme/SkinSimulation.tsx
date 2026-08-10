"use client";

import { useState } from "react";
import type { SimulationResult } from "@/types";
import { Button } from "@/components/ui/primitives";
import { AnalysisLoading } from "./AnalysisLoading";

const CONCERNS = [
  { id: "radiance", label: "Radiance" },
  { id: "redness", label: "Redness" },
  { id: "texture", label: "Texture" },
  { id: "pores", label: "Pores" },
] as const;

export function SkinSimulation({
  file,
  onClose,
}: {
  file: File | null;
  onClose: () => void;
}) {
  const [concern, setConcern] = useState<(typeof CONCERNS)[number]["id"]>("radiance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  async function run() {
    if (!file) {
      setError("Please re-upload your selfie to generate a visualization.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("concern", concern);
      form.append("intensity", "0.6");
      const response = await fetch("/api/skin-simulation", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Visualization failed");
      }
      setResult(data.result as SimulationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Visualization failed");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <AnalysisLoading label="Creating visualization" />;
  }

  return (
    <section className="mx-auto max-w-4xl animate-fade-up px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-charme-leaf">
        Optional cosmetic visualization
      </p>
      <h2 className="mt-3 font-display text-4xl text-charme-ink md:text-5xl">
        Optional cosmetic visualization
      </h2>
      <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
        This illustrates a simulated appearance change based on selected characteristics. It does
        not define healthy or beautiful skin, and it is not a prediction of actual results.
      </p>

      {!result ? (
        <>
          <div className="mt-8 flex flex-wrap gap-2">
            {CONCERNS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setConcern(item.id)}
                className={`rounded-full px-4 py-2 text-sm ${
                  concern === item.id
                    ? "bg-charme-ink text-charme-cream"
                    : "border border-charme-line bg-white/60"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {error ? <p className="mt-4 text-sm text-charme-clay">{error}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={run}>Generate visualization</Button>
            <Button variant="secondary" onClick={onClose}>
              Back
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-[1.5rem] border border-charme-line bg-white/70">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-charme-muted">
                Your photo
              </p>
              {result.beforeImageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.beforeImageDataUrl} alt="Before" className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center text-sm text-charme-muted">
                  Original selfie
                </div>
              )}
            </div>
            <div className="overflow-hidden rounded-[1.5rem] border border-charme-line bg-white/70">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-charme-muted">
                Simulated appearance (optional)
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.afterImageUrl} alt="AI visualization" className="aspect-[4/5] w-full object-cover" />
            </div>
          </div>
          <p className="mt-4 text-sm text-charme-muted">{result.disclaimer}</p>
          <div className="mt-8">
            <Button variant="secondary" onClick={onClose}>
              Back to ritual
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
