import type {
  CharmePlan,
  CharmeRecommendation,
  DailyRitual,
  FamilyWisdom,
  KitchenInventory,
  RemedyEvaluation,
  Season,
  SkinAnalysis,
  SkinConcernKey,
  TraditionalLensAnswers,
  TraditionalLensResult,
} from "@/types";
import { FOOD_NOTES, SEASON_NOTES, deriveTraditionalLens, findRemedyKnowledge } from "./knowledge";
import { ANALYSIS_DISCLAIMER, FOOD_DISCLAIMER, ensureSafetyNote, softenUnsafeLanguage } from "./safety";
import { CharmePlanSchema } from "./schemas";
import { CHARME_SYSTEM_PROMPT, buildCharmeUserPrompt } from "./prompts";
import { getAIProvider } from "@/lib/ai/provider";
import {
  SPOTS_PRIORITY_HEURISTIC,
  careFocusConcerns,
  isIdentityConcern,
  pigmentAcknowledgment,
  shouldHonorPigmentMap,
} from "./skin-dignity";
import type { CharmeIntent, ExploreTopic } from "./intents";
import { exploreTopicToConcernKey, intentsToGoals } from "./intents";
import { buildSnapshotDigest, groundOverallExplanation } from "./snapshot-digest";
import { pickAyurvedaRituals, ritualFocusTitle } from "./rituals";

function personalGoalConcernKeys(personalGoals: string[] = []): SkinConcernKey[] {
  const keys: SkinConcernKey[] = [];
  const text = personalGoals.join(" ").toLowerCase();
  if (/hydrat/.test(text)) keys.push("hydration");
  if (/redness|red\b/.test(text)) keys.push("redness");
  if (/texture|line|wrinkle/.test(text)) keys.push("texture");
  if (/radiance|glow/.test(text)) keys.push("radiance");
  if (/pore/.test(text)) keys.push("pores");
  // Do not auto-map vague words like tone/mark/spot → spots (avoids unwanted pigment framing)
  return keys;
}

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pick(ingredients: string[], candidates: string[], fallback: string) {
  const found = candidates.find((c) => ingredients.includes(c));
  return found || fallback;
}

function buildMeals(ingredients: string[]) {
  const grain = pick(ingredients, ["ragi", "oats", "rice", "millets", "bajra", "jowar"], "oats");
  const dal = pick(ingredients, ["moong dal", "masoor dal", "toor dal", "chana"], "moong dal");
  const green = pick(ingredients, ["spinach", "methi", "cucumber"], "spinach");
  const fruit = pick(ingredients, ["papaya", "mango", "banana", "berries", "pomegranate", "guava"], "fruit");
  const dairy = pick(ingredients, ["dahi", "yogurt", "buttermilk"], "dahi");
  const nut = pick(ingredients, ["almonds", "walnuts"], "almonds");

  return {
    breakfast: `${titleCase(grain)} porridge + ${fruit}`,
    lunch: `${titleCase(dal)} + ${green} + rice`,
    snack: `${titleCase(dairy)} + ${fruit} + ${nut}`,
    dinner: `Vegetable khichdi with ${green}`,
  };
}

