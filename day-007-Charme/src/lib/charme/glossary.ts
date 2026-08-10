/**
 * Plain-language glosses for Indian kitchen & Ayurveda-inspired terms
 * used in CHARME rituals and copy.
 */
export type GlossaryEntry = {
  term: string;
  /** Patterns to detect in copy (lowercase) */
  aliases?: string[];
  meaning: string;
};

export const CHARME_GLOSSARY: GlossaryEntry[] = [
  {
    term: "ubtan",
    meaning: "a soft homemade paste (often chickpea flour + yogurt or water) used as a gentle face or body mask — not a scrub",
  },
  {
    term: "besan",
    meaning: "chickpea / gram flour — a common kitchen staple used in cooking and soft homemade pastes",
  },
  {
    term: "dahi",
    aliases: ["curd"],
    meaning: "plain yogurt / curd",
  },
  {
    term: "haldi",
    meaning: "turmeric — the familiar yellow cooking spice; use only a tiny pinch on skin",
  },
  {
    term: "abhyanga",
    meaning: "a traditional self-massage with a little warm oil (face, limbs, or body)",
  },
  {
    term: "dinacharya",
    meaning: "Ayurveda's idea of a kind daily rhythm — morning and evening habits that support how you feel",
  },
  {
    term: "ahara",
    meaning: "nourishment / food as part of wellness — what you eat from your kitchen",
  },
  {
    term: "multani mitti",
    aliases: ["multani"],
    meaning: "Fuller's earth — a soft clay powder used in short, thin face masks",
  },
  {
    term: "malai",
    meaning: "fresh cream skimmed from boiled milk — sometimes used thinly on dry patches",
  },
  {
    term: "jeera",
    meaning: "cumin seeds — often steeped in warm water as an evening sip",
  },
  {
    term: "neem",
    meaning: "a bitter medicinal tree used in many Indian households; prefer gentle uses over harsh face scrubs",
  },
  {
    term: "doodh",
    meaning: "milk",
  },
  {
    term: "netra",
    meaning: "eyes — “netra comfort” means resting the eyes (e.g. warm palm cupping)",
  },
  {
    term: "ghar ka nuskha",
    aliases: ["ghar ka", "nuskha"],
    meaning: "a home remedy or family recipe passed down through generations",
  },
  {
    term: "ragi",
    meaning: "finger millet — a nutritious grain used in porridges and flatbreads",
  },
  {
    term: "moong dal",
    aliases: ["moong"],
    meaning: "split mung beans — a light everyday lentil",
  },
  {
    term: "methi",
    meaning: "fenugreek leaves (or seeds) — common in Indian cooking",
  },
  {
    term: "bajra",
    meaning: "pearl millet — a hearty grain",
  },
  {
    term: "jowar",
    meaning: "sorghum — a gluten-free millet-like grain",
  },
  {
    term: "oil pulling",
    meaning: "swishing a little oil in the mouth for a short time before brushing — optional traditional oral care",
  },
];

/** Kitchen chip labels: show familiar English beside Indian names */
export const KITCHEN_PLAIN_LABELS: Record<string, string> = {
  dahi: "yogurt / curd",
  methi: "fenugreek",
  ragi: "finger millet",
  bajra: "pearl millet",
  jowar: "sorghum",
  "moong dal": "mung lentils",
  "masoor dal": "red lentils",
  "toor dal": "pigeon peas",
  chana: "chickpeas / gram",
  besan: "chickpea flour",
  rajma: "kidney beans",
  "bottle gourd": "lauki",
};

export function kitchenDisplayLabel(item: string): string {
  const plain = KITCHEN_PLAIN_LABELS[item.toLowerCase()];
  if (!plain) return item;
  // Avoid "yogurt (yogurt / curd)" duplication
  if (item.toLowerCase() === "yogurt" || item.toLowerCase() === "dahi") {
    return item.toLowerCase() === "dahi" ? `dahi (${plain})` : item;
  }
  return `${item} (${plain})`;
}

export function findGlossaryHits(text: string, limit = 6): GlossaryEntry[] {
  const lower = text.toLowerCase();
  const hits: GlossaryEntry[] = [];
  for (const entry of CHARME_GLOSSARY) {
    const needles = [entry.term, ...(entry.aliases || [])].map((n) => n.toLowerCase());
    if (needles.some((n) => lower.includes(n))) {
      hits.push(entry);
      if (hits.length >= limit) break;
    }
  }
  return hits;
}
