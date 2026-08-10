import { createAnalysisFromConcerns } from "@/lib/youcam/normalize";
import type { SkinAnalysis, SkinConcern } from "@/types";

const DEMO_CONCERNS: SkinConcern[] = [
  {
    key: "hydration",
    label: "Hydration",
    rawScore: 48.2,
    uiScore: 48,
    severity: "needs_attention",
    youcamType: "hd_moisture",
  },
  {
    key: "redness",
    label: "Redness",
    rawScore: 58.4,
    uiScore: 62,
    severity: "needs_attention",
    youcamType: "hd_redness",
  },
  {
    key: "radiance",
    label: "Radiance",
    rawScore: 54.1,
    uiScore: 54,
    severity: "needs_attention",
    youcamType: "hd_radiance",
  },
  {
    key: "texture",
    label: "Texture",
    rawScore: 58.0,
    uiScore: 58,
    severity: "could_improve",
    youcamType: "hd_texture",
  },
  {
    key: "spots",
    label: "Visible spots",
    rawScore: 63.5,
    uiScore: 64,
    severity: "could_improve",
    youcamType: "hd_age_spot",
  },
  {
    key: "oiliness",
    label: "Oiliness",
    rawScore: 72.1,
    uiScore: 72,
    severity: "looking_good",
    youcamType: "hd_oiliness",
  },
  {
    key: "pores",
    label: "Pores",
    rawScore: 70.4,
    uiScore: 70,
    severity: "looking_good",
    youcamType: "hd_pore",
  },
  {
    key: "acne",
    label: "Visible blemishes",
    rawScore: 78.6,
    uiScore: 79,
    severity: "looking_good",
    youcamType: "hd_acne",
  },
  {
    key: "dark_circles",
    label: "Dark circles",
    rawScore: 66.0,
    uiScore: 66,
    severity: "could_improve",
    youcamType: "hd_dark_circle",
  },
  {
    key: "eye_bags",
    label: "Eye bags",
    rawScore: 74.2,
    uiScore: 74,
    severity: "looking_good",
    youcamType: "hd_eye_bag",
  },
  {
    key: "wrinkles",
    label: "Fine lines",
    rawScore: 71.8,
    uiScore: 72,
    severity: "looking_good",
    youcamType: "hd_wrinkle",
  },
  {
    key: "firmness",
    label: "Firmness",
    rawScore: 75.5,
    uiScore: 76,
    severity: "looking_good",
    youcamType: "hd_firmness",
  },
];

export function getDemoSkinAnalysis(sourceImageDataUrl?: string): SkinAnalysis {
  return createAnalysisFromConcerns({
    concerns: DEMO_CONCERNS,
    mode: "demo",
    overallScore: 64,
    skinAge: 29,
    sourceImageDataUrl,
  });
}

export const DEMO_PROFILE = {
  familyWisdom: {
    freeText: "My mother used to make besan, yogurt and turmeric before special occasions.",
    selectedChips: ["Besan + yogurt + turmeric"],
    taughtBy: "Mother",
    whenUsed: "Before festivals and weddings",
    meaning: "It felt like care — preparation, not vanity.",
  },
  kitchen: {
    ingredients: [
      "moong dal",
      "dahi",
      "cucumber",
      "spinach",
      "almonds",
      "papaya",
      "turmeric",
      "ginger",
      "rice",
    ],
    customIngredients: [],
  },
  season: "summer" as const,
  traditionalAnswers: {
    heatSensitivity: "high" as const,
    digestionFeel: "light" as const,
    energyPattern: "intense" as const,
    climateComfort: "cool" as const,
    sleepQuality: "mixed" as const,
  },
};

export function getDemoRecheckAnalysis(sourceImageDataUrl?: string): SkinAnalysis {
  const improved = DEMO_CONCERNS.map((c) => {
    if (c.key === "hydration")
      return { ...c, uiScore: 61, rawScore: 59.4, severity: "could_improve" as const };
    if (c.key === "redness")
      return { ...c, uiScore: 55, rawScore: 54.1, severity: "needs_attention" as const };
    if (c.key === "radiance")
      return { ...c, uiScore: 63, rawScore: 61.2, severity: "could_improve" as const };
    return c;
  });
  return createAnalysisFromConcerns({
    concerns: improved,
    mode: "demo",
    overallScore: 68,
    skinAge: 29,
    sourceImageDataUrl,
  });
}
