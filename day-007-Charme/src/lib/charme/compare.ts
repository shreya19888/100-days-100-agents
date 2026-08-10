import type { SkinAnalysis, SkinConcernKey } from "@/types";

export function compareCheckIns(
  previous: SkinAnalysis,
  current: SkinAnalysis,
): {
  deltas: Array<{ key: SkinConcernKey; label: string; from: number; to: number }>;
  observation: string;
} {
  const keys: SkinConcernKey[] = ["hydration", "redness", "radiance"];
  const deltas = keys
    .map((key) => {
      const from = previous.concerns.find((c) => c.key === key);
      const to = current.concerns.find((c) => c.key === key);
      if (!from || !to) return null;
      return { key, label: from.label, from: from.uiScore, to: to.uiScore };
    })
    .filter(Boolean) as Array<{
    key: SkinConcernKey;
    label: string;
    from: number;
    to: number;
  }>;

  const hydration = deltas.find((d) => d.key === "hydration");
  let observation =
    "CHARME noticed movement in your measurements. Let's avoid changing too many things at once.";
  if (hydration && hydration.to > hydration.from) {
    observation =
      "Your hydration score improved, but let's avoid changing too many things at once.";
  } else if (hydration && hydration.to < hydration.from) {
    observation =
      "Hydration looks a bit lower this time. That can happen with weather, sleep, or lighting — stay gentle.";
  }

  return { deltas, observation };
}
