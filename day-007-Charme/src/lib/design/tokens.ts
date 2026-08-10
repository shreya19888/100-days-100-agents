/**
 * CHARME design tokens — peacock identity
 * Deep indigo / neem / marigold / terracotta
 */
export const charmeTokens = {
  background: "#f7f1e8",
  backgroundDeep: "#ebe1d2",
  surface: "rgba(255, 251, 245, 0.92)",
  text: "#2a211a",
  textMuted: "#6f6154",
  primary: "#24344D", // deep indigo — modern / insight
  secondary: "#66735A", // neem — nourish
  accent: "#A85C45", // terracotta — traditional
  highlight: "#C49A3A", // marigold — ritual
  sandalwood: "#d8c3a5",
  ivory: "#faf6ef",
  border: "rgba(42, 33, 26, 0.14)",
  success: "#3f6b4f",
  warning: "#b8892f",
  caution: "#9a4f3a",
  shadow: "0 18px 48px rgba(42, 33, 26, 0.1)",
} as const;

export type CharmeToken = keyof typeof charmeTokens;