function evaluateRemedy(
  wisdom: FamilyWisdom,
  analysis: SkinAnalysis,
): RemedyEvaluation | undefined {
  const text = [wisdom.freeText, ...wisdom.selectedChips].filter(Boolean).join(" · ").trim();
  if (!text) return undefined;

  const redness = analysis.concerns.find((c) => c.key === "redness");
  const hydration = analysis.concerns.find((c) => c.key === "hydration");
  const knowledge = findRemedyKnowledge(text);

  const skinContext =
    redness && redness.uiScore < 65
      ? `Because your current skin snapshot shows visible redness (${redness.uiScore}/100), CHARME recommends caution with DIY facial applications that could irritate sensitive skin.`
      : hydration && hydration.uiScore < 55
        ? `Your skin snapshot suggests hydration needs attention (${hydration.uiScore}/100), so drying DIY masks may not be the gentlest first step.`
        : undefined;

  if (!knowledge) {
    return {
      remedy: text,
      traditionalUse:
        "This sounds like a home wisdom / ghar ka nuskha — a remedy or habit passed through generations.",
      whatWeKnow:
        "Evidence for many homemade beauty preparations is limited, and recipes vary from kitchen to kitchen.",
      potentialConsideration:
        "Homemade preparations can irritate some people's skin. Patch test and stop if you notice stinging or lasting redness.",
      skinContext,
      verdict: skinContext ? "MODIFY" : "MODIFY",
      charmeTake:
        "Your family's remedy isn't automatically wrong. Let's understand it — keep the spirit, soften the intensity, and watch how your skin responds.",
    };
  }

  let verdict = knowledge.defaultVerdict;
  if (skinContext && verdict === "KEEP") verdict = "MODIFY";
  if (redness && redness.uiScore < 60 && /turmeric|besan|neem|mitti|scrub/i.test(text)) {
    verdict = verdict === "PAUSE" ? "PAUSE" : "MODIFY";
  }

  const take =
    verdict === "KEEP"
      ? knowledge.keepTake
      : verdict === "MODIFY"
        ? knowledge.modifyTake
        : knowledge.pauseTake;

  return {
    remedy: text,
    traditionalUse: knowledge.traditionalUse,
    whatWeKnow: knowledge.whatWeKnow,
    potentialConsideration: knowledge.potentialConsideration,
    skinContext,
    verdict,
    charmeTake: take,
  };
}

