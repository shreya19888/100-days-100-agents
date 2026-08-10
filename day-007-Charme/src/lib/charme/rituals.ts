import type { Season } from "@/types";

export type AyurvedaRitualIdea = {
  id: string;
  title: string;
  /** One-line plain English for people new to the term */
  whatItMeans: string;
  /** Short practice text for the day's ritual field */
  practice: string;
  focusHint?: string;
  /** Prefer these kitchen items when available */
  ingredients?: string[];
  seasons?: Season[];
  /** Skip if snapshot suggests caution for reactive skin */
  avoidIfRednessElevated?: boolean;
};

const SAFETY =
  "Optional traditional wellness practice — patch test first, keep contact short, and stop if skin stings. Not a medical treatment.";

/**
 * Kitchen-friendly Ayurveda / Indian home beauty rituals.
 * Titles and practices gloss Indian terms in plain English.
 */
export const AYURVEDA_RITUALS: AyurvedaRitualIdea[] = [
  {
    id: "besan-dahi-ubtan",
    title: "Gentle besan–dahi ubtan",
    whatItMeans:
      "Ubtan is a soft homemade paste. Besan is chickpea flour; dahi is plain yogurt. Together they make a classic gentle face mask — leave on briefly, don't scrub.",
    ingredients: ["dahi", "yogurt", "besan", "turmeric"],
    practice: `Mix a spoon of besan (chickpea flour) with a little dahi (plain yogurt) — and a pinch of turmeric (haldi) only if you tolerate it — into a soft paste. Apply lightly for 5–8 minutes, rinse with lukewarm water — no scrubbing. ${SAFETY}`,
    focusHint: "texture",
  },
  {
    id: "cucumber-soothe",
    title: "Cooling cucumber comfort",
    whatItMeans: "A simple cool compress with cucumber — familiar kitchen produce, no special ingredients required.",
    ingredients: ["cucumber"],
    practice: `Place thin cucumber slices or a light cucumber–water compress over closed eyes / cheeks for a few minutes. ${SAFETY}`,
    focusHint: "redness",
    avoidIfRednessElevated: false,
  },
  {
    id: "rose-mist",
    title: "Rose water mist ritual",
    whatItMeans: "A light spritz of rose water (or plain cool water) after cleansing — a common finishing step in many homes.",
    practice: `If you tolerate fragrance, mist pure rose water (or plain cool water) after cleansing and press gently. Sit for three calm breaths. ${SAFETY}`,
    focusHint: "radiance",
  },
  {
    id: "aloe-gel",
    title: "Aloe vera gel seal",
    whatItMeans: "A thin layer of plain aloe gel as a light moisture seal after cleansing.",
    ingredients: ["aloe"],
    practice: `Apply a thin layer of plain aloe gel (inner leaf if fresh, or a simple store gel without alcohol) after cleansing. Leave on as a light seal. ${SAFETY}`,
    focusHint: "hydration",
  },
  {
    id: "honey-mask",
    title: "Thin honey mask",
    whatItMeans: "A very thin layer of honey left on briefly, then rinsed — keep it optional and short.",
    ingredients: ["honey"],
    practice: `Spread a very thin layer of honey for 5–10 minutes, then rinse gently. Skip if you have open breaks in the skin. ${SAFETY}`,
    focusHint: "hydration",
  },
  {
    id: "sandal-comfort",
    title: "Sandalwood paste (diluted)",
    whatItMeans: "A pinch of sandalwood powder mixed with water into a thin paste — traditional, fragrance-forward; skip if sensitive.",
    ingredients: ["sandalwood"],
    practice: `If you have sandalwood powder, mix a pinch with rose water or plain water into a thin paste. Keep on briefly (under 10 minutes). Fragrance-sensitive? Skip. ${SAFETY}`,
    focusHint: "radiance",
    avoidIfRednessElevated: true,
  },
  {
    id: "multani-mitti-light",
    title: "Light multani mitti mask",
    whatItMeans:
      "Multani mitti is Fuller's earth — a soft clay powder. Use a thin slip for a few minutes only; rinse before it hardens.",
    ingredients: ["multani mitti", "clay"],
    practice: `Mix multani mitti (Fuller's earth / soft clay) with rose water or plain water into a thin slip — not a thick cake. 5–7 minutes max, then rinse before it fully hardens. Best on non-irritated skin. ${SAFETY}`,
    focusHint: "oiliness",
    seasons: ["summer", "monsoon"],
    avoidIfRednessElevated: true,
  },
  {
    id: "haldi-dahi-soft",
    title: "Soft haldi–dahi ritual",
    whatItMeans:
      "Haldi is turmeric; dahi is yogurt. A tiny pinch mixed into yogurt, dabbed thinly for a few minutes — turmeric can stain, so keep it brief.",
    ingredients: ["turmeric", "dahi", "yogurt"],
    practice: `Stir a tiny pinch of turmeric (haldi) into dahi (yogurt). Dab thinly for a few minutes only, then rinse well (turmeric can stain). Prefer food-use turmeric if facial paste usually irritates you. ${SAFETY}`,
    focusHint: "radiance",
    avoidIfRednessElevated: true,
  },
  {
    id: "abhyanga-light",
    title: "Light abhyanga (self-oil)",
    whatItMeans:
      "Abhyanga is a traditional self-massage with a few drops of warm oil on face or body — calming, not a scrub.",
    ingredients: ["coconut oil", "sesame", "almonds"],
    practice: `Warm a few drops of sesame or coconut oil between palms. Massage face and neck gently for 2–3 minutes (this is light abhyanga — self-oil massage), then cleanse lightly or tissue off excess. Many prefer this in cooler weather. ${SAFETY}`,
    focusHint: "hydration",
    seasons: ["autumn", "winter", "spring"],
  },
  {
    id: "body-oil-limbs",
    title: "Limb oiling before bath",
    whatItMeans:
      "Massaging a little oil onto arms and legs before bathing — an abhyanga-inspired comfort step from classic daily rhythm (dinacharya).",
    ingredients: ["coconut oil", "sesame"],
    practice: `Before bathing, massage a little oil onto arms and legs (abhyanga-inspired self-oil massage). Bathe with lukewarm water. This is a classic dinacharya comfort ritual — dinacharya means a kind daily rhythm. ${SAFETY}`,
  },
  {
    id: "malai-soft",
    title: "Malai / cream comfort",
    whatItMeans: "Malai is fresh cream from boiled milk. A thin smear on dry patches for a few minutes if dairy suits you.",
    ingredients: ["malai", "cream", "dahi"],
    practice: `If dairy suits you, a thin smear of fresh malai (milk cream) on dry patches for a few minutes can feel nourishing — rinse and moisturize after. Skip if dairy tops irritate you. ${SAFETY}`,
    focusHint: "hydration",
    seasons: ["winter"],
  },
  {
    id: "neem-steam-skip-or-tea",
    title: "Neem as tea, not a harsh scrub",
    whatItMeans:
      "Neem is a bitter tree used in many Indian homes. Prefer gentle household uses — avoid harsh neem face scrubs.",
    ingredients: ["neem"],
    practice: `If you have neem, prefer a mild cooled neem rinse for the body or enjoy neem traditions through other household uses — avoid harsh neem scrubs on the face this week. ${SAFETY}`,
    avoidIfRednessElevated: true,
  },
  {
    id: "milk-cleanse",
    title: "Doodh / milk cleanse (gentle)",
    whatItMeans: "Doodh means milk. A soft cotton pad with cool milk or thin yogurt-water — a gentle wipe, not a scrub.",
    ingredients: ["milk", "dahi"],
    practice: `Soak a soft cotton pad in cool doodh (milk) or thin dahi-water (yogurt thinned with water) and sweep once over the face, then rinse. A soft traditional cleanse — not a scrub. ${SAFETY}`,
    focusHint: "texture",
  },
  {
    id: "rice-water",
    title: "Rice-water rinse",
    whatItMeans: "The cloudy water left after rinsing rice — cooled and used as a final gentle face rinse.",
    ingredients: ["rice"],
    practice: `Save the cloudy water from rinsed rice, cool it, and use as a final gentle face rinse after cleansing. Traditional household practice in many homes. ${SAFETY}`,
    focusHint: "radiance",
  },
  {
    id: "papaya-enzyme",
    title: "Ripe papaya dab (short)",
    whatItMeans: "A thin mash of ripe papaya left on briefly — fruit enzymes can feel active, so keep contact short.",
    ingredients: ["papaya"],
    practice: `Mash a little ripe papaya and leave a thin layer for a few minutes only, then rinse. Fruit enzymes can feel active — keep it brief. ${SAFETY}`,
    focusHint: "texture",
    avoidIfRednessElevated: true,
  },
  {
    id: "netra-rest",
    title: "Netra comfort + rest",
    whatItMeans: "Netra means eyes. Warm palm cupping (palming) to rest tired eyes — optional cucumber or rose-water pads.",
    practice: `Palming for netra (eye) comfort: rub palms warm, cup over closed eyes for a minute. Optional cool cucumber or cotton pads with rose water. Pair with an earlier wind-down. ${SAFETY}`,
    focusHint: "dark_circles",
  },
  {
    id: "jeera-fennel-sip",
    title: "Jeera or fennel evening sip",
    whatItMeans: "Jeera is cumin. Warm cumin or fennel water in the evening — a common household digestive comfort sip.",
    ingredients: ["cumin", "fennel"],
    practice: `Sip warm jeera (cumin) or fennel water in the evening — a common household digestive comfort that pairs with dinacharya rest (a calm daily rhythm). ${SAFETY}`,
  },
  {
    id: "tongue-clean-oil-pull-optional",
    title: "Morning oral ritual (optional)",
    whatItMeans:
      "Tongue cleaning and/or short oil pulling (swishing a little oil, then brushing) — only if already part of your habit.",
    practice: `If already part of your home practice: tongue cleaning and/or short oil pulling (swishing sesame or coconut oil briefly, then brush as usual). Skip anything new that doesn't feel kind. ${SAFETY}`,
  },
];

