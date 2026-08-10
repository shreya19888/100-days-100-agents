import type { RemedyVerdict, Season, TraditionalLensAnswers, TraditionalLensResult } from "@/types";

export const WISDOM_CHIPS = [
  "Besan + yogurt + turmeric",
  "Rose water mist",
  "Aloe vera gel",
  "Coconut oil",
  "Neem leaves",
  "Multani mitti",
  "Sandalwood paste",
  "Drink more water",
  "Eat seasonal fruit",
  "Amla",
] as const;

export const FAMILY_TEACHERS = [
  "Grandmother",
  "Mother",
  "Father",
  "Aunt",
  "Other",
] as const;

export const FOOD_NOTES: Record<string, string> = {
  rice: "A familiar everyday grain — keep portions comfortable.",
  "brown rice": "A whole-grain option when you want more fiber.",
  millets: "Traditional grains that fit easily into khichdi or porridge.",
  oats: "Gentle morning bowl that pairs well with fruit.",
  bajra: "Hearty millet often used in winter rotis in some regions.",
  jowar: "A versatile millet for flatbreads and bowls.",
  ragi: "Ragi porridge is a practical, grounding breakfast.",
  "moong dal": "Light, everyday dal — easy on many stomachs.",
  "masoor dal": "Quick-cooking dal for simple lunch plates.",
  "toor dal": "Classic dal for everyday Indian meals.",
  chana: "Protein-rich and filling in salads or curries.",
  rajma: "Comforting when rice is also on the table.",
  chickpeas: "Flexible in chana chaat, curries, or bowls.",
  spinach: "Easy greens for dal, sabzi, or omelettes.",
  methi: "Bitter greens traditionally used in home cooking.",
  "bottle gourd": "Mild vegetable often used in light Indian meals.",
  cucumber: "Cooling and hydrating in salads or raita.",
  carrots: "Adds color and crunch to everyday plates.",
  beetroot: "Earthy vegetable for salads or simple sabzi.",
  tomatoes: "Kitchen staple for rasam, sabzi, and salads.",
  pumpkin: "Soft, comforting vegetable for seasonal cooking.",
  okra: "Familiar sabzi when cooked simply.",
  mango: "Seasonal fruit — enjoy ripe, in moderation.",
  papaya: "Gentle fruit many families keep for digestion comfort.",
  guava: "Fiber-rich fruit when in season.",
  pomegranate: "Bright seeds for bowls and snacks.",
  oranges: "Citrus for freshness and hydration support.",
  berries: "Colorful fruit when available.",
  banana: "Simple, portable energy.",
  watermelon: "Especially welcome in hot weather.",
  almonds: "A small handful as a practical snack.",
  walnuts: "One food source of omega-3 fats if fish isn't part of your diet.",
  chia: "Can be stirred into dahi or soaked overnight.",
  flax: "Another plant source of omega-3 fatty acids.",
  sesame: "Used in chutneys, til ladoos, or light tempering.",
  dahi: "Cooling accompaniment — traditionally part of many Indian meals.",
  yogurt: "Similar to dahi — gentle protein for snacks and bowls.",
  buttermilk: "Light drink many households enjoy with meals.",
  paneer: "Simple protein when you want something more filling.",
  turmeric: "Common kitchen spice — better in food than strong DIY face pastes for reactive skin.",
  cumin: "Everyday spice for tempering and digestion comfort traditions.",
  coriander: "Fresh herb for finishing dishes.",
  fennel: "Sometimes sipped as warm fennel water after meals.",
  ginger: "Warming kitchen staple for chai or cooking.",
  cardamom: "Fragrant spice for chai and sweets.",
  cinnamon: "Warm spice used sparingly in drinks and cooking.",
  lemon: "Bright finish for water, dal, or salads.",
};

export interface RemedyKnowledge {
  keywords: string[];
  traditionalUse: string;
  whatWeKnow: string;
  potentialConsideration: string;
  defaultVerdict: RemedyVerdict;
  keepTake: string;
  modifyTake: string;
  pauseTake: string;
}

