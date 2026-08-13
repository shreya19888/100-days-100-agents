from app.services.calendar_service import (
    create_volunteer_calendar_event,
)


volunteer = {
    "name": "Alex Demo",
    "email": "communitypilot96@gmail.com",
}


assignment = {
    "meals_assigned": 25,

    "pickup_address": "100 Market Street",
    "pickup_city": "San Jose",

    "pickup_deadline": "7:30 PM",

    "delivery_organization": (
        "Community Resource Center"
    ),

    "delivery_address": "200 Market Street",
    "delivery_city": "San Jose",

    "delivery_instructions": (
        "Please call upon arrival."
    ),
}


event = create_volunteer_calendar_event(
    volunteer,
    assignment,
)


print()
print("Calendar event created successfully!")
print()
print("Event ID:")
print(event.get("id"))
print()
print("Event link:")
print(event.get("htmlLink"))