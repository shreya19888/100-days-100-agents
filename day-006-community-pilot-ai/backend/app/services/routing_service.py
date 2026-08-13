from typing import Any
import math


# -------------------------------------------------------------------
# ZIP-code coordinates
# -------------------------------------------------------------------
# MVP routing data.
#
# These are intentionally approximate coordinates used only for
# prototype distance estimation. A production version can replace
# this with a real geocoding / maps provider.
#
# For now, we include the ZIP codes used in our demo scenario.
# -------------------------------------------------------------------

ZIP_COORDINATES = {
    "95112": (37.3382, -121.8863),
    "95113": (37.3337, -121.8907),
}


# -------------------------------------------------------------------
# Distance helpers
# -------------------------------------------------------------------

def _normalize_zip(zip_code: Any) -> str | None:
    """Normalize a ZIP code into a five-digit string."""

    if zip_code is None:
        return None

    value = str(zip_code).strip()

    if not value:
        return None

    # Handle values such as 95112.0
    if value.endswith(".0"):
        value = value[:-2]

    return value[:5]


def _haversine_miles(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """Calculate approximate straight-line distance in miles."""

    radius = 3958.8

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a),
    )

    return radius * c


def estimate_distance(
    origin_zip: Any,
    destination_zip: Any,
) -> dict[str, Any]:
    """
    Estimate distance between two ZIP codes.

    Returns enough metadata for the frontend to clearly
    distinguish an estimate from a real-time driving route.
    """

    origin = _normalize_zip(origin_zip)
    destination = _normalize_zip(destination_zip)

    if not origin or not destination:
        return {
            "available": False,
            "distance_miles": None,
            "method": "unavailable",
            "message": "ZIP code information is missing.",
        }

    if origin == destination:
        return {
            "available": True,
            "distance_miles": 0.0,
            "method": "zip_centroid_estimate",
            "message": "Origin and destination are in the same ZIP code.",
        }

    origin_coordinates = ZIP_COORDINATES.get(origin)
    destination_coordinates = ZIP_COORDINATES.get(destination)

    if not origin_coordinates or not destination_coordinates:
        return {
            "available": False,
            "distance_miles": None,
            "method": "unavailable",
            "message": (
                f"No prototype coordinates are available for "
                f"{origin} → {destination}."
            ),
        }

    distance = _haversine_miles(
        origin_coordinates[0],
        origin_coordinates[1],
        destination_coordinates[0],
        destination_coordinates[1],
    )

    return {
        "available": True,
        "distance_miles": round(distance, 1),
        "method": "zip_centroid_estimate",
        "message": "Approximate distance based on ZIP-code coordinates.",
    }


# -------------------------------------------------------------------
# Route planning
# -------------------------------------------------------------------

def build_route(
    volunteer: dict[str, Any],
    donation: dict[str, Any],
    request: dict[str, Any],
) -> dict[str, Any]:
    """
    Build a pickup → delivery route for a volunteer.

    This is an MVP route estimate, not turn-by-turn navigation.
    """

    volunteer_zip = volunteer.get("zip_code")
    pickup_zip = donation.get("zip_code")
    delivery_zip = request.get("zip_code")

    volunteer_to_pickup = estimate_distance(
        volunteer_zip,
        pickup_zip,
    )

    pickup_to_delivery = estimate_distance(
        pickup_zip,
        delivery_zip,
    )

    max_distance = volunteer.get("max_distance")

    within_distance_limit = True

    if (
        max_distance
        and volunteer_to_pickup["distance_miles"] is not None
    ):
        within_distance_limit = (
            volunteer_to_pickup["distance_miles"]
            <= max_distance
        )

    # Simple MVP travel-time estimate.
    #
    # We deliberately label this as an estimate rather than
    # pretending it is real-time traffic/navigation data.
    pickup_distance = (
        volunteer_to_pickup["distance_miles"]
        or 0
    )

    delivery_distance = (
        pickup_to_delivery["distance_miles"]
        or 0
    )

    estimated_total_distance = round(
        pickup_distance + delivery_distance,
        1,
    )

    estimated_travel_minutes = round(
        estimated_total_distance * 3,
    )

    return {
        "volunteer": {
            "id": volunteer.get("id"),
            "name": volunteer.get("name"),
            "starting_zip": volunteer_zip,
            "max_distance": max_distance,
        },
        "pickup": {
            "address": donation.get("pickup_address"),
            "city": donation.get("city"),
            "zip_code": pickup_zip,
        },
        "delivery": {
            "organization": request.get(
                "organization_name"
            ),
            "address": request.get("address"),
            "city": request.get("city"),
            "zip_code": delivery_zip,
        },
        "distance": {
            "volunteer_to_pickup_miles": volunteer_to_pickup[
                "distance_miles"
            ],
            "pickup_to_delivery_miles": pickup_to_delivery[
                "distance_miles"
            ],
            "total_miles": estimated_total_distance,
        },
        "estimated_travel_minutes": estimated_travel_minutes,
        "within_volunteer_distance_limit": within_distance_limit,
        "route_estimate_available": (
            volunteer_to_pickup["available"]
            and pickup_to_delivery["available"]
        ),
        "method": "prototype_zip_estimate",
    }