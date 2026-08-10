import type { ConcernSeverity, SkinAnalysis, SkinConcern, SkinConcernKey } from "@/types";
import type { YouCamAnalysisOutputItem } from "./types";
import { buildDignityStorySummary, dignityLabel } from "@/lib/charme/skin-dignity";

const CONCERN_MAP: Record<
  string,
  { key: SkinConcernKey; label: string }
> = {
  hd_moisture: { key: "hydration", label: "Hydration" },
  moisture: { key: "hydration", label: "Hydration" },
  hd_redness: { key: "redness", label: "Redness" },
  redness: { key: "redness", label: "Redness" },
  hd_radiance: { key: "radiance", label: "Radiance" },
  radiance: { key: "radiance", label: "Radiance" },
  hd_oiliness: { key: "oiliness", label: "Oiliness" },
  oiliness: { key: "oiliness", label: "Oiliness" },
  hd_pore: { key: "pores", label: "Pores" },
  pore: { key: "pores", label: "Pores" },
  hd_texture: { key: "texture", label: "Texture" },
  texture: { key: "texture", label: "Texture" },
  hd_acne: { key: "acne", label: "Visible blemishes" },
  acne: { key: "acne", label: "Visible blemishes" },
  hd_age_spot: { key: "spots", label: "Visible spots" },
  age_spot: { key: "spots", label: "Visible spots" },
  hd_wrinkle: { key: "wrinkles", label: "Fine lines" },
  wrinkle: { key: "wrinkles", label: "Fine lines" },
  hd_dark_circle: { key: "dark_circles", label: "Dark circles" },
  dark_circle_v2: { key: "dark_circles", label: "Dark circles" },
  dark_circle: { key: "dark_circles", label: "Dark circles" },
  hd_eye_bag: { key: "eye_bags", label: "Eye bags" },
  eye_bag: { key: "eye_bags", label: "Eye bags" },
  hd_firmness: { key: "firmness", label: "Firmness" },
  firmness: { key: "firmness", label: "Firmness" },
};

export function scoreToSeverity(score: number): ConcernSeverity {
  if (score < 55) return "needs_attention";
  if (score < 70) return "could_improve";
  return "looking_good";
}

export function severityLabel(severity: ConcernSeverity): string {
  switch (severity) {
    case "needs_attention":
      return "Notable in this snapshot";
    case "could_improve":
      return "Visible characteristic";
    default:
      return "Observed";
  }
}

function preferWholeRegion(items: YouCamAnalysisOutputItem[]) {
  const byType = new Map<string, YouCamAnalysisOutputItem>();
  for (const item of items) {
    const existing = byType.get(item.type);
    if (!existing) {
      byType.set(item.type, item);
      continue;
    }
    if (item.region === "whole" || (!existing.region && item.region)) {
      byType.set(item.type, item);
    }
  }
  return Array.from(byType.values());
}

export function mapYouCamOutputToConcerns(
  output: YouCamAnalysisOutputItem[],
): SkinConcern[] {
  const preferred = preferWholeRegion(output);
  const concerns: SkinConcern[] = [];

  for (const item of preferred) {
    const mapped = CONCERN_MAP[item.type];
    if (!mapped) continue;
    const raw = typeof item.raw_score === "number" ? item.raw_score : item.ui_score ?? 0;
    const ui = typeof item.ui_score === "number" ? item.ui_score : Math.round(raw);
    concerns.push({
      key: mapped.key,
      label: dignityLabel(mapped.key, mapped.label),
      rawScore: Number(raw.toFixed(2)),
      uiScore: ui,
      severity: scoreToSeverity(ui),
      maskUrl: item.mask_urls?.[0],
      youcamType: item.type,
    });
  }

  return concerns;
}

export function buildSkinStory(concerns: SkinConcern[]): {
  priorities: SkinConcern[];
  storySummary: string;
  pigmentNote?: string;
} {
  return buildDignityStorySummary(concerns);
}

export function createAnalysisFromConcerns(params: {
  concerns: SkinConcern[];
  mode: "real" | "demo";
  overallScore?: number;
  skinAge?: number;
  sourceImageDataUrl?: string;
}): SkinAnalysis {
  const { priorities, storySummary } = buildSkinStory(params.concerns);
  return {
    id: `analysis_${Date.now()}`,
    createdAt: new Date().toISOString(),
    mode: params.mode,
    overallScore: params.overallScore,
    skinAge: params.skinAge,
    concerns: params.concerns,
    priorities,
    storySummary,
    // Never pre-attach pigment copy from YouCam alone
    pigmentNote: undefined,
    disclaimer:
      "These are AI-generated cosmetic measurements of visible characteristics — not a medical diagnosis, and not a judgment. Scores are not good/bad grades.",
    sourceImageDataUrl: params.sourceImageDataUrl,
  };
}