function hasIngredient(kitchen: string[], wanted?: string[]) {
  if (!wanted?.length) return true;
  const set = new Set(kitchen.map((k) => k.toLowerCase()));
  return wanted.some((w) => set.has(w.toLowerCase()) || [...set].some((k) => k.includes(w.toLowerCase())));
}

export function pickAyurvedaRituals(params: {
  kitchen: string[];
  season?: Season;
  rednessElevated?: boolean;
  count?: number;
}): AyurvedaRitualIdea[] {
  const count = params.count ?? 7;
  const pool = AYURVEDA_RITUALS.filter((r) => {
    if (params.rednessElevated && r.avoidIfRednessElevated) return false;
    if (r.seasons && params.season && !r.seasons.includes(params.season)) return false;
    return true;
  });

  const withKitchen = pool.filter((r) => hasIngredient(params.kitchen, r.ingredients));
  const withoutNeed = pool.filter((r) => !r.ingredients?.length);
  const rest = pool.filter((r) => !withKitchen.includes(r) && !withoutNeed.includes(r));

  const ordered = [...withKitchen, ...withoutNeed, ...rest];
  const picked: AyurvedaRitualIdea[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(ordered[i % ordered.length]);
  }
  if (ordered.length >= count) return ordered.slice(0, count);
  return picked;
}

export function ritualFocusTitle(idea: AyurvedaRitualIdea, day: number): string {
  return day === 1 ? `Today's ritual: ${idea.title}` : idea.title;
}
