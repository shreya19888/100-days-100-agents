import os
from datetime import datetime, timedelta
from typing import Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


SCOPES = [
    "https://www.googleapis.com/auth/calendar"
]


def get_calendar_service():
    """
    Authenticate with Google Calendar using OAuth credentials
    stored in environment variables.

    This is designed for production environments such as Render,
    where we don't want to depend on local credentials.json/token.json
    files.
    """

    client_id = os.getenv("client_id")
    client_secret = os.getenv("client_secret")
    token = os.getenv("token")
    refresh_token = os.getenv("refresh_token")
    token_uri = os.getenv(
        "token_uri",
        "https://oauth2.googleapis.com/token",
    )

    if not client_id:
        raise RuntimeError(
            "Google Calendar client_id is not configured."
        )

    if not client_secret:
        raise RuntimeError(
            "Google Calendar client_secret is not configured."
        )

    if not refresh_token:
        raise RuntimeError(
            "Google Calendar refresh_token is not configured."
        )

    creds = Credentials(
        token=token,
        refresh_token=refresh_token,
        token_uri=token_uri,
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES,
    )

    # Refresh the access token if necessary.
    if not creds.valid:

        if creds.expired and creds.refresh_token:
            creds.refresh(Request())

        else:
            raise RuntimeError(
                "Google Calendar authentication could not be refreshed."
            )

    return build(
        "calendar",
        "v3",
        credentials=creds,
    )


def create_volunteer_calendar_event(
    volunteer: dict[str, Any],
    assignment: dict[str, Any],
) -> dict[str, Any]:

    service = get_calendar_service()

    volunteer_name = volunteer.get(
        "name",
        "Volunteer",
    )

    volunteer_email = volunteer.get(
        "email"
    )

    meals = assignment.get(
        "meals_assigned",
        0,
    )

    pickup_address = assignment.get(
        "pickup_address",
        "",
    )

    pickup_city = assignment.get(
        "pickup_city",
        "",
    )

    pickup_deadline = assignment.get(
        "pickup_deadline",
        "",
    )

    delivery_organization = assignment.get(
        "delivery_organization",
        "",
    )

    delivery_address = assignment.get(
        "delivery_address",
        "",
    )

    delivery_city = assignment.get(
        "delivery_city",
        "",
    )

    delivery_instructions = assignment.get(
        "delivery_instructions",
        "",
    )

    # ---------------------------------------------------------------
    # Demo event timing
    # ---------------------------------------------------------------
    #
    # For now we use a one-hour delivery window.
    # We'll make this smarter later.
    #

    now = datetime.now()

    start_time = now + timedelta(
        minutes=15
    )

    end_time = start_time + timedelta(
        hours=1
    )

    event = {
        "summary": (
            "Community Pilot — Food Delivery"
        ),

        "location": (
            f"{pickup_address}, "
            f"{pickup_city}"
        ),

        "description": f"""
Community Pilot Food Delivery

Volunteer: {volunteer_name}
Meals: {meals}

PICKUP
{pickup_address}
{pickup_city}

Pickup deadline:
{pickup_deadline}

DELIVERY
{delivery_organization}
{delivery_address}
{delivery_city}

Delivery instructions:
{delivery_instructions}

Thank you for helping redirect surplus food
to the community!
""".strip(),

        "start": {
            "dateTime": start_time.isoformat(),
            "timeZone": "America/Los_Angeles",
        },

        "end": {
            "dateTime": end_time.isoformat(),
            "timeZone": "America/Los_Angeles",
        },

        "attendees": [],
    }

    if volunteer_email:
        event["attendees"] = [
            {
                "email": volunteer_email,
                "displayName": volunteer_name,
            }
        ]

    created_event = (
        service.events()
        .insert(
            calendarId="primary",
            body=event,
            sendUpdates="all",
        )
        .execute()
    )

    print(
        "=== GOOGLE CALENDAR EVENT CREATED ==="
    )

    print(
        created_event.get("id")
    )

    print(
        created_event.get("htmlLink")
    )

    return created_event