function buildPriorities(
  analysis: SkinAnalysis,
  kitchen: string[],
  options: {
    skinNotes?: string;
    intent?: CharmeIntent;
    intents?: CharmeIntent[];
    exploreTopics?: ExploreTopic[];
    personalGoals?: string[];
    goals?: string[];
  } = {},
): CharmeRecommendation[] {
  const foods = kitchen.slice(0, 4);
  const intentList =
    options.intents?.length
      ? options.intents
      : options.intent
        ? [options.intent]
        : (["understand"] as CharmeIntent[]);
  const explore = options.exploreTopics || [];
  const personalGoals = options.personalGoals || [];
  const justLearnOnly = intentList.length === 1 && intentList[0] === "just_learn";
  const wantsChange = intentList.includes("explore_change");
  const wantsHabits = intentList.includes("habits");
  const wantsRituals = intentList.includes("rituals");
  const recommendations: CharmeRecommendation[] = [];

  if (shouldHonorPigmentMap(options.skinNotes)) {
    const named = pigmentAcknowledgment(analysis.concerns, options.skinNotes);
    recommendations.push({
      ...SPOTS_PRIORITY_HEURISTIC,
      explanation: named || SPOTS_PRIORITY_HEURISTIC.explanation,
      foodSuggestions: foods.filter((f) =>
        ["cucumber", "dahi", "yogurt", "spinach", "papaya", "almonds"].includes(f),
      ),
    });
  }

  let ranked =
    analysis.priorities.length > 0
      ? analysis.priorities.filter(
          (c) => !(shouldHonorPigmentMap(options.skinNotes) && isIdentityConcern(c.key)),
        )
      : careFocusConcerns(analysis.concerns, 3);

  const goalKeys = [
    ...explore.map(exploreTopicToConcernKey).filter((k): k is NonNullable<typeof k> => Boolean(k)),
    ...personalGoalConcernKeys(personalGoals),
  ];
  if (goalKeys.length > 0) {
    const matched = analysis.concerns.filter((c) => goalKeys.includes(c.key));
    if (matched.length) {
      ranked = [
        ...matched,
        ...ranked.filter((c) => !matched.some((m) => m.key === c.key)),
      ];
    }
  }

  if (justLearnOnly && explore.length === 0 && goalKeys.length === 0) {
    const obs = ranked.slice(0, recommendations.length ? 2 : 3);
    for (const concern of obs) {
      recommendations.push({
        priority: `What CHARME noticed about ${concern.label.toLowerCase()}`,
        explanation: `${concern.label} measured at ${concern.uiScore} in this cosmetic snapshot. That's an observation, not a problem grade. Nothing here needs to change unless you personally want to explore it.`,
        foodSuggestions: [],
        ritualSuggestions: ["Optional: notice how your skin feels today — no action required"],
        confidence: "medium",
      });
    }
    return recommendations.slice(0, 3);
  }

  if (wantsHabits || personalGoals.some((g) => /food|hydrat|wellness|habit/i.test(g))) {
    recommendations.push({
      priority: "Nourish for general wellness",
      explanation:
        "You asked for healthier habits / food ideas. CHARME will lean on foods that can contribute nutrients supporting overall health and nutrition — not as a treatment plan for appearance.",
      foodSuggestions: foods.length ? foods : ["moong dal", "dahi", "spinach", "papaya"],
      ritualSuggestions: [
        "Eat one colorful meal today",
        "Sip water through the day",
        "Keep evenings simple",
      ],
      confidence: "high",
    });
  }

  if (wantsRituals || personalGoals.some((g) => /traditional|ritual/i.test(g))) {
    recommendations.push({
      priority: "Explore a gentle ritual",
      explanation:
        "You expressed interest in traditional wellness. CHARME can suggest a short dinacharya-inspired rhythm — optional, never a prescription.",
      foodSuggestions: foods.slice(0, 2),
      ritualSuggestions: [
        "Try a gentle besan–dahi ubtan — chickpea flour + yogurt paste, short contact",
        "Rose water mist after cleansing",
        "Light abhyanga — a few drops of oil self-massage if the season feels dry",
      ],
      confidence: "medium",
    });
  }

  const exploratory = justLearnOnly || (!wantsChange && !goalKeys.length);
  const top = ranked.slice(0, Math.max(1, 3 - recommendations.length));

  for (const [index, concern] of top.entries()) {
    const tiedToGoal = goalKeys.includes(concern.key);
    if (concern.key === "hydration") {
      recommendations.push({
        priority: tiedToGoal || wantsChange
          ? "If you'd like to explore hydration"
          : exploratory
            ? "What CHARME noticed about hydration"
            : "If you'd like to explore hydration",
        explanation: exploratory && !tiedToGoal
          ? `Hydration measured at ${concern.uiScore}. An observation for your curiosity — not a to-do.`
          : `Hydration measured at ${concern.uiScore}. ${tiedToGoal ? "This matches a goal you selected. " : ""}If you'd like to explore it, moisture inside and out can be a kind place to start.`,
        foodSuggestions: foods.length ? foods : ["cucumber", "dahi", "watermelon"],
        ritualSuggestions: [
          "Sip water consistently",
          "Moisturize on slightly damp skin",
          "Avoid over-washing",
        ],
        caution: "If tightness feels painful or severe, consider speaking with a dermatologist.",
        confidence: "high",
      });
      continue;
    }
    if (concern.key === "redness") {
      recommendations.push({
        priority: "If you'd like to explore visible redness",
        explanation: `Your skin snapshot shows visible redness (${concern.uiScore}). ${tiedToGoal ? "This matches a goal you selected. " : ""}If you'd like to explore its appearance, CHARME can suggest gentle self-care — not a mandate to change it.`,
        foodSuggestions: foods.filter((f) =>
          ["cucumber", "dahi", "yogurt", "buttermilk", "bottle gourd", "watermelon"].includes(f),
        ),
        ritualSuggestions: [
          "Skip harsh scrubs for now",
          "Use lukewarm water",
          "Introduce only one new topical at a time",
        ],
        caution: "Persistent, painful, or spreading redness may deserve clinical evaluation.",
        confidence: "high",
      });
      continue;
    }
    if (concern.key === "radiance") {
      recommendations.push({
        priority: exploratory && !tiedToGoal
          ? "What radiance can mean (optional)"
          : "Explore overall skin nutrition",
        explanation: `Radiance sits around ${concern.uiScore}. Radiance is not the same as uniformity. ${tiedToGoal ? "You asked about this area. " : ""}Steady sleep, hydration, and colorful everyday Indian meals may support how skin feels over time — only if that interests you.`,
        foodSuggestions: foods.length ? foods : ["papaya", "spinach", "pomegranate"],
        ritualSuggestions: [
          "Morning daylight when possible",
          "Keep evenings simple",
          "Gentle sun care you tolerate",
        ],
        confidence: "medium",
      });
      continue;
    }
    recommendations.push({
      priority: exploratory && !tiedToGoal
        ? `What CHARME noticed about ${concern.label.toLowerCase()}`
        : `If you'd like to explore ${concern.label.toLowerCase()}`,
      explanation: `${concern.label} measured at ${concern.uiScore}. ${
        tiedToGoal
          ? "This relates to a goal you selected."
          : exploratory
            ? "An observation for your curiosity — not a to-do."
            : "If this is related to your goals, small consistent self-care can be kinder than drastic change."
      }`,
      foodSuggestions: foods.slice(0, 3),
      ritualSuggestions: ["Keep any ritual short", "Notice how skin feels day to day"],
      confidence: index === 0 ? "medium" : "low",
    });
  }

  return recommendations.slice(0, 3);
}

