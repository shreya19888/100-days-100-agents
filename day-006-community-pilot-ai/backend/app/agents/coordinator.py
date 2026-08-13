from typing import Any


class CoordinatorAgent:
    """
    Coordinates the outputs of Community Pilot's agents
    and produces an actionable delivery recommendation.

    The coordinator does not invent data. It reasons only
    over verified donation, community, volunteer, and
    matching results.
    """

    def create_plan(
        self,
        donation: dict[str, Any],
        request: dict[str, Any],
        match: dict[str, Any],
    ) -> dict[str, Any]:

        matched_meals = match.get("meals_matched", 0)
        remaining_meals = match.get("meals_remaining", 0)

        volunteers = match.get("volunteers", [])

        if remaining_meals == 0:
            status = "ready_to_dispatch"
            recommendation = (
                "The request can be fully fulfilled with the "
                "available volunteer capacity."
            )
        else:
            status = "needs_additional_volunteer"
            recommendation = (
                f"Assign the matched volunteer capacity for "
                f"{matched_meals} meals and find additional "
                f"transport capacity for the remaining "
                f"{remaining_meals} meals."
            )

        return {
            "status": status,
            "priority": self._priority(request.get("urgency")),
            "recommendation": recommendation,
            "donation": {
                "id": donation.get("id"),
                "restaurant_name": donation.get("restaurant_name"),
                "food_type": donation.get("food_type"),
                "meals_available": donation.get("meals"),
                "dietary_information": donation.get(
                    "dietary_information"),
                "pickup_address": donation.get("pickup_address"),
                "city": donation.get("city"),
                "pickup_deadline": donation.get("pickup_deadline"),
            },
            "request": {
                "id": request.get("id"),
                "organization_name": request.get(
                    "organization_name"
                ),
                "meals_requested": request.get(
                    "meals_needed"
                ),
                "dietary_preferences": request.get(
                    "dietary_preferences"
                ),
                "address": request.get("address"),
                "city": request.get("city"),
                "urgency": request.get("urgency"),
                "delivery_instructions": request.get(
                    "delivery_instructions"
                ),
            },
            "delivery": {
                "meals_matched": matched_meals,
                "meals_remaining": remaining_meals,
                "volunteers": volunteers,
            },
        }

    @staticmethod
    def _priority(urgency: str | None) -> str:

        if not urgency:
            return "normal"

        value = urgency.lower()

        if "high" in value or "urgent" in value:
            return "high"

        if "medium" in value:
            return "medium"

        if "low" in value:
            return "low"

        return "normal"