export const REMEDY_KNOWLEDGE: RemedyKnowledge[] = [
  {
    keywords: ["turmeric", "haldi"],
    traditionalUse:
      "Turmeric appears in some South Asian home beauty traditions, often mixed with yogurt, milk, or besan.",
    whatWeKnow:
      "Evidence for homemade topical turmeric preparations is limited, and recipes vary widely from kitchen to kitchen.",
    potentialConsideration:
      "Turmeric can stain and may irritate reactive skin. Photosensitivity and allergy are possible for some people.",
    defaultVerdict: "MODIFY",
    keepTake: "If your skin usually tolerates it, keep it occasional, diluted, and patch-tested.",
    modifyTake:
      "Preserve the tradition as food or a very gentle, infrequent ritual — especially when visible redness is elevated.",
    pauseTake: "Pause DIY turmeric face applications if stinging, staining, or lasting redness appears.",
  },
  {
    keywords: ["besan", "gram flour", "yogurt", "curd", "dahi"],
    traditionalUse:
      "Besan with yogurt (and sometimes turmeric) is a familiar ghar ka nuskha before festivals or special occasions in many households.",
    whatWeKnow:
      "Homemade masks are variable; controlled evidence for consistent cosmetic benefit is limited.",
    potentialConsideration:
      "Flour pastes can feel drying or clogging; dairy may not suit every face. Always patch test.",
    defaultVerdict: "MODIFY",
    keepTake: "If well tolerated historically, keep contact brief and rinse gently.",
    modifyTake:
      "Keep the cultural ritual, but soften intensity — shorter contact, no scrubbing, and skip if redness is elevated.",
    pauseTake: "Pause if you notice congestion, stinging, or irritation afterward.",
  },
  {
    keywords: ["aloe"],
    traditionalUse: "Aloe vera gel is traditionally used in some homes to cool and comfort skin.",
    whatWeKnow: "Some people find plain aloe soothing; commercial gels vary in purity and additives.",
    potentialConsideration: "Allergy to aloe or fragrance/alcohol in gels is possible.",
    defaultVerdict: "KEEP",
    keepTake: "A simple, fragrance-light gel can remain a gentle option if your skin likes it.",
    modifyTake: "Patch test first and avoid stacking with many other actives.",
    pauseTake: "Pause if it stings or the gel is heavily fragranced.",
  },
  {
    keywords: ["coconut oil", "coconut"],
    traditionalUse: "Coconut oil is widely used in Indian hair and body rituals.",
    whatWeKnow: "It can feel moisturizing, but it is comedogenic for many faces.",
    potentialConsideration: "May contribute to congestion on facial skin for some people.",
    defaultVerdict: "MODIFY",
    keepTake: "Often better suited to hair or body than face.",
    modifyTake: "Consider keeping coconut oil for hair/body and using a lighter face moisturizer.",
    pauseTake: "Pause on the face if clogged pores or breakouts follow use.",
  },
  {
    keywords: ["rose water", "rosewater"],
    traditionalUse: "Rose water is traditionally used as a refreshing mist or toner in many homes.",
    whatWeKnow: "It can feel refreshing; quality and fragrance intensity vary.",
    potentialConsideration: "Fragrance may bother reactive skin.",
    defaultVerdict: "KEEP",
    keepTake: "A light mist can be a pleasant ritual if tolerated.",
    modifyTake: "Use sparingly and stop if you notice stinging.",
    pauseTake: "Pause if fragrance bothers your skin.",
  },
  {
    keywords: ["neem"],
    traditionalUse: "Neem appears in some traditional home and folk beauty practices.",
    whatWeKnow: "Homemade neem preparations vary a lot; evidence and potency are inconsistent.",
    potentialConsideration: "Can be harsh or sensitizing for some people when used topically as DIY.",
    defaultVerdict: "PAUSE",
    keepTake: "Only if a very mild, previously tolerated form is already part of your history.",
    modifyTake: "Prefer food or professionally formulated products over strong DIY neem pastes.",
    pauseTake: "Pause DIY neem on skin without professional guidance — potential for irritation is real.",
  },
  {
    keywords: ["multani", "mitti", "fuller's earth"],
    traditionalUse: "Multani mitti masks are a common ghar ka nuskha for a 'fresh' feel.",
    whatWeKnow: "Clay masks can feel clarifying but also drying depending on skin and climate.",
    potentialConsideration: "May over-dry or irritate, especially with elevated redness or low hydration readings.",
    defaultVerdict: "MODIFY",
    keepTake: "Occasional, short contact may be fine if your skin has always tolerated it.",
    modifyTake: "Shorten contact time and moisturize after — especially in dry weather or with visible redness.",
    pauseTake: "Pause if tightness, flaking, or irritation follows.",
  },
  {
    keywords: ["sandalwood", "chandan"],
    traditionalUse: "Sandalwood paste appears in some traditional beauty and ceremonial practices.",
    whatWeKnow: "Authentic sandalwood quality varies; commercial pastes may include additives.",
    potentialConsideration: "Potential for irritation or allergy; sustainability and authenticity concerns exist.",
    defaultVerdict: "MODIFY",
    keepTake: "If a trusted, mild preparation is already tolerated, keep it rare.",
    modifyTake: "Preserve the cultural meaning; use cautiously and patch test.",
    pauseTake: "Pause if you lack a known-tolerated preparation or notice irritation.",
  },
  {
    keywords: ["amla", "hibiscus", "fenugreek", "methi"],
    traditionalUse: "These ingredients appear in some traditional hair and home-care rituals.",
    whatWeKnow: "Culinary use is generally familiar; topical DIY evidence is limited and variable.",
    potentialConsideration: "Powders and pastes can irritate eyes or skin for some people.",
    defaultVerdict: "MODIFY",
    keepTake: "Culinary use is usually the gentler way to keep the wisdom.",
    modifyTake: "Prefer food use; keep any topical experiments mild and patch-tested.",
    pauseTake: "Pause strong DIY pastes near eyes or on reactive skin.",
  },
  {
    keywords: ["water", "hydrat", "fruit"],
    traditionalUse: "Families often pass down simple habits: drink water, eat fruit, rest well.",
    whatWeKnow: "Hydration and varied foods support overall wellness; facial appearance also depends on sleep, climate, and products.",
    potentialConsideration: "Helpful habits are not targeted treatments for specific visible concerns.",
    defaultVerdict: "KEEP",
    keepTake: "Keep these habits — practical, low risk, and culturally familiar.",
    modifyTake: "Pair them with a gentle topical ritual rather than expecting food alone to change every score.",
    pauseTake: "No need to pause everyday hydration and fruit — just keep expectations grounded.",
  },
];

