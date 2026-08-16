from typing import Any

from app.agents.routing_agent import RoutingAgent
from app.services.time_window import (
    pickup_deadline_at,
    time_windows_compatible,
)
from app.services.vapi_service import phone_is_callable


class MatchingAgent:
    """
    Matches food donations with community food requests
    and available volunteers.

    Matching is greedy and exclusive: one donation is assigned
    to at most one request, and a volunteer is never double-booked.
    Geography, pickup windows, and existing dispatch occupancy
    are applied before a candidate is returned.
    """

    def find_matches(
        self,
        donations: list[dict[str, Any]],
        requests: list[dict[str, Any]],
        volunteers: list[dict[str, Any]],
        *,
        claimed_donation_ids: set[str] | None = None,
        busy_volunteer_ids: set[str] | None = None,
        declined_pairs: set[tuple[str, str]] | None = None,
        fulfilled_request_ids: set[str] | None = None,
    ) -> list[dict[str, Any]]:

        claimed_donation_ids = {
            str(item) for item in (claimed_donation_ids or set())
        }
        busy_volunteer_ids = {
            str(item) for item in (busy_volunteer_ids or set())
        }
        declined_pairs = {
            (str(donation_id), str(volunteer_id))
            for donation_id, volunteer_id in (declined_pairs or set())
        }
        fulfilled_request_ids = {
            str(item) for item in (fulfilled_request_ids or set())
        }

        routing_agent = RoutingAgent()

        open_donations = []

        for donation in donations:
            donation_id = str(donation.get("id") or "")

            if not donation_id:
                continue

            if donation_id in claimed_donation_ids:
                continue

            open_donations.append(donation)

        open_donations.sort(key=self._donation_sort_key)

        open_requests = []

        for request in requests:
            request_id = str(request.get("id") or "")

            if not request_id:
                continue

            if request_id in fulfilled_request_ids:
                continue

            open_requests.append(request)

        open_requests.sort(
            key=lambda request: self._urgency_score(
                request.get("urgency")
            ),
            reverse=True,
        )

        remaining_request_meals = {}

        for request in open_requests:
            needed = request.get("meals_needed") or 0
            capacity = request.get("capacity") or 0

            if needed and capacity:
                remaining_request_meals[str(request.get("id"))] = min(
                    needed,
                    capacity,
                )
            else:
                remaining_request_meals[str(request.get("id"))] = (
                    needed or capacity or 1
                )

        used_volunteer_ids = set(busy_volunteer_ids)
        matches = []

        for donation in open_donations:
            donation_id = str(donation.get("id"))

            for request in open_requests:
                request_id = str(request.get("id"))
                remaining = remaining_request_meals.get(request_id, 0)

                if remaining <= 0:
                    continue

                dietary_match = self._check_dietary_match(
                    donation,
                    request,
                )

                if not dietary_match["compatible"]:
                    continue

                meals_to_match = min(
                    donation.get("meals") or remaining,
                    remaining,
                )

                if meals_to_match <= 0:
                    meals_to_match = remaining

                volunteer_matches = self._find_volunteers(
                    donation=donation,
                    request=request,
                    volunteers=volunteers,
                    meals_needed=meals_to_match,
                    routing_agent=routing_agent,
                    used_volunteer_ids=used_volunteer_ids,
                    declined_pairs=declined_pairs,
                )

                if not volunteer_matches:
                    continue

                volunteer_capacity = sum(
                    match["meals_assigned"]
                    for match in volunteer_matches
                )

                fulfilled = min(meals_to_match, volunteer_capacity)
                remaining_meals = meals_to_match - fulfilled

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
                        "meals_available": donation.get("meals", 0),
                        "meals_requested": request.get(
                            "meals_needed",
                            0,
                        ),
                        "meals_matched": fulfilled,
                        "meals_remaining": remaining_meals,
                        "urgency": request.get("urgency"),
                        "dietary_match": dietary_match,
                        "volunteers": volunteer_matches,
                        "status": (
                            "fully_matched"
                            if remaining_meals == 0
                            else "partially_matched"
                        ),
                    }
                )

                remaining_request_meals[request_id] = (
                    remaining - fulfilled
                )

                for volunteer_match in volunteer_matches:
                    used_volunteer_ids.add(
                        str(volunteer_match["volunteer_id"])
                    )

                # One donation is assigned to at most one request.
                break

        return matches

    def _find_volunteers(
        self,
        donation: dict[str, Any],
        request: dict[str, Any],
        volunteers: list[dict[str, Any]],
        meals_needed: int,
        routing_agent: RoutingAgent,
        used_volunteer_ids: set[str],
        declined_pairs: set[tuple[str, str]],
    ) -> list[dict[str, Any]]:

        donation_id = str(donation.get("id") or "")
        candidates = []

        for volunteer in volunteers:
            volunteer_id = str(volunteer.get("id") or "")

            if not volunteer_id:
                continue

            if volunteer_id in used_volunteer_ids:
                continue

            if (donation_id, volunteer_id) in declined_pairs:
                continue

            if not phone_is_callable(
                volunteer.get("phone")
                or volunteer.get("phone_number")
            ):
                continue

            capacity = volunteer.get("capacity") or 0

            if capacity <= 0:
                capacity = 20

            if not time_windows_compatible(
                volunteer,
                donation,
                request,
            ):
                continue

            meals_assigned = min(capacity, meals_needed)

            routed_volunteer = {
                **volunteer,
                "capacity": capacity,
            }

            route = routing_agent.evaluate_route(
                volunteer=routed_volunteer,
                donation=donation,
                request=request,
                meals_assigned=meals_assigned,
            )

            if route.get("status") == "not_feasible":
                continue

            candidates.append(
                {
                    "volunteer_id": volunteer.get("id"),
                    "volunteer_name": volunteer.get("name"),
                    "transportation": volunteer.get(
                        "transportation"
                    ),
                    "capacity": capacity,
                    "meals_assigned": meals_assigned,
                    "starting_zip": volunteer.get("zip_code"),
                    "max_distance": volunteer.get("max_distance"),
                    "available_from": volunteer.get(
                        "available_from"
                    ),
                    "available_until": volunteer.get(
                        "available_until"
                    ),
                    "route_status": route.get("status"),
                    "distance_miles": (
                        route.get("route", {})
                        .get("distance", {})
                        .get("total_miles")
                    ),
                }
            )

            meals_needed -= meals_assigned

            if meals_needed <= 0:
                break

        return candidates

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

        if requirements in food_info or food_info in requirements:
            return {
                "compatible": True,
                "reason": "Dietary requirements appear compatible.",
            }

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

    @staticmethod
    def _donation_sort_key(donation: dict[str, Any]) -> tuple:
        deadline = pickup_deadline_at(donation)

        if deadline is None:
            return (1, "")

        return (0, deadline.isoformat())

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
