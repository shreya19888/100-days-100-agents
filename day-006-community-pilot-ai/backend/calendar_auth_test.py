import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


SCOPES = [
    "https://www.googleapis.com/auth/calendar"
]


def main():
    creds = None

    # ---------------------------------------------------------------
    # Reuse previously authorized credentials
    # ---------------------------------------------------------------

    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file(
            "token.json",
            SCOPES,
        )

    # ---------------------------------------------------------------
    # Authenticate if necessary
    # ---------------------------------------------------------------

    if not creds or not creds.valid:

        if creds and creds.expired and creds.refresh_token:

            creds.refresh(Request())

        else:

            flow = (
                InstalledAppFlow
                .from_client_secrets_file(
                    "credentials.json",
                    SCOPES,
                )
            )

            creds = flow.run_local_server(
                port=0
            )

        # Save credentials
        with open(
            "token.json",
            "w",
        ) as token:

            token.write(
                creds.to_json()
            )

    # ---------------------------------------------------------------
    # Test Calendar API access
    # ---------------------------------------------------------------

    service = build(
        "calendar",
        "v3",
        credentials=creds,
    )

    calendar = service.calendars().get(
        calendarId="primary"
    ).execute()

    print()
    print("====================================")
    print(" GOOGLE CALENDAR AUTHENTICATION OK ")
    print("====================================")
    print()
    print("Calendar:")
    print(calendar.get("summary"))
    print()
    print("Email:")
    print(calendar.get("id"))
    print()


if __name__ == "__main__":
    main()