export function findRemedyKnowledge(text: string): RemedyKnowledge | undefined {
  const lower = text.toLowerCase();
  return REMEDY_KNOWLEDGE.find((r) => r.keywords.some((k) => lower.includes(k)));
}

export const SEASON_NOTES: Record<Season, string> = {
  summer: "Keep hydration central and favor lighter meals and lighter rituals.",
  monsoon: "Keep rituals simple and pay attention to humidity and skin comfort.",
  autumn: "Ease into slightly richer nourishment as weather shifts.",
  winter: "Consider a more moisturizing ritual and avoid unnecessarily harsh cleansing.",
  spring: "Favor freshness — light greens, fruit in season, and uncluttered habits.",
};

export const AYURVEDA_DISCLAIMER =
  "Ayurvedic concepts shown here are traditional wellness frameworks and are not medical diagnoses.";

export function deriveTraditionalLens(answers: TraditionalLensAnswers): TraditionalLensResult {
  const scores = { vata: 0, pitta: 0, kapha: 0 };

  if (answers.heatSensitivity === "high") scores.pitta += 2;
  if (answers.heatSensitivity === "medium") scores.pitta += 1;
  if (answers.heatSensitivity === "low") scores.kapha += 1;

  if (answers.digestionFeel === "variable") scores.vata += 2;
  if (answers.digestionFeel === "light") scores.pitta += 1;
  if (answers.digestionFeel === "heavy") scores.kapha += 2;

  if (answers.energyPattern === "scattered") scores.vata += 2;
  if (answers.energyPattern === "intense") scores.pitta += 2;
  if (answers.energyPattern === "steady") scores.kapha += 1;

  if (answers.climateComfort === "warm") scores.vata += 1;
  if (answers.climateComfort === "cool") scores.pitta += 1;
  if (answers.climateComfort === "neutral") scores.kapha += 1;

  if (answers.sleepQuality === "light") scores.vata += 2;
  if (answers.sleepQuality === "mixed") scores.pitta += 1;
  if (answers.sleepQuality === "deep") scores.kapha += 1;

  const ranked = (Object.entries(scores) as Array<["vata" | "pitta" | "kapha", number]>).sort(
    (a, b) => b[1] - a[1],
  );
  const top = ranked[0];
  const second = ranked[1];
  const balanced = !top || top[1] - (second?.[1] ?? 0) <= 1;

  if (balanced) {
    return {
      tendency: "balanced",
      summary:
        "Your responses suggest a mixed pattern. In some Ayurvedic traditions, that simply means favoring balance over extremes.",
      suggestion:
        "CHARME suggests a calming, steady daily rhythm — regular meals, gentle cleansing, and one small ritual you can actually keep.",
      disclaimer: AYURVEDA_DISCLAIMER,
    };
  }

  if (top[0] === "pitta") {
    return {
      tendency: "pitta_leaning",
      summary:
        "Traditional Ayurveda Lens: your responses align with some Pitta-oriented qualities in classical frameworks — often described as heat, intensity, or sensitivity to irritation.",
      suggestion:
        "Some traditional practices favor cooling foods, calmer evenings, and avoiding overly harsh DIY topicals. This is a traditional framework, not a medical diagnosis.",
      disclaimer: AYURVEDA_DISCLAIMER,
    };
  }

  if (top[0] === "vata") {
    return {
      tendency: "vata_leaning",
      summary:
        "Traditional Ayurveda Lens: your responses align with some Vata-oriented qualities — often associated with dryness, variability, or a need for grounding.",
      suggestion:
        "Some traditional practices emphasize warm, regular meals, oiling rituals when tolerated, and a predictable wind-down. This is not a medical diagnosis.",
      disclaimer: AYURVEDA_DISCLAIMER,
    };
  }

  return {
    tendency: "kapha_leaning",
    summary:
      "Traditional Ayurveda Lens: your responses align with some Kapha-oriented qualities — often associated with steadiness, heaviness, or a preference for stimulating freshness.",
    suggestion:
      "Some traditional practices favor lighter meals, movement, and uncluttered rituals. This is a traditional framework, not a medical diagnosis.",
    disclaimer: AYURVEDA_DISCLAIMER,
  };
}