function buildRitual(
  analysis: SkinAnalysis,
  kitchen: string[],
  remedy?: RemedyEvaluation,
  season?: Season,
): DailyRitual[] {
  const focusCycle = careFocusConcerns(analysis.concerns, 3).map((p) => p.label);
  while (focusCycle.length < 3) focusCycle.push("Gentle comfort");

  const foodCycle =
    kitchen.length > 0
      ? kitchen
      : ["moong dal", "dahi", "cucumber", "spinach", "almonds", "papaya", "ragi"];

  const redness = analysis.concerns.find((c) => c.key === "redness");
  const rednessElevated = Boolean(redness && redness.uiScore < 60);

  const ayurvedaWeek = pickAyurvedaRituals({
    kitchen,
    season,
    rednessElevated,
    count: 7,
  });

  // If family remedy exists, weave a gentler version into day 2
  if (remedy?.verdict === "MODIFY" && remedy.remedy) {
    ayurvedaWeek[1] = {
      ...ayurvedaWeek[1],
      title: "Family wisdom, softened",
      whatItMeans:
        "A gentler take on your family's home remedy (ghar ka nuskha) — shorter contact or the spirit kept through food.",
      practice: `Honor “${remedy.remedy}” in a gentler form — shorter contact, no scrubbing, or keep the spirit through food if the paste feels strong. Optional traditional practice — patch test; not a medical treatment.`,
    };
  }
  if (remedy?.verdict === "PAUSE") {
    ayurvedaWeek[1] = {
      ...ayurvedaWeek[1],
      title: "Pause the DIY paste — keep the meaning",
      whatItMeans:
        "Pause strong DIY topicals this week while keeping the care behind your family's remedy — through rest, food, or a simple mist.",
      practice:
        "Pause the family topical this week. Keep the cultural care through a warm meal, rest, or a simple rose-water / plain-water mist instead.",
    };
  }

  return Array.from({ length: 7 }, (_, i) => {
    const day = i + 1;
    const idea = ayurvedaWeek[i];
    const snapshotFocus = focusCycle[i % focusCycle.length];
    const food = foodCycle[i % foodCycle.length];
    return {
      day,
      focus: ritualFocusTitle(idea, day),
      why:
        day === 1
          ? `An Ayurveda-inspired kitchen ritual for day one, alongside what your snapshot highlighted around ${snapshotFocus.toLowerCase()}. Optional — only if it feels kind.`
          : `Day ${day} rotates a different traditional home practice so the week feels like a ritual journey, not one repeated mask. Snapshot note: ${snapshotFocus.toLowerCase()}.`,
      morning: [
        "Drink a full glass of water",
        "Tongue clean or oil-pull only if already part of your habit",
        "Cleanse gently if needed, then moisturize",
      ],
      food: `Include ${titleCase(food)} in a meal today. ${FOOD_NOTES[food] || "Keep portions practical and enjoyable."}`,
      ritual: idea.practice,
      gloss: idea.whatItMeans,
      evening: [
        "Remove makeup/sunscreen if worn",
        "Optional: repeat a light mist or thin oil film if the morning ritual felt good",
        "Light moisturizer",
        "Screens down a bit earlier if you can",
      ],
    };
  });
}

