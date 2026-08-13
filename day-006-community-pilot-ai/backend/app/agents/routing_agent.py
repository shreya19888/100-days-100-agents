from typing import Any

from app.services.routing_service import build_route


class RoutingAgent:
    """
    Evaluates the feasibility of a delivery route.

    The Routing Agent does not perform navigation itself.
    It interprets route information produced by the routing service.
    """

    def evaluate_route(
        self,
        volunteer: dict[str, Any],
        donation: dict[str, Any],
        request: dict[str, Any],
        meals_assigned: int,
    ) -> dict[str, Any]:

        route = build_route(
            volunteer=volunteer,
            donation=donation,
            request=request,
        )

        issues = []
        warnings = []

        # ---------------------------------------------------------
        # Distance
        # ---------------------------------------------------------

        if not route["route_estimate_available"]:
            warnings.append(
                "A complete route estimate is unavailable."
            )

        if not route["within_volunteer_distance_limit"]:
            issues.append(
                "Pickup location exceeds the volunteer's "
                "maximum travel distance."
            )

        # ---------------------------------------------------------
        # Transportation
        # ---------------------------------------------------------

        transportation = (
            volunteer.get("transportation")
            or ""
        ).lower()

        if not transportation:
            issues.append(
                "Volunteer transportation information is missing."
            )

        # ---------------------------------------------------------
        # Availability
        # ---------------------------------------------------------

        if not volunteer.get("available_from"):
            warnings.append(
                "Volunteer availability start time is missing."
            )

        if not volunteer.get("available_until"):
            warnings.append(
                "Volunteer availability end time is missing."
            )

        if not donation.get("pickup_deadline"):
            warnings.append(
                "Donation pickup deadline is missing."
            )

        # ---------------------------------------------------------
        # Capacity
        # ---------------------------------------------------------

        volunteer_capacity = volunteer.get(
            "capacity",
            0,
        )

        if meals_assigned > volunteer_capacity:
            issues.append(
                "Assigned meals exceed volunteer capacity."
            )

        # ---------------------------------------------------------
        # Final route status
        # ---------------------------------------------------------

        if issues:
            status = "not_feasible"

        elif warnings:
            status = "feasible_with_warnings"

        else:
            status = "feasible"

        return {
            "status": status,
            "issues": issues,
            "warnings": warnings,
            "meals_assigned": meals_assigned,
            "route": route,
        }