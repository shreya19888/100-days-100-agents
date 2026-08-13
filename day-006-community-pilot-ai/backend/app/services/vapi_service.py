import os
import re
from typing import Any

import requests
from dotenv import load_dotenv


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


# -------------------------------------------------------------------
# Place volunteer call
# -------------------------------------------------------------------

def place_volunteer_call(
    volunteer: dict[str, Any],
    assignment: dict[str, Any],
) -> dict[str, Any]:

    if not VAPI_API_KEY:
        raise RuntimeError(
            "VAPI_API_KEY is not configured."
        )

    if not VAPI_OUTREACH_ASSISTANT_ID:
        raise RuntimeError(
            "VAPI_OUTREACH_ASSISTANT_ID is not configured."
        )

    if not VAPI_PHONE_NUMBER_ID:
        raise RuntimeError(
            "VAPI_PHONE_NUMBER_ID is not configured."
        )

    # ---------------------------------------------------------------
    # Normalize volunteer phone number
    # ---------------------------------------------------------------

    phone = normalize_phone_number(
        volunteer.get("phone")
    )

    print("=== NORMALIZED VOLUNTEER PHONE ===")
    print(phone)

    # ---------------------------------------------------------------
    # Build Vapi payload
    # ---------------------------------------------------------------

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

    # ---------------------------------------------------------------
    # Call Vapi
    # ---------------------------------------------------------------

    response = requests.post(
        VAPI_API_URL,
        headers={
            "Authorization": f"Bearer {VAPI_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )

    print("=== VAPI STATUS ===")
    print(response.status_code)

    print("=== VAPI RESPONSE ===")
    print(response.text)

    # ---------------------------------------------------------------
    # Handle errors
    # ---------------------------------------------------------------

    if not response.ok:
        raise RuntimeError(
            f"Vapi API error {response.status_code}: "
            f"{response.text}"
        )

    return response.json()