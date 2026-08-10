import type { ConcernSeverity, SkinConcernKey } from "@/types";
import { dignitySeverityLabel, isIdentityConcern } from "@/lib/charme/skin-dignity";

/** Neutral labels — never Poor / Bad / Problem */
export function severityLabel(
  severity: ConcernSeverity,
  key?: SkinConcernKey,
): string {
  if (key && isIdentityConcern(key)) {
    return dignitySeverityLabel(key, "Part of your map");
  }
  switch (severity) {
    case "needs_attention":
      return "Notable in this snapshot";
    case "could_improve":
      return "Visible characteristic";
    default:
      return "Observed";
  }
}
