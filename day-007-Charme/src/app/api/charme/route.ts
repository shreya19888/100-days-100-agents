import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateCharmePlan } from "@/lib/charme/engine";
import type { SkinAnalysis } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  analysis: z.custom<SkinAnalysis>(),
  familyWisdom: z.object({
    freeText: z.string(),
    selectedChips: z.array(z.string()),
    taughtBy: z.string().optional(),
    whenUsed: z.string().optional(),
    meaning: z.string().optional(),
  }),
  kitchen: z.object({
    ingredients: z.array(z.string()),
    customIngredients: z.array(z.string()),
  }),
  goals: z.array(z.string()).optional(),
  skinNotes: z.string().optional(),
  intent: z
    .enum(["understand", "explore_change", "habits", "rituals", "just_learn"])
    .optional(),
  intents: z
    .array(z.enum(["understand", "explore_change", "habits", "rituals", "just_learn"]))
    .optional(),
  personalGoal: z.string().optional(),
  personalGoals: z.array(z.string()).optional(),
  exploreTopics: z
    .array(
      z.enum([
        "hydration",
        "texture",
        "redness",
        "pigmentation",
        "radiance",
        "nutrition",
        "traditional_rituals",
      ]),
    )
    .optional(),
  season: z.enum(["summer", "monsoon", "autumn", "winter", "spring"]).optional(),
  traditionalAnswers: z
    .object({
      heatSensitivity: z.enum(["low", "medium", "high"]),
      digestionFeel: z.enum(["light", "variable", "heavy"]),
      energyPattern: z.enum(["scattered", "intense", "steady"]),
      climateComfort: z.enum(["cool", "neutral", "warm"]),
      sleepQuality: z.enum(["light", "mixed", "deep"]),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const body = BodySchema.parse(json);

    if (!body.analysis?.concerns?.length) {
      return NextResponse.json(
        { error: "A skin snapshot is required before CHARME can reason." },
        { status: 400 },
      );
    }

    const plan = await generateCharmePlan({
      analysis: body.analysis,
      familyWisdom: body.familyWisdom,
      kitchen: body.kitchen,
      goals: body.goals,
      season: body.season,
      traditionalAnswers: body.traditionalAnswers,
      skinNotes: body.skinNotes,
      intent: body.intent,
      intents: body.intents,
      personalGoal: body.personalGoal,
      personalGoals: body.personalGoals,
      exploreTopics: body.exploreTopics,
    });

    return NextResponse.json({ plan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Some of that input looked incomplete. Please try again." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error:
          "CHARME had trouble connecting the dots just now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
