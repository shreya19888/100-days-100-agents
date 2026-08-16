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
    "94102": (37.7793, -122.4193),
    "94103": (37.7726, -122.4099),
    "94105": (37.7898, -122.3942),
    "94107": (37.7621, -122.3971),
    "94110": (37.7484, -122.4156),
    "94112": (37.7211, -122.4411),
    "94114": (37.7580, -122.4352),
    "94115": (37.7858, -122.4376),
    "94117": (37.7691, -122.4449),
    "94118": (37.7812, -122.4614),
    "94121": (37.7786, -122.4892),
    "94122": (37.7593, -122.4836),
    "94124": (37.7304, -122.3843),
    "94133": (37.8002, -122.4091),
    "94158": (37.7700, -122.3870),
    "94601": (37.7756, -122.2187),
    "94606": (37.7939, -122.2460),
    "94607": (37.8085, -122.2942),
    "94609": (37.8346, -122.2648),
    "94612": (37.8090, -122.2691),
    "94702": (37.8646, -122.2858),
    "94704": (37.8668, -122.2595),
    "94709": (37.8797, -122.2658),
    "94002": (37.5202, -122.2758),
    "94010": (37.5703, -122.3597),
    "94025": (37.4538, -122.1822),
    "94040": (37.3855, -122.0880),
    "94041": (37.3893, -122.0817),
    "94043": (37.4056, -122.0775),
    "94061": (37.4636, -122.2364),
    "94063": (37.4919, -122.2110),
    "94070": (37.4969, -122.2837),
    "94080": (37.6547, -122.4108),
    "94085": (37.3886, -122.0178),
    "94086": (37.3688, -122.0375),
    "94087": (37.3502, -122.0353),
    "94301": (37.4443, -122.1497),
    "94303": (37.4481, -122.1298),
    "94305": (37.4275, -122.1702),
    "94306": (37.4201, -122.1387),
    "94401": (37.5735, -122.3131),
    "94402": (37.5629, -122.3423),
    "94403": (37.5394, -122.3044),
    "94501": (37.7712, -122.2785),
    "94536": (37.5620, -121.9950),
    "94538": (37.5297, -121.9844),
    "94539": (37.5150, -121.9280),
    "94541": (37.6752, -122.0860),
    "94544": (37.6328, -122.0537),
    "94560": (37.5275, -122.0310),
    "94587": (37.5985, -122.0467),
    "95008": (37.2874, -121.9475),
    "95014": (37.3186, -122.0386),
    "95035": (37.4323, -121.8996),
    "95050": (37.3496, -121.9530),
    "95051": (37.3483, -121.9844),
    "95054": (37.3935, -121.9617),
    "95070": (37.2578, -122.0307),
    "95110": (37.3544, -121.9187),
    "95111": (37.2834, -121.8261),
    "95112": (37.3382, -121.8863),
    "95113": (37.3337, -121.8907),
    "95116": (37.3496, -121.8494),
    "95117": (37.3123, -121.9650),
    "95118": (37.2566, -121.8895),
    "95119": (37.2284, -121.7886),
    "95120": (37.2060, -121.8605),
    "95121": (37.3045, -121.8097),
    "95122": (37.3306, -121.8384),
    "95123": (37.2428, -121.8276),
    "95124": (37.2567, -121.9232),
    "95125": (37.2962, -121.8925),
    "95126": (37.3253, -121.9156),
    "95127": (37.3685, -121.8274),
    "95128": (37.3161, -121.9363),
    "95129": (37.3066, -122.0004),
    "95131": (37.3876, -121.8900),
    "95132": (37.4038, -121.8606),
    "95133": (37.3728, -121.8603),
    "95134": (37.4096, -121.9417),
    "95135": (37.2764, -121.7195),
    "95136": (37.2687, -121.8490),
    "95138": (37.2461, -121.7489),
    "95148": (37.3306, -121.7710),
}

# Fallback centroids for California ZIP prefixes when a 5-digit
# coordinate is not in the table above.
ZIP3_COORDINATES = {
    "900": (34.0522, -118.2437),
    "902": (33.9617, -118.3531),
    "904": (34.0195, -118.4912),
    "905": (33.8358, -118.3406),
    "906": (33.9316, -118.0117),
    "907": (33.7900, -118.2617),
    "908": (33.7701, -118.1937),
    "910": (34.1980, -118.1590),
    "911": (34.1478, -118.1445),
    "912": (34.1425, -118.2551),
    "913": (34.2197, -118.5514),
    "914": (34.1867, -118.4489),
    "916": (34.1683, -118.3768),
    "917": (34.0614, -117.7523),
    "919": (32.7133, -116.9730),
    "920": (33.1434, -117.1661),
    "921": (32.7157, -117.1611),
    "922": (33.7206, -116.2156),
    "925": (33.9533, -117.3962),
    "926": (33.6695, -117.8231),
    "927": (33.7455, -117.8677),
    "928": (33.8038, -117.9145),
    "930": (34.2805, -119.2945),
    "931": (34.4208, -119.6982),
    "933": (35.3733, -119.0187),
    "934": (35.2828, -120.6596),
    "936": (36.7378, -119.7871),
    "937": (36.7378, -119.7871),
    "939": (36.6002, -121.8947),
    "940": (37.4688, -122.2416),
    "941": (37.7749, -122.4194),
    "943": (37.4419, -122.1430),
    "944": (37.5629, -122.3255),
    "945": (37.8216, -122.0456),
    "946": (37.8044, -122.2712),
    "947": (37.8715, -122.2730),
    "948": (37.9358, -122.3477),
    "949": (37.9735, -122.5311),
    "950": (37.0454, -121.9570),
    "951": (37.3382, -121.8863),
    "952": (37.9577, -121.2908),
    "953": (37.4836, -120.8470),
    "954": (38.4405, -122.7144),
    "955": (40.8021, -124.1637),
    "956": (38.6750, -121.3510),
    "957": (38.7296, -121.0780),
    "958": (38.5816, -121.4944),
    "959": (39.3638, -121.6197),
    "960": (40.5865, -122.3917),
    "961": (39.3271, -120.1833),
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


def _coordinates_for_zip(zip_code: str) -> tuple[float, float] | None:
    exact = ZIP_COORDINATES.get(zip_code)
    if exact:
        return exact

    return ZIP3_COORDINATES.get(zip_code[:3])


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


def coordinates_for_zip(zip_code: Any) -> dict[str, Any] | None:
    """Return lat/lng for a ZIP, if we have a centroid for it."""

    normalized = _normalize_zip(zip_code)
    if not normalized:
        return None

    coords = _coordinates_for_zip(normalized)
    if not coords:
        return None

    return {
        "zip": normalized,
        "lat": coords[0],
        "lng": coords[1],
    }


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

    origin_coordinates = _coordinates_for_zip(origin)
    destination_coordinates = _coordinates_for_zip(destination)

    if not origin_coordinates or not destination_coordinates:
        return {
            "available": False,
            "distance_miles": None,
            "method": "unavailable",
            "message": (
                f"No coordinates are available for "
                f"{origin} → {destination}."
            ),
        }

    distance = _haversine_miles(
        origin_coordinates[0],
        origin_coordinates[1],
        destination_coordinates[0],
        destination_coordinates[1],
    )

    used_prefix = (
        origin not in ZIP_COORDINATES
        or destination not in ZIP_COORDINATES
    )

    method = (
        "zip3_centroid_estimate"
        if used_prefix
        else "zip_centroid_estimate"
    )

    return {
        "available": True,
        "distance_miles": round(distance, 1),
        "method": method,
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