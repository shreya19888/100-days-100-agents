import { z } from "zod";

export const CharmeRecommendationSchema = z.object({
  priority: z.string(),
  explanation: z.string(),
  foodSuggestions: z.array(z.string()),
  ritualSuggestions: z.array(z.string()),
  caution: z.string().optional(),
  confidence: z.enum(["low", "medium", "high"]).optional(),
});

export const RemedyEvaluationSchema = z.object({
  remedy: z.string(),
  traditionalUse: z.string(),
  whatWeKnow: z.string(),
  potentialConsideration: z.string(),
  skinContext: z.string().optional(),
  verdict: z.enum(["KEEP", "MODIFY", "PAUSE"]),
  charmeTake: z.string(),
});

export const MealPlanSchema = z.object({
  breakfast: z.string(),
  lunch: z.string(),
  snack: z.string(),
  dinner: z.string(),
});

export const KitchenGuidanceSchema = z.object({
  todayFoods: z.array(z.string()),
  explanation: z.string(),
  note: z.string(),
  meals: MealPlanSchema.optional(),
});

export const DailyRitualSchema = z.object({
  day: z.number().int().min(1).max(7),
  focus: z.string(),
  why: z.string(),
  morning: z.array(z.string()),
  food: z.string(),
  ritual: z.string(),
  evening: z.array(z.string()),
  gloss: z.string().optional(),
});

export const TraditionalLensSchema = z.object({
  tendency: z.enum(["vata_leaning", "pitta_leaning", "kapha_leaning", "balanced"]),
  summary: z.string(),
  suggestion: z.string(),
  disclaimer: z.string(),
});

export const DailyRhythmSchema = z.object({
  morning: z.array(z.string()),
  evening: z.array(z.string()),
  note: z.string(),
});

export const SignatureMomentSchema = z.object({
  look: z.string(),
  nourish: z.string(),
  ritual: z.string(),
  recheck: z.string(),
  closing: z.string(),
});

export const CharmePlanSchema = z.object({
  priorities: z.array(CharmeRecommendationSchema).min(1).max(5),
  kitchen: KitchenGuidanceSchema,
  remedy: RemedyEvaluationSchema.optional(),
  ritual: z.array(DailyRitualSchema).length(7),
  traditionalLens: TraditionalLensSchema.optional(),
  dailyRhythm: DailyRhythmSchema.optional(),
  signature: SignatureMomentSchema.optional(),
  seasonNote: z.string().optional(),
  overallExplanation: z.string(),
  safetyNote: z.string(),
});

export type CharmePlanOutput = z.infer<typeof CharmePlanSchema>;
