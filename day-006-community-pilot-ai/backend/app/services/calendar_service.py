import os
from datetime import datetime, timedelta
from typing import Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


SCOPES = [
    "https://www.googleapis.com/auth/calendar"
]


# -------------------------------------------------------------------
# File locations
# -------------------------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

CREDENTIALS_FILE = os.path.join(
    BASE_DIR,
    "credentials.json",
)

TOKEN_FILE = os.path.join(
    BASE_DIR,
    "token.json",
)


# -------------------------------------------------------------------
# Google Calendar authentication
# -------------------------------------------------------------------

def get_calendar_service():
    """Authenticate and return a Google Calendar service."""

    creds = None

    # ---------------------------------------------------------------
    # Load existing token
    # ---------------------------------------------------------------

    if os.path.exists(TOKEN_FILE):

        creds = (
            Credentials.from_authorized_user_file(
                TOKEN_FILE,
                SCOPES,
            )
        )

    # ---------------------------------------------------------------
    # Refresh or create credentials
    # ---------------------------------------------------------------

    if not creds or not creds.valid:

        if (
            creds
            and creds.expired
            and creds.refresh_token
        ):

            creds.refresh(
                Request()
            )

        else:

            flow = (
                InstalledAppFlow
                .from_client_secrets_file(
                    CREDENTIALS_FILE,
                    SCOPES,
                )
            )

            creds = flow.run_local_server(
                port=0
            )

        # Save refreshed/new credentials
        with open(
            TOKEN_FILE,
            "w",
        ) as token:

            token.write(
                creds.to_json()
            )

    # ---------------------------------------------------------------
    # Build Calendar API client
    # ---------------------------------------------------------------

    return build(
        "calendar",
        "v3",
        credentials=creds,
    )


# -------------------------------------------------------------------
# Calendar event creation
# -------------------------------------------------------------------

def create_volunteer_calendar_event(
    volunteer: dict[str, Any],
    assignment: dict[str, Any],
) -> dict[str, Any]:
    """
    Create a Google Calendar event for an accepted
    Community Pilot volunteer assignment.
    """

    service = get_calendar_service()

    # ---------------------------------------------------------------
    # Volunteer information
    # ---------------------------------------------------------------

    volunteer_name = volunteer.get(
        "name",
        "Volunteer",
    )

    volunteer_email = volunteer.get(
        "email"
    )

    # ---------------------------------------------------------------
    # Assignment information
    # ---------------------------------------------------------------

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

    pickup_deadline_text = assignment.get(
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
    # Validate pickup deadline
    # ---------------------------------------------------------------

    if not pickup_deadline_text:

        raise ValueError(
            "Assignment is missing pickup_deadline."
        )

    # ---------------------------------------------------------------
    # Parse pickup deadline
    # ---------------------------------------------------------------

    try:

        pickup_deadline = datetime.strptime(
            pickup_deadline_text,
            "%m/%d/%Y %H:%M:%S",
        )

    except ValueError:

        try:

            pickup_deadline = datetime.strptime(
                pickup_deadline_text,
                "%m/%d/%Y %H:%M",
            )

        except ValueError as exc:

            raise ValueError(
                "Invalid pickup_deadline format: "
                f"{pickup_deadline_text}"
            ) from exc

    # ---------------------------------------------------------------
    # Calendar timing
    #
    # The calendar block ends at the pickup deadline.
    # We use a one-hour window leading up to that deadline.
    # ---------------------------------------------------------------

    end_time = pickup_deadline

    start_time = (
        pickup_deadline
        - timedelta(hours=1)
    )

    # ---------------------------------------------------------------
    # Build event
    # ---------------------------------------------------------------

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
{pickup_deadline_text}

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
            "dateTime": (
                start_time.isoformat()
            ),
            "timeZone": "America/Los_Angeles",
        },

        "end": {
            "dateTime": (
                end_time.isoformat()
            ),
            "timeZone": "America/Los_Angeles",
        },

        "attendees": [],
    }

    # ---------------------------------------------------------------
    # Add volunteer as attendee
    # ---------------------------------------------------------------

    if volunteer_email:

        event["attendees"] = [
            {
                "email": volunteer_email,
                "displayName": volunteer_name,
            }
        ]

    # ---------------------------------------------------------------
    # Create Google Calendar event
    # ---------------------------------------------------------------

    created_event = (
        service.events()
        .insert(
            calendarId="primary",
            body=event,
            sendUpdates="all",
        )
        .execute()
    )

    # ---------------------------------------------------------------
    # Log result
    # ---------------------------------------------------------------

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