function buildDailyRhythm(season?: Season) {
  return {
    morning: [
      "Wake without rushing if you can",
      "Hydrate",
      "Optional: short abhyanga — a light self-massage with a few drops of oil on limbs or face",
      "Gentle movement or stretch",
      "Nourish — a real breakfast",
      "Ayurveda-inspired skin ritual of the day (mask, mist, or ubtan — a soft homemade paste)",
    ],
    evening: [
      "Wind down",
      "Optional warm jeera (cumin) / fennel / herbal sip",
      "Gentle cleanse + moisturizer",
      "Netra rest — warm palms over closed eyes — if eyes feel tired",
      "Sleep routine",
    ],
    note:
      season && SEASON_NOTES[season]
        ? `Dinacharya means a kind daily rhythm in Ayurveda. Seasonal note: ${SEASON_NOTES[season]} Rituals may include kitchen masks, ubtan (soft homemade paste), light oiling, and mists — always optional and patch-tested.`
        : "Dinacharya means a kind daily rhythm in Ayurveda. Your week can include varied kitchen rituals — masks, ubtan (soft homemade paste), oiling, rose mist. A routine is something you repeat; a ritual is something you connect with.",
  };
}

function buildSignature(
  analysis: SkinAnalysis,
  kitchen: string[],
  remedy?: RemedyEvaluation,
  skinNotes?: string,
): CharmePlan["signature"] {
  const top = careFocusConcerns(analysis.concerns, 1)[0];
  const food = kitchen[0] || "dahi";
  return {
    look: top
      ? `${top.label} appears in your skin snapshot (${top.uiScore}) — an observation you may explore if you choose.`
      : "Your skin snapshot shares a few visible characteristics for understanding.",
    nourish: `From your kitchen: include ${titleCase(food)} in a meal today.`,
    ritual:
      remedy?.verdict === "PAUSE"
        ? "One gentle practice: skip DIY topicals this week; try rose-water mist or palming instead."
        : "One Ayurveda-inspired kitchen ritual today — a soft ubtan (homemade paste), thin honey mask, light abhyanga (self-oil massage), or rose mist. Patch test; keep it optional.",
    recheck: "Come back in a few days and notice how your skin feels — lighting and life both matter.",
    closing:
      "You don't need to change everything. Start with one small, kind ritual only if it feels right.",
  };
}

