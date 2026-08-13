from typing import Any

from app.database import supabase


# -------------------------------------------------------------------
# Raw Whalesync tables
# -------------------------------------------------------------------

FOOD_DONATIONS_TABLE = "Food Donation"
VOLUNTEERS_TABLE = "Volunteer Signup"
COMMUNITY_REQUESTS_TABLE = "Food Request"


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def _get_rows(table: str) -> list[dict[str, Any]]:
    """Fetch all rows from a Supabase table."""
    response = supabase.table(table).select("*").execute()
    return response.data or []


def _to_int(value: Any, default: int = 0) -> int:
    """Safely convert a value to an integer."""
    if value is None or value == "":
        return default

    try:
        return int(float(str(value).strip()))
    except (ValueError, TypeError):
        return default


def _to_float(value: Any, default: float = 0.0) -> float:
    """Safely extract a numeric value from text."""

    if value is None or value == "":
        return default

    text = str(value).strip().lower()

    # Handle values such as:
    # "Up to 10 miles"
    # "10 miles"
    # "10"
    import re

    match = re.search(r"(\d+(?:\.\d+)?)", text)

    if not match:
        return default

    try:
        return float(match.group(1))
    except (ValueError, TypeError):
        return default


# -------------------------------------------------------------------
# Donations
# -------------------------------------------------------------------

def get_donations() -> list[dict[str, Any]]:
    """
    Return normalized food donation records.

    Converts Whalesync's Google Form field names into
    application-friendly names.
    """

    rows = _get_rows(FOOD_DONATIONS_TABLE)

    donations = []

    for row in rows:
        donations.append(
            {
                "id": row.get("whalesync_postgres_id"),
                "restaurant_name": row.get("restaurant_business_name"),
                "contact_name": row.get("contact_name"),
                "contact_email": row.get("contact_email"),
                "contact_phone": row.get("contact_phone"),
                "food_type": row.get("what_type_of_food_is_available"),
                "meals": _to_int(
                    row.get(
                        "approximately_how_many_meals_or_servings_are_available"
                    )
                ),
                "dietary_information": row.get(
                    "what_dietary_information_should_recipients_know"
                ),
                "available_from": row.get(
                    "when_will_the_food_be_ready_for_pickup"
                ),
                "pickup_deadline": row.get(
                    "what_is_the_latest_time_the_food_can_be_picked_up"
                ),
                "packaged": row.get(
                    "is_the_food_packaged_and_ready_for_transport"
                ),
                "pickup_address": row.get("pickup_address"),
                "city": row.get("city"),
                "zip_code": row.get("zip_code"),
                "notes": row.get(
                    "anything_else_the_pickup_team_should_know"
                ),
                "created_at": row.get("timestamp"),
            }
        )

    return donations


# -------------------------------------------------------------------
# Volunteers
# -------------------------------------------------------------------

def get_volunteers() -> list[dict[str, Any]]:
    """
    Return normalized volunteer records.
    """

    rows = _get_rows(VOLUNTEERS_TABLE)

    volunteers = []

    for row in rows:
        volunteers.append(
            {
                "id": row.get("whalesync_postgres_id"),
                "name": row.get("full_name"),
                "email": row.get("email"),
                "phone": row.get("phone_number"),
                "transportation": row.get(
                    "what_transportation_do_you_have"
                ),
                "capacity": _to_int(
                    row.get(
                        "how_many_meals_or_food_packages_can_you_transport"
                    )
                ),
                "available_from": row.get(
                    "when_are_you_available_from"
                ),
                "available_until": row.get(
                    "when_are_you_available_until"
                ),
                "max_distance": _to_float(
                    row.get(
                        "what_is_the_maximum_distance_you_re_comfortable_traveling"
                    )
                ),
                "preferred_tasks": row.get(
                    "what_would_you_like_to_help_with"
                ),
                "zip_code": row.get(
                    "starting_location_zip_code"
                ),
                "limitations": row.get(
                    "are_there_any_transportation_or_scheduling_limitations_we_shoul"
                ),
                "created_at": row.get("timestamp"),
            }
        )

    return volunteers


# -------------------------------------------------------------------
# Community Requests
# -------------------------------------------------------------------

def get_community_requests() -> list[dict[str, Any]]:
    """
    Return normalized community food requests.
    """

    rows = _get_rows(COMMUNITY_REQUESTS_TABLE)

    requests = []

    for row in rows:
        requests.append(
            {
                "id": row.get("whalesync_postgres_id"),
                "organization_name": row.get("organization_name"),
                "contact_name": row.get("contact_name"),
                "contact_email": row.get("contact_email"),
                "contact_phone": row.get("contact_phone"),
                "organization_type": row.get(
                    "what_type_of_organization_are_you"
                ),
                "meals_needed": _to_int(
                    row.get("how_many_meals_are_currently_needed")
                ),
                "urgency": row.get("how_urgent_is_this_request"),
                "dietary_preferences": row.get(
                    "are_there_dietary_preferences_or_requirements"
                ),
                "capacity": _to_int(
                    row.get(
                        "what_is_the_maximum_number_of_meals_you_can_currently_accept"
                    )
                ),
                "available_from": row.get(
                    "when_can_your_organization_receive_food"
                ),
                "address": row.get("pickup_delivery_address"),
                "city": row.get("city"),
                "zip_code": row.get("zip_code"),
                "accepts_prepared_food": row.get(
                    "do_you_currently_accept_prepared_food_donations"
                ),
                "delivery_instructions": row.get(
                    "are_there_any_restrictions_or_instructions_for_food_deliveries"
                ),
                "created_at": row.get("timestamp"),
            }
        )

    return requests


# -------------------------------------------------------------------
# Dashboard summary
# -------------------------------------------------------------------

def get_data_summary() -> dict[str, int]:
    """
    Return a simple summary for the Community Pilot dashboard.
    """

    donations = get_donations()
    volunteers = get_volunteers()
    requests = get_community_requests()

    return {
        "donations": len(donations),
        "volunteers": len(volunteers),
        "community_requests": len(requests),
        "meals_available": sum(
            donation["meals"] for donation in donations
        ),
        "meals_requested": sum(
            request["meals_needed"] for request in requests
        ),
        "volunteer_capacity": sum(
            volunteer["capacity"] for volunteer in volunteers
        ),
    }