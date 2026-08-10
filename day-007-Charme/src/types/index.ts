export type ConcernSeverity = "looking_good" | "could_improve" | "needs_attention";

export type Confidence = "low" | "medium" | "high";

export type RemedyVerdict = "KEEP" | "MODIFY" | "PAUSE";

export type Season = "summer" | "monsoon" | "autumn" | "winter" | "spring";

export type TraditionalTendency = "vata_leaning" | "pitta_leaning" | "kapha_leaning" | "balanced";

export type CharmeIntent =
  | "understand"
  | "explore_change"
  | "habits"
  | "rituals"
  | "just_learn";

export type ExploreTopic =
  | "hydration"
  | "texture"
  | "redness"
  | "pigmentation"
  | "radiance"
  | "nutrition"
  | "traditional_rituals";

export type SkinConcernKey =
  | "hydration"
  | "redness"
  | "radiance"
  | "oiliness"
  | "pores"
  | "texture"
  | "acne"
  | "spots"
  | "wrinkles"
  | "dark_circles"
  | "eye_bags"
  | "firmness";

export interface SkinConcern {
  key: SkinConcernKey;
  label: string;
  rawScore: number;
  uiScore: number;
  severity: ConcernSeverity;
  maskUrl?: string;
  youcamType?: string;
}

export interface SkinAnalysis {
  id: string;
  createdAt: string;
  mode: "real" | "demo";
  overallScore?: number;
  skinAge?: number;
  concerns: SkinConcern[];
  storySummary: string;
  priorities: SkinConcern[];
  /** Kind acknowledgment when pigment variation / identity-related signals are present */
  pigmentNote?: string;
  disclaimer: string;
  sourceImageDataUrl?: string;
}

export interface FamilyWisdom {
  freeText: string;
  selectedChips: string[];
  taughtBy?: string;
  whenUsed?: string;
  meaning?: string;
}

export interface KitchenInventory {
  ingredients: string[];
  customIngredients: string[];
}

export interface TraditionalLensAnswers {
  heatSensitivity: "low" | "medium" | "high";
  digestionFeel: "light" | "variable" | "heavy";
  energyPattern: "scattered" | "intense" | "steady";
  climateComfort: "cool" | "neutral" | "warm";
  sleepQuality: "light" | "mixed" | "deep";
}

export interface TraditionalLensResult {
  tendency: TraditionalTendency;
  summary: string;
  suggestion: string;
  disclaimer: string;
}

export interface UserProfile {
  goals?: string[];
  intent?: CharmeIntent;
  intents?: CharmeIntent[];
  personalGoal?: string;
  personalGoals?: string[];
  exploreTopics?: ExploreTopic[];
  familyWisdom: FamilyWisdom;
  kitchen: KitchenInventory;
  season?: Season;
  traditionalAnswers?: TraditionalLensAnswers;
  lifestyleNotes?: string;
}

export interface CharmeRecommendation {
  priority: string;
  explanation: string;
  foodSuggestions: string[];
  ritualSuggestions: string[];
  caution?: string;
  confidence?: Confidence;
}

export interface RemedyEvaluation {
  remedy: string;
  traditionalUse: string;
  whatWeKnow: string;
  potentialConsideration: string;
  skinContext?: string;
  verdict: RemedyVerdict;
  charmeTake: string;
}

export interface MealPlan {
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
}

export interface KitchenGuidance {
  todayFoods: string[];
  explanation: string;
  note: string;
  meals?: MealPlan;
}

export interface DailyRhythm {
  morning: string[];
  evening: string[];
  note: string;
}

export interface DailyRitual {
  day: number;
  focus: string;
  why: string;
  morning: string[];
  food: string;
  ritual: string;
  evening: string[];
  /** Plain-English gloss for Indian / Ayurveda terms in this day's ritual */
  gloss?: string;
}

export interface SignatureMoment {
  look: string;
  nourish: string;
  ritual: string;
  recheck: string;
  closing: string;
}

export interface CharmePlan {
  priorities: CharmeRecommendation[];
  kitchen: KitchenGuidance;
  remedy?: RemedyEvaluation;
  ritual: DailyRitual[];
  traditionalLens?: TraditionalLensResult;
  dailyRhythm?: DailyRhythm;
  signature?: SignatureMoment;
  seasonNote?: string;
  overallExplanation: string;
  safetyNote: string;
  generatedAt: string;
  mode: "ai" | "heuristic";
}

export interface SkinCheckIn {
  id: string;
  timestamp: string;
  analysis: SkinAnalysis;
}

export interface SkinJourneyComparison {
  previous: SkinCheckIn;
  current: SkinCheckIn;
  deltas: Array<{
    key: SkinConcernKey;
    label: string;
    from: number;
    to: number;
  }>;
  observation: string;
  caution: string;
}

export interface SimulationResult {
  concern: string;
  intensity: number;
  beforeImageDataUrl?: string;
  afterImageUrl: string;
  disclaimer: string;
}

export interface PersistedCharmeState {
  version: 1;
  currentAnalysis?: SkinAnalysis;
  previousAnalysis?: SkinAnalysis;
  checkIns: SkinCheckIn[];
  profile?: UserProfile;
  plan?: CharmePlan;
  selfieDataUrl?: string;
}
