import type { CharmeIntent, ExploreTopic, SkinConcernKey } from "@/types";

export type { CharmeIntent, ExploreTopic };

export const CHARME_INTENTS: Array<{
  id: CharmeIntent;
  emoji: string;
  title: string;
  description: string;
}> = [
  {
    id: "understand",
    emoji: "🌿",
    title: "Understand my skin",
    description: "I want to learn more about what I'm seeing.",
  },
  {
    id: "explore_change",
    emoji: "✨",
    title: "Explore something I'd like to change",
    description: "I have a specific cosmetic concern I'd like to work on.",
  },
  {
    id: "habits",
    emoji: "🥗",
    title: "Build healthier habits",
    description: "I'd like food and lifestyle ideas that support general wellness.",
  },
  {
    id: "rituals",
    emoji: "🪷",
    title: "Explore traditional rituals",
    description: "I'd like to explore Ayurveda-inspired or family wellness practices.",
  },
  {
    id: "just_learn",
    emoji: "💛",
    title: "Just learn",
    description: "I'm curious about my skin and don't want to change anything right now.",
  },
];

export const EXPLORE_TOPICS: Array<{ id: ExploreTopic; label: string }> = [
  { id: "hydration", label: "Hydration" },
  { id: "texture", label: "Texture" },
  { id: "redness", label: "Redness" },
  { id: "pigmentation", label: "Pigmentation" },
  { id: "radiance", label: "Radiance" },
  { id: "nutrition", label: "Nutrition" },
  { id: "traditional_rituals", label: "Traditional rituals" },
];

export const PERSONAL_GOAL_PRESETS: Array<{ id: string; label: string }> = [
  { id: "understand", label: "I want to understand my skin." },
  { id: "hydration", label: "I want to support hydration." },
  { id: "redness", label: "I'd like to explore visible redness." },
  { id: "traditional", label: "I'm interested in traditional wellness." },
  { id: "food", label: "I want food ideas." },
  { id: "no_change", label: "I'm not trying to change my appearance." },
];

export function intentLabel(intent: CharmeIntent): string {
  return CHARME_INTENTS.find((i) => i.id === intent)?.title || intent;
}

export function intentToGoals(intent: CharmeIntent, exploreTopics: ExploreTopic[] = []): string[] {
  const base: Record<CharmeIntent, string[]> = {
    understand: ["I want to understand my skin."],
    explore_change: ["I'd like to explore a specific cosmetic concern."],
    habits: ["I want food and lifestyle ideas for general wellness."],
    rituals: ["I'm interested in traditional wellness and rituals."],
    just_learn: ["I'm curious and not trying to change my appearance right now."],
  };
  const fromTopics = exploreTopics.map((t) => {
    if (t === "pigmentation") return "I'd like to optionally explore the appearance of pigmentation.";
    if (t === "traditional_rituals") return "I'm interested in traditional rituals.";
    if (t === "nutrition") return "I want food ideas.";
    return `I'd like to explore ${t}.`;
  });
  return [...base[intent], ...fromTopics];
}

/** Merge goals from multiple selected intents + personal goal chips. */
export function intentsToGoals(
  intents: CharmeIntent[],
  exploreTopics: ExploreTopic[] = [],
  personalGoals: string[] = [],
): string[] {
  const base: Record<CharmeIntent, string> = {
    understand: "I want to understand my skin.",
    explore_change: "I'd like to explore a specific cosmetic concern.",
    habits: "I want food and lifestyle ideas for general wellness.",
    rituals: "I'm interested in traditional wellness and rituals.",
    just_learn: "I'm curious and not trying to change my appearance right now.",
  };
  const fromIntents = intents.map((intent) => base[intent]);
  const topicGoals = exploreTopics.map((t) => {
    if (t === "pigmentation") return "I'd like to optionally explore the appearance of pigmentation.";
    if (t === "traditional_rituals") return "I'm interested in traditional rituals.";
    if (t === "nutrition") return "I want food ideas.";
    return `I'd like to explore ${t}.`;
  });
  return Array.from(new Set([...fromIntents, ...topicGoals, ...personalGoals.filter(Boolean)]));
}

/** Prefer action-oriented intents when several are selected. */
export function primaryIntent(intents: CharmeIntent[]): CharmeIntent {
  const order: CharmeIntent[] = [
    "explore_change",
    "rituals",
    "habits",
    "understand",
    "just_learn",
  ];
  return order.find((id) => intents.includes(id)) || intents[0] || "understand";
}

export type IntentRoute = "just_learn" | "wisdom" | "lenses";

export function routeAfterIntents(intents: CharmeIntent[]): IntentRoute {
  if (intents.length === 0) return "lenses";
  if (intents.length === 1 && intents[0] === "just_learn") return "just_learn";
  if (intents.length === 1 && intents[0] === "habits") return "wisdom";
  if (intents.every((i) => i === "habits" || i === "just_learn")) {
    return intents.includes("habits") ? "wisdom" : "just_learn";
  }
  return "lenses";
}

export function exploreTopicToConcernKey(topic: ExploreTopic): SkinConcernKey | null {
  switch (topic) {
    case "hydration":
      return "hydration";
    case "texture":
      return "texture";
    case "redness":
      return "redness";
    case "pigmentation":
      return "spots";
    case "radiance":
      return "radiance";
    default:
      return null;
  }
}

export function areasHeading(intent?: CharmeIntent | null, intents?: CharmeIntent[]): string {
  const list = intents?.length ? intents : intent ? [intent] : [];
  if (list.includes("explore_change")) return "Areas related to your goals";
  if (list.every((i) => i === "just_learn" || i === "understand") && list.length > 0) {
    return "What CHARME noticed";
  }
  if (intent === "just_learn" || intent === "understand") return "What CHARME noticed";
  if (intent === "explore_change") return "Areas related to your goal";
  return "Areas you may want to explore";
}
