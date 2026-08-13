from app.services.calendar_service import get_calendar_service


EVENT_ID = "qj2cvd07fcs356b5hm2iaj632k"


service = get_calendar_service()

service.events().delete(
    calendarId="primary",
    eventId=EVENT_ID,
    sendUpdates="all",
).execute()

print("Old test calendar event deleted.")