export function buildHeuristicPlan(input: {
  analysis: SkinAnalysis;
  familyWisdom: FamilyWisdom;
  kitchen: KitchenInventory;
  season?: Season;
  traditionalAnswers?: TraditionalLensAnswers;
  traditionalLens?: TraditionalLensResult;
  skinNotes?: string;
  goals?: string[];
  intent?: CharmeIntent;
  intents?: CharmeIntent[];
  personalGoal?: string;
  personalGoals?: string[];
  exploreTopics?: ExploreTopic[];
}): CharmePlan {
  const ingredients = [...input.kitchen.ingredients, ...input.kitchen.customIngredients].map((i) =>
    i.toLowerCase(),
  );

  const intentList =
    input.intents?.length
      ? input.intents
      : input.intent
        ? [input.intent]
        : (["understand"] as CharmeIntent[]);
  const intent = input.intent || intentList[0] || "understand";
  const exploreTopics = input.exploreTopics || [];
  const personalGoals =
    input.personalGoals?.length
      ? input.personalGoals
      : input.personalGoal
        ? input.personalGoal.split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean)
        : [];
  const goals =
    input.goals?.length
      ? input.goals
      : intentsToGoals(intentList, exploreTopics, personalGoals);

  const remedy = evaluateRemedy(input.familyWisdom, input.analysis);
  const priorities = buildPriorities(input.analysis, ingredients, {
    skinNotes: input.skinNotes,
    intent,
    intents: intentList,
    exploreTopics,
    personalGoals,
    goals,
  });
  const ritual = buildRitual(input.analysis, ingredients, remedy, input.season);
  const traditionalLens =
    input.traditionalLens ||
    (input.traditionalAnswers ? deriveTraditionalLens(input.traditionalAnswers) : undefined);

  const pigment = shouldHonorPigmentMap(input.skinNotes)
    ? pigmentAcknowledgment(input.analysis.concerns, input.skinNotes)
    : undefined;
  const justLearn = intentList.length === 1 && intentList[0] === "just_learn";

  const goalSummary = goals.slice(0, 3).join("; ");

  const groundedBody = justLearn
    ? `None of these need to change unless you personally want to explore them.${
        exploreTopics.length
          ? ` You chose to optionally explore: ${exploreTopics.join(", ")}.`
          : personalGoals.length
            ? ` Your selected goals: ${personalGoals.join("; ")}.`
            : " You can leave it here, or explore kitchen and rituals if curiosity leads you."
      }`
    : `CHARME shaped this guidance around your selected goals (${goalSummary}). Your skin doesn't need to look like anyone else's.`;

  return {
    priorities: priorities.filter(
      (p) =>
        shouldHonorPigmentMap(input.skinNotes) ||
        !/pigment|held with care|shared skin difference/i.test(p.priority + p.explanation),
    ),
    kitchen: {
      todayFoods: ingredients.slice(0, 8),
      explanation:
        intentList.includes("habits") || personalGoals.some((g) => /food|habit|wellness/i.test(g))
          ? "Because you asked for habits / food ideas, CHARME leans on what you already have for general wellness — not appearance correction."
          : justLearn
            ? "Optional nourishment ideas if you're curious — food supports general wellness, not appearance correction."
            : "Your kitchen is part of your ritual. CHARME leans on what you already have so guidance feels doable today.",
      note: FOOD_DISCLAIMER,
      meals: buildMeals(ingredients),
    },
    remedy: justLearn && !input.familyWisdom.freeText && !input.familyWisdom.selectedChips.length
      ? undefined
      : remedy,
    ritual,
    traditionalLens: justLearn && !input.traditionalAnswers ? undefined : traditionalLens,
    dailyRhythm: buildDailyRhythm(input.season),
    signature: buildSignature(input.analysis, ingredients, remedy, input.skinNotes),
    seasonNote: input.season ? SEASON_NOTES[input.season] : undefined,
    overallExplanation: groundOverallExplanation(groundedBody, input.analysis, {
      pigmentNote: pigment,
      intentNote: `Goals in focus: ${goalSummary}.`,
      skinNotes: input.skinNotes,
    }),
    safetyNote: ensureSafetyNote(ANALYSIS_DISCLAIMER),
    generatedAt: new Date().toISOString(),
    mode: "heuristic",
  };
}

function sanitizePlan(plan: CharmePlan): CharmePlan {
  const soft = (value: string) => softenUnsafeLanguage(value);
  return {
    ...plan,
    overallExplanation: soft(plan.overallExplanation),
    safetyNote: ensureSafetyNote(soft(plan.safetyNote)),
    seasonNote: plan.seasonNote ? soft(plan.seasonNote) : undefined,
    priorities: plan.priorities.map((p) => ({
      ...p,
      priority: soft(p.priority),
      explanation: soft(p.explanation),
      caution: p.caution ? soft(p.caution) : undefined,
      foodSuggestions: p.foodSuggestions.map(soft),
      ritualSuggestions: p.ritualSuggestions.map(soft),
    })),
    kitchen: {
      ...plan.kitchen,
      explanation: soft(plan.kitchen.explanation),
      note: soft(plan.kitchen.note || FOOD_DISCLAIMER),
      meals: plan.kitchen.meals
        ? {
            breakfast: soft(plan.kitchen.meals.breakfast),
            lunch: soft(plan.kitchen.meals.lunch),
            snack: soft(plan.kitchen.meals.snack),
            dinner: soft(plan.kitchen.meals.dinner),
          }
        : undefined,
    },
    remedy: plan.remedy
      ? {
          ...plan.remedy,
          traditionalUse: soft(plan.remedy.traditionalUse),
          whatWeKnow: soft(plan.remedy.whatWeKnow),
          potentialConsideration: soft(plan.remedy.potentialConsideration),
          skinContext: plan.remedy.skinContext ? soft(plan.remedy.skinContext) : undefined,
          charmeTake: soft(plan.remedy.charmeTake),
        }
      : undefined,
    ritual: plan.ritual.map((day) => ({
      ...day,
      focus: soft(day.focus),
      why: soft(day.why),
      food: soft(day.food),
      ritual: soft(day.ritual),
      gloss: day.gloss ? soft(day.gloss) : undefined,
      morning: day.morning.map(soft),
      evening: day.evening.map(soft),
    })),
    traditionalLens: plan.traditionalLens
      ? {
          ...plan.traditionalLens,
          summary: soft(plan.traditionalLens.summary),
          suggestion: soft(plan.traditionalLens.suggestion),
          disclaimer: soft(plan.traditionalLens.disclaimer),
        }
      : undefined,
    dailyRhythm: plan.dailyRhythm
      ? {
          morning: plan.dailyRhythm.morning.map(soft),
          evening: plan.dailyRhythm.evening.map(soft),
          note: soft(plan.dailyRhythm.note),
        }
      : undefined,
    signature: plan.signature
      ? {
          look: soft(plan.signature.look),
          nourish: soft(plan.signature.nourish),
          ritual: soft(plan.signature.ritual),
          recheck: soft(plan.signature.recheck),
          closing: soft(plan.signature.closing),
        }
      : undefined,
  };
}

export async function generateCharmePlan(input: {
  analysis: SkinAnalysis;
  familyWisdom: FamilyWisdom;
  kitchen: KitchenInventory;
  goals?: string[];
  season?: Season;
  traditionalAnswers?: TraditionalLensAnswers;
  skinNotes?: string;
  intent?: CharmeIntent;
  intents?: CharmeIntent[];
  personalGoal?: string;
  personalGoals?: string[];
  exploreTopics?: ExploreTopic[];
}): Promise<CharmePlan> {
  const traditionalLens = input.traditionalAnswers
    ? deriveTraditionalLens(input.traditionalAnswers)
    : undefined;
  const intentList =
    input.intents?.length
      ? input.intents
      : input.intent
        ? [input.intent]
        : (["understand"] as CharmeIntent[]);
  const intent = input.intent || intentList[0] || "understand";
  const exploreTopics = input.exploreTopics || [];
  const personalGoals =
    input.personalGoals?.length
      ? input.personalGoals
      : input.personalGoal
        ? input.personalGoal.split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean)
        : [];
  const goals =
    input.goals?.length
      ? input.goals
      : intentsToGoals(intentList, exploreTopics, personalGoals);
  const fallback = buildHeuristicPlan({
    ...input,
    traditionalLens,
    intent,
    intents: intentList,
    exploreTopics,
    personalGoals,
    goals,
  });
  const provider = getAIProvider();

  if (!provider.isConfigured()) {
    return fallback;
  }

  try {
    const honorPigment = shouldHonorPigmentMap(input.skinNotes);
    const digest = buildSnapshotDigest(input.analysis, input.skinNotes);
    const pigment = pigmentAcknowledgment(input.analysis.concerns, input.skinNotes);
    const analysisJson = JSON.stringify(
      {
        snapshotId: digest.analysisId,
        createdAt: input.analysis.createdAt,
        scoreTable: digest.scoreTable,
        factualLeadRequired: digest.factualLead,
        lowestMeasurements: digest.lowest.map((c) => ({
          key: c.key,
          label: c.label,
          score: c.uiScore,
        })),
        highestMeasurements: digest.highest.map((c) => ({
          key: c.key,
          label: c.label,
          score: c.uiScore,
        })),
        selectedIntents: intentList,
        primaryIntent: intent,
        personalGoals,
        derivedGoals: goals,
        exploreTopics,
        careFocuses: input.analysis.priorities
          .filter((c) => !(honorPigment && isIdentityConcern(c.key)))
          .map((c) => ({
            key: c.key,
            label: c.label,
            score: c.uiScore,
            role: "visible_characteristic_observation",
          })),
        concerns: input.analysis.concerns
          .filter((c) => honorPigment || !isIdentityConcern(c.key))
          .map((c) => ({
            key: c.key,
            label: c.label,
            score: c.uiScore,
            role:
              honorPigment && isIdentityConcern(c.key)
                ? "named_condition_honored_NOT_a_change_target"
                : "cosmetic_metric_not_a_grade",
          })),
        namedSkinCondition: honorPigment,
        pigmentNote: pigment || null,
        story: input.analysis.storySummary,
        season: input.season,
        traditionalLens: traditionalLens || null,
        CRITICAL: [
          "overallExplanation MUST open by citing the exact lowestMeasurements and highestMeasurements with their numeric scores from THIS snapshotId.",
          "Shape priorities and kitchen emphasis around selectedIntents + personalGoals + derivedGoals — every selected goal should be visibly reflected.",
          "If habits is selected, include nourishment-focused guidance. If rituals is selected, include ritual guidance. If just_learn alone, stay observational.",
          "Only mention Traditional Lens / Pitta / Vata / Kapha if traditionalLens is non-null in this JSON.",
          "Never name medical conditions unless skinNotes already contain that word.",
          "Never call scores poor/bad/problems.",
        ].join(" "),
      },
      null,
      2,
    );

    const ingredients = [...input.kitchen.ingredients, ...input.kitchen.customIngredients];
    const wisdomText = [
      input.familyWisdom.freeText,
      ...input.familyWisdom.selectedChips,
      input.familyWisdom.taughtBy ? `Taught by: ${input.familyWisdom.taughtBy}` : "",
      input.familyWisdom.meaning ? `Meaning: ${input.familyWisdom.meaning}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const raw = await provider.completeJson([
      { role: "system", content: CHARME_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildCharmeUserPrompt({
          analysisJson,
          familyWisdom: wisdomText,
          kitchen: ingredients,
          goals,
          season: input.season,
          skinNotes: input.skinNotes,
          intent,
          intents: intentList,
          personalGoal: personalGoals.join(" | ") || undefined,
          exploreTopics,
          snapshotLead: digest.factualLead,
        }),
      },
    ]);

    const parsed = CharmePlanSchema.parse(JSON.parse(raw));
    const honorPigmentFinal = shouldHonorPigmentMap(input.skinNotes);
    const groundedExplanation = groundOverallExplanation(
      parsed.overallExplanation,
      input.analysis,
      {
        pigmentNote: honorPigmentFinal ? pigment : undefined,
        intentNote:
          intentList.length === 1 && intentList[0] === "just_learn"
            ? "None of these need to change unless you personally want to explore them."
            : `Responding to your goals: ${goals.slice(0, 4).join("; ")}.`,
        skinNotes: input.skinNotes,
      },
    );

    const cleanedPriorities = parsed.priorities.filter(
      (p) =>
        honorPigmentFinal ||
        !/pigment|held with care|shared skin difference|honor(?:ed|ing)? your/i.test(
          `${p.priority} ${p.explanation}`,
        ),
    );

    return sanitizePlan({
      ...parsed,
      priorities: cleanedPriorities.length ? cleanedPriorities : fallback.priorities,
      overallExplanation: groundedExplanation,
      traditionalLens: traditionalLens
        ? parsed.traditionalLens || traditionalLens
        : undefined,
      dailyRhythm: parsed.dailyRhythm || fallback.dailyRhythm,
      signature: parsed.signature || fallback.signature,
      seasonNote: parsed.seasonNote || fallback.seasonNote,
      kitchen: {
        ...parsed.kitchen,
        meals: parsed.kitchen.meals || fallback.kitchen.meals,
      },
      generatedAt: new Date().toISOString(),
      mode: "ai",
    });
  } catch {
    return fallback;
  }
}

export { compareCheckIns } from "./compare";
