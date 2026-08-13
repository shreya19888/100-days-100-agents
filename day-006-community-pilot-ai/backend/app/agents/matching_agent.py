from typing import Any


class MatchingAgent:
    """
    Matches food donations with community food requests
    and available volunteers.

    This first version uses deterministic matching rules.
    We'll add an LLM reasoning layer after the core matching
    logic is reliable.
    """

    def find_matches(
        self,
        donations: list[dict[str, Any]],
        requests: list[dict[str, Any]],
        volunteers: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        matches = []

        for donation in donations:
            for request in requests:

                # -------------------------------------------------
                # 1. Basic food compatibility
                # -------------------------------------------------

                dietary_match = self._check_dietary_match(
                    donation,
                    request,
                )

                if not dietary_match["compatible"]:
                    continue

                # -------------------------------------------------
                # 2. Determine how many meals can be fulfilled
                # -------------------------------------------------

                donation_meals = donation.get("meals", 0)
                requested_meals = request.get("meals_needed", 0)
                request_capacity = request.get("capacity", requested_meals)

                meals_to_match = min(
                    donation_meals,
                    requested_meals,
                    request_capacity,
                )

                if meals_to_match <= 0:
                    continue

                # -------------------------------------------------
                # 3. Find volunteers
                # -------------------------------------------------

                volunteer_matches = self._find_volunteers(
                    donation=donation,
                    request=request,
                    volunteers=volunteers,
                    meals_needed=meals_to_match,
                )

                volunteer_capacity = sum(
                    match["meals_assigned"]
                    for match in volunteer_matches
                )

                fulfilled = min(
                    meals_to_match,
                    volunteer_capacity,
                )

                remaining = meals_to_match - fulfilled

                # -------------------------------------------------
                # 4. Build recommendation
                # -------------------------------------------------

                matches.append(
                    {
                        "donation_id": donation.get("id"),
                        "request_id": request.get("id"),
                        "restaurant_name": donation.get(
                            "restaurant_name"
                        ),
                        "organization_name": request.get(
                            "organization_name"
                        ),
                        "food_type": donation.get("food_type"),
                        "dietary_information": donation.get(
                            "dietary_information"
                        ),
                        "meals_available": donation_meals,
                        "meals_requested": requested_meals,
                        "meals_matched": fulfilled,
                        "meals_remaining": remaining,
                        "urgency": request.get("urgency"),
                        "dietary_match": dietary_match,
                        "volunteers": volunteer_matches,
                        "status": (
                            "fully_matched"
                            if remaining == 0
                            else "partially_matched"
                        ),
                    }
                )

        # Highest urgency first
        matches.sort(
            key=lambda match: self._urgency_score(
                match.get("urgency")
            ),
            reverse=True,
        )

        return matches

    # -------------------------------------------------------------
    # Dietary compatibility
    # -------------------------------------------------------------

    def _check_dietary_match(
        self,
        donation: dict[str, Any],
        request: dict[str, Any],
    ) -> dict[str, Any]:

        food_info = (
            donation.get("dietary_information")
            or donation.get("food_type")
            or ""
        ).lower()

        requirements = (
            request.get("dietary_preferences")
            or ""
        ).lower()

        if not requirements:
            return {
                "compatible": True,
                "reason": "No dietary restrictions specified.",
            }

        # Simple MVP compatibility check
        if requirements in food_info or food_info in requirements:
            return {
                "compatible": True,
                "reason": "Dietary requirements appear compatible.",
            }

        # Vegetarian example
        if "vegetarian" in requirements:
            if "vegetarian" in food_info:
                return {
                    "compatible": True,
                    "reason": "Donation is marked vegetarian.",
                }

            return {
                "compatible": False,
                "reason": "Donation does not indicate vegetarian food.",
            }

        return {
            "compatible": True,
            "reason": "No obvious dietary conflict detected.",
        }

    # -------------------------------------------------------------
    # Volunteer matching
    # -------------------------------------------------------------

    def _find_volunteers(
        self,
        donation: dict[str, Any],
        request: dict[str, Any],
        volunteers: list[dict[str, Any]],
        meals_needed: int,
    ) -> list[dict[str, Any]]:

        candidates = []

        for volunteer in volunteers:

            capacity = volunteer.get("capacity", 0)

            if capacity <= 0:
                continue

            # -----------------------------------------------------
            # Transportation
            # -----------------------------------------------------

            transportation = (
                volunteer.get("transportation")
                or ""
            ).lower()

            if not transportation:
                continue

            # -----------------------------------------------------
            # Volunteer task preference
            # -----------------------------------------------------

            preferred_tasks = (
                volunteer.get("preferred_tasks")
                or ""
            ).lower()

            if preferred_tasks:
                if (
                    "pickup" not in preferred_tasks
                    and "delivery" not in preferred_tasks
                    and "both" not in preferred_tasks
                ):
                    continue

            # -----------------------------------------------------
            # Assign capacity
            # -----------------------------------------------------

            meals_assigned = min(
                capacity,
                meals_needed,
            )

            candidates.append(
                {
                    "volunteer_id": volunteer.get("id"),
                    "volunteer_name": volunteer.get("name"),
                    "transportation": volunteer.get(
                        "transportation"
                    ),
                    "capacity": capacity,
                    "meals_assigned": meals_assigned,
                    "starting_zip": volunteer.get(
                        "zip_code"
                    ),
                    "max_distance": volunteer.get(
                        "max_distance"
                    ),
                    "available_from": volunteer.get(
                        "available_from"
                    ),
                    "available_until": volunteer.get(
                        "available_until"
                    ),
                }
            )

            meals_needed -= meals_assigned

            if meals_needed <= 0:
                break

        return candidates

    # -------------------------------------------------------------
    # Urgency
    # -------------------------------------------------------------

    @staticmethod
    def _urgency_score(urgency: str | None) -> int:

        if not urgency:
            return 0

        value = urgency.lower()

        if "high" in value or "urgent" in value:
            return 3

        if "medium" in value:
            return 2

        if "low" in value:
            return 1

        return 0