import os
import re
from typing import Any

import requests
from dotenv import load_dotenv

from app.services.tls import tls_verify


load_dotenv()


VAPI_API_URL = "https://api.vapi.ai/call"

VAPI_API_KEY = os.getenv("VAPI_API_KEY")
VAPI_PHONE_NUMBER_ID = os.getenv("VAPI_PHONE_NUMBER_ID")
VAPI_OUTREACH_ASSISTANT_ID = os.getenv(
    "VAPI_OUTREACH_ASSISTANT_ID"
)


# -------------------------------------------------------------------
# Phone number helper
# -------------------------------------------------------------------

def normalize_phone_number(phone: Any) -> str:
    """
    Convert common US phone formats to E.164.

    Examples:
        4083061143       -> +14083061143
        (408) 306-1143   -> +14083061143
        +1 408 306 1143  -> +14083061143
    """

    if not phone:
        raise ValueError("Phone number is missing.")

    value = str(phone).strip()

    # Keep digits only
    digits = re.sub(r"\D", "", value)

    # US number without country code
    if len(digits) == 10:
        return f"+1{digits}"

    # US number already includes country code
    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"

    # Already international format
    if value.startswith("+"):
        return value

    raise ValueError(
        f"Phone number could not be converted to E.164: {phone}"
    )


def phone_is_callable(phone: Any) -> bool:
    """True when the number can actually be dialed (not missing or fictional)."""

    try:
        normalized = normalize_phone_number(phone)
    except ValueError:
        return False

    digits = re.sub(r"\D", "", normalized)

    if len(digits) == 11 and digits.startswith("1"):
        national = digits[1:]
    elif len(digits) == 10:
        national = digits
    else:
        return False

    # NANP 555 exchange numbers are reserved / fictional.
    if national[3:6] == "555":
        return False

    return True


def _post_vapi_call(payload: dict[str, Any]) -> dict[str, Any]:
    if not VAPI_API_KEY:
        raise RuntimeError("VAPI_API_KEY is not configured.")

    if not VAPI_PHONE_NUMBER_ID:
        raise RuntimeError("VAPI_PHONE_NUMBER_ID is not configured.")

    response = requests.post(
        VAPI_API_URL,
        headers={
            "Authorization": f"Bearer {VAPI_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
        verify=tls_verify(),
    )

    print("=== VAPI STATUS ===")
    print(response.status_code)
    print("=== VAPI RESPONSE ===")
    print(response.text)

    if not response.ok:
        raise RuntimeError(
            f"Vapi API error {response.status_code}: {response.text}"
        )

    return response.json()


def place_volunteer_call(
    volunteer: dict[str, Any],
    assignment: dict[str, Any],
) -> dict[str, Any]:

    if not VAPI_OUTREACH_ASSISTANT_ID:
        raise RuntimeError(
            "VAPI_OUTREACH_ASSISTANT_ID is not configured."
        )

    phone = normalize_phone_number(volunteer.get("phone"))

    print("=== NORMALIZED VOLUNTEER PHONE ===")
    print(phone)

    payload = {
        "assistantId": VAPI_OUTREACH_ASSISTANT_ID,
        "phoneNumberId": VAPI_PHONE_NUMBER_ID,
        "customer": {
            "number": phone,
            "name": volunteer.get("name"),
        },
        "assistantOverrides": {
            "variableValues": {

                # ---------------------------------------------------
                # Assignment identifiers
                # ---------------------------------------------------

                "assignment_id": assignment.get(
                    "assignment_id",
                    "",
                ),

                "donation_id": assignment.get(
                    "donation_id",
                    "",
                ),

                "request_id": assignment.get(
                    "request_id",
                    "",
                ),

                "volunteer_id": assignment.get(
                    "volunteer_id",
                    "",
                ),

                # ---------------------------------------------------
                # Volunteer
                # ---------------------------------------------------

                "volunteer_name": volunteer.get(
                    "name",
                    "",
                ),

                # ---------------------------------------------------
                # Pickup
                # ---------------------------------------------------

                "meals_assigned": str(
                    assignment.get(
                        "meals_assigned",
                        0,
                    )
                ),

                "pickup_address": assignment.get(
                    "pickup_address",
                    "",
                ),

                "pickup_city": assignment.get(
                    "pickup_city",
                    "",
                ),

                "pickup_deadline": assignment.get(
                    "pickup_deadline",
                    "",
                ),

                # ---------------------------------------------------
                # Delivery
                # ---------------------------------------------------

                "delivery_organization": assignment.get(
                    "delivery_organization",
                    "",
                ),

                "delivery_address": assignment.get(
                    "delivery_address",
                    "",
                ),

                "delivery_city": assignment.get(
                    "delivery_city",
                    "",
                ),

                "delivery_instructions": assignment.get(
                    "delivery_instructions",
                    "",
                ),
            }
        },
    }

    return _post_vapi_call(payload)


def place_donor_notification_call(
    donor: dict[str, Any],
    volunteer: dict[str, Any],
    assignment: dict[str, Any],
) -> dict[str, Any]:
    """Tell the donor a volunteer is on the way."""

    phone = normalize_phone_number(
        donor.get("phone") or donor.get("contact_phone")
    )
    donor_name = donor.get("name") or donor.get("contact_name") or "there"
    volunteer_name = volunteer.get("name") or "a volunteer"
    meals = assignment.get("meals_assigned") or 0
    address = ", ".join(
        part
        for part in (
            assignment.get("pickup_address"),
            assignment.get("pickup_city"),
        )
        if part
    ) or "the pickup address"
    deadline = assignment.get("pickup_deadline") or "the listed pickup time"

    first_message = (
        f"Hi {donor_name}, this is Community Pilot. "
        f"{volunteer_name} is on the way to pick up {meals} meals "
        f"at {address}. Please have the food ready by {deadline}. "
        "Thank you for donating."
    )

    assistant_id = (
        os.getenv("VAPI_DONOR_ASSISTANT_ID") or VAPI_OUTREACH_ASSISTANT_ID
    )

    if not assistant_id:
        raise RuntimeError("No Vapi assistant is configured for donor calls.")

    print("=== DONOR NOTIFICATION CALL ===")
    print(phone)

    payload = {
        "assistantId": assistant_id,
        "phoneNumberId": VAPI_PHONE_NUMBER_ID,
        "customer": {
            "number": phone,
            "name": donor_name,
        },
        "maxDurationSeconds": 45,
        "assistantOverrides": {
            "firstMessage": first_message,
            "variableValues": {
                "call_role": "donor_notify",
                "assignment_id": assignment.get("id")
                or assignment.get("assignment_id")
                or "",
                "volunteer_name": volunteer_name,
                "meals_assigned": str(meals),
                "pickup_address": assignment.get("pickup_address") or "",
                "pickup_city": assignment.get("pickup_city") or "",
                "pickup_deadline": str(deadline),
                "donor_name": donor_name,
            },
        },
    }

    return _post_vapi_call(payload)
