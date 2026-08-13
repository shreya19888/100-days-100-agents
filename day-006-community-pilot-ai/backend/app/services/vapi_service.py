import os
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

    phone = volunteer.get("phone")

    if not phone:
        raise ValueError(
            "Volunteer does not have a phone number."
        )

    payload = {
        "assistantId": VAPI_OUTREACH_ASSISTANT_ID,
        "phoneNumberId": VAPI_PHONE_NUMBER_ID,
        "customer": {
            "number": str(phone),
            "name": volunteer.get("name"),
        },
        "assistantOverrides": {
            "variableValues": {
                "volunteer_name": volunteer.get(
                    "name",
                    "",
                ),
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
                "pickup_deadline": assignment.get(
                    "pickup_deadline",
                    "",
                ),
                "delivery_instructions": assignment.get(
                    "delivery_instructions",
                    "",
                ),
            }
        },
    }

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

    if not response.ok:
        raise RuntimeError(
            f"Vapi API error {response.status_code}: "
            f"{response.text}"
        )

    return response.json()