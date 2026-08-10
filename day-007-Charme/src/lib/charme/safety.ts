export const SAFETY_FOOTER =
  "CHARME offers gentle cosmetic skin-wellness guidance — not medical diagnosis or treatment. If something feels painful, rapidly changing, bleeding, or worrying, a dermatologist or qualified clinician can offer clarity. Seeking care is a kindness to yourself.";

export const ANALYSIS_DISCLAIMER =
  "These are AI-generated cosmetic skin-analysis measurements, not a medical diagnosis. Scores reflect visible characteristics only — they do not define your worth or imply that difference needs 'fixing.'";

export const FOOD_DISCLAIMER =
  "These foods can contribute nutrients that support overall health and nutrition — not a guaranteed treatment for skin concerns.";

export const SIMULATION_DISCLAIMER =
  "Optional cosmetic visualization. This illustrates a simulated appearance change based on selected characteristics. It does not define healthy or beautiful skin, and it is not a prediction of actual results.";

export const JOURNEY_CAUTION =
  "Your measured results changed between these two scans. Many factors can influence skin appearance, including lighting, hydration, environment, products, and normal variation. Change is information — not a judgment.";

export const MEDICAL_REDIRECT =
  "If something on your skin is painful, rapidly changing, bleeding, or simply worrying you, a dermatologist can give you peace of mind — you're taking good care of yourself by checking in. CHARME is here for everyday cosmetic wellness and kindness toward your skin, not medical diagnosis.";

const FORBIDDEN_CLAIM_PATTERNS = [
  /\bcure[sd]?\b/i,
  /\bdiagnos(e|is|ing)\b/i,
  /\btreat(s|ment|ing)? (acne|eczema|psoriasis|cancer|rosacea)\b/i,
  /\bguaranteed results?\b/i,
];

export function containsUnsafeMedicalClaims(text: string): boolean {
  return FORBIDDEN_CLAIM_PATTERNS.some((p) => p.test(text));
}

export function softenUnsafeLanguage(text: string): string {
  return text
    .replace(/\bcures?\b/gi, "may support")
    .replace(/\bdiagnoses?\b/gi, "observes visible characteristics of")
    .replace(/\btreats?\b/gi, "may help support comfort around")
    .replace(/\bguaranteed results?\b/gi, "possible cosmetic changes");
}

export function ensureSafetyNote(note?: string): string {
  if (!note || containsUnsafeMedicalClaims(note)) {
    return MEDICAL_REDIRECT;
  }
  return note;
}
