import json
import os
from typing import Any

from openai import OpenAI


class CommunityIntelligenceAgent:
    """
    Synthesizes Community Pilot operational and public-context
    signals into a concise coordinator recommendation.

    Raw facts remain deterministic. OpenAI is only responsible
    for interpreting the combined signals.
    """

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not configured."
            )

        self.client = OpenAI(api_key=api_key)

    def analyze(
        self,
        *,
        supply: dict[str, Any],
        demand: dict[str, Any],
        food_balance: dict[str, Any],
        community_need: dict[str, Any],
        shelter_system: dict[str, Any],
        weather: dict[str, Any],
    ) -> dict[str, Any]:

        context = {
            "supply": supply,
            "demand": demand,
            "food_balance": food_balance,
            "community_need": community_need,
            "shelter_system": shelter_system,
            "weather": weather,
        }

        response = self.client.chat.completions.create(
            model=os.getenv(
                "OPENAI_INTELLIGENCE_MODEL",
                "gpt-4.1-mini",
            ),
            temperature=0.2,
            response_format={
                "type": "json_object"
            },
            messages=[
                {
                    "role": "system",
                    "content": """
You are Community Pilot's coordination intelligence
assistant.

Your user is a community food-rescue coordinator.

Analyze the supplied operational and public-context
signals and provide a concise recommendation about
how the coordinator should prioritize food rescue
activity.

Important rules:

- Do not invent facts.
- Do not change or reinterpret numerical values.
- Treat public homelessness and shelter data as
  historical snapshots, not live individual data.
- Treat shelter occupancy as system-level context,
  not real-time bed availability.
- Treat weather as current environmental context.
- Do not provide medical, legal, or crisis advice.
- Focus on food-rescue coordination.
- A surplus does not automatically mean LOW need.
  Consider community need, demand, weather, and shelter
  pressure together.
- If weather is unavailable, explicitly say so.
- Keep the recommendation practical and concise.

Return valid JSON with exactly these fields:

{
  "priority": "LOW | MODERATE | HIGH",
  "headline": "short coordinator-facing headline",
  "recommendation": "2-3 sentence actionable recommendation",
  "rationale": "1-2 sentence explanation",
  "signals_considered": [
    "short signal",
    "short signal"
  ]
}
""",
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        context,
                        default=str,
                    ),
                },
            ],
        )

        content = response.choices[0].message.content

        if not content:
            raise RuntimeError(
                "OpenAI returned an empty intelligence response."
            )

        result = json.loads(content)

        return {
            "priority": str(
                result.get(
                    "priority",
                    "MODERATE",
                )
            ).upper(),
            "headline": result.get(
                "headline",
                "Coordination recommendation",
            ),
            "recommendation": result.get(
                "recommendation",
                "",
            ),
            "rationale": result.get(
                "rationale",
                "",
            ),
            "signals_considered": result.get(
                "signals_considered",
                [],
            ),
            "model": os.getenv(
                "OPENAI_INTELLIGENCE_MODEL",
                "gpt-4.1-mini",
            ),
            "source": "OpenAI coordination intelligence",
        }