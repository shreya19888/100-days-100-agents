from datetime import datetime
from typing import Any
import json
import os
import requests

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import supabase

from app.services.vapi_service import place_volunteer_call
from app.services.calendar_service import (
    create_volunteer_calendar_event,
)

from app.agents.community_intelligence_agent import (
    CommunityIntelligenceAgent,
)

from app.services.data_service import (
    create_community_request,
    create_donation,
    create_volunteer,
    get_donations,
    get_volunteers,
    get_community_requests,
)

from app.services.dispatch_service import (
    complete_dispatch_assignment,
    initiate_volunteer_call,
    mark_assignment_picked_up,
    notify_donor_volunteer_en_route,
    reassign_after_decline,
    record_volunteer_decline,
    resolve_volunteer,
    run_dispatch_outreach,
    run_dispatch_plan,
)
from app.services.assignment_status import (
    IN_TRANSIT_STATUSES,
    assignment_is_claimed,
    assignment_keeps_volunteer_busy,
)
from app.services.time_window import expiry_payload
from app.services.routing_service import coordinates_for_zip
from app.services.tls import tls_verify

load_dotenv()


app = FastAPI(
    title="Community Pilot AI",
    description=(
        "Multi-agent coordination platform for "
        "community food redistribution."
    ),
    version="0.2.0",
)


# -------------------------------------------------------------------
# CORS
# -------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------------
# Health
# -------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "message": "Welcome to Community Pilot AI",
        "service": "community-pilot-ai",
        "version": "0.2.0",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "community-pilot-ai",
    }


# -------------------------------------------------------------------
# Data endpoints
# -------------------------------------------------------------------

@app.get("/api/donations")
async def donations():
    records = get_donations()

    return {
        "count": len(records),
        "donations": records,
    }


@app.get("/api/volunteers")
async def volunteers():
    records = get_volunteers()

    return {
        "count": len(records),
        "volunteers": records,
    }


@app.get("/api/requests")
async def community_requests():
    records = get_community_requests()

    return {
        "count": len(records),
        "requests": records,
    }


# -------------------------------------------------------------------
# Community Intelligence
# -------------------------------------------------------------------

@app.get("/api/intelligence")
async def intelligence():
    """
    Coordination context for Community Pilot.

    Combines:
      - live food supply
      - live recorded demand
      - public homelessness snapshot
      - public shelter-system snapshot
      - current WeatherAPI conditions
      - OpenAI coordination intelligence

    Raw operational/public facts remain deterministic.
    OpenAI synthesizes those signals into a coordinator-facing
    recommendation.
    """

    # ---------------------------------------------------------------
    # Live Community Pilot food data
    # ---------------------------------------------------------------

    donations = get_donations()
    requests_data = get_community_requests()

    meals_available = 0

    for donation in donations:
        value = donation.get(
            "approximately_how_many_meals_or_servings_are_available",
            donation.get("meals", 0),
        )

        try:
            meals_available += int(value or 0)
        except (TypeError, ValueError):
            pass

    meals_requested = 0

    for request in requests_data:
        value = request.get(
            "approximately_how_many_meals_are_needed",
            request.get("meals", 0),
        )

        try:
            meals_requested += int(value or 0)
        except (TypeError, ValueError):
            pass

    # ---------------------------------------------------------------
    # Supply
    # ---------------------------------------------------------------

    supply = {
        "meals_available": meals_available,
        "donation_count": len(donations),
    }

    # ---------------------------------------------------------------
    # Demand
    # ---------------------------------------------------------------

    demand = {
        "meals_requested": meals_requested,
        "request_count": len(requests_data),
    }

    # ---------------------------------------------------------------
    # Food balance
    # ---------------------------------------------------------------

    gap = meals_available - meals_requested

    if gap < 0:
        pressure = "HIGH"
    elif gap <= 50:
        pressure = "MODERATE"
    else:
        pressure = "LOW"

    food_balance = {
        "gap": gap,
        "pressure": pressure,
    }

    expiring_donations = []

    for donation in get_donations():
        expiry = expiry_payload(donation)
        minutes = expiry.get("minutes_remaining")

        if minutes is None or minutes < 0 or minutes > 180:
            continue

        expiring_donations.append(
            {
                "id": donation.get("id"),
                "name": donation.get("restaurant_name"),
                "meals": donation.get("meals"),
                "city": donation.get("city"),
                "pickup_deadline": donation.get("pickup_deadline"),
                "minutes_remaining": minutes,
            }
        )

    expiring_donations.sort(
        key=lambda item: item.get("minutes_remaining") or 9999
    )
    expiring_donations = expiring_donations[:5]

    # ---------------------------------------------------------------
    # Public San Francisco homelessness snapshot
    #
    # Existing Community Pilot source:
    # 2024 SF HSH Point-in-Time Count
    # ---------------------------------------------------------------

    pit_count = 8323
    unsheltered_count = 4354
    sheltered_count = pit_count - unsheltered_count

    community_need = {
        "location": "San Francisco",
        "pit_count": pit_count,
        "unsheltered_count": unsheltered_count,
        "sheltered_count": sheltered_count,
        "data_year": 2024,
        "signal": "HIGH",
        "source": (
            "San Francisco HSH 2024 Point-in-Time Count"
        ),
        "source_type": "historical_public_snapshot",
    }

    # ---------------------------------------------------------------
    # Public shelter-system snapshot
    #
    # This is NOT real-time vacancy.
    # ---------------------------------------------------------------

    shelter_system = {
        "year_round_beds": 3613,
        "occupancy_rate": 90,
        "snapshot_date": "2026-04-30",
        "source": (
            "San Francisco HSH / Homelessness Oversight Commission "
            "public shelter-system reporting"
        ),
        "source_type": "historical_public_snapshot",
    }

    # ---------------------------------------------------------------
    # WeatherAPI
    # ---------------------------------------------------------------

    weather_api_key = (os.getenv("WEATHER_API_KEY") or "").strip()

    weather_location = os.getenv(
        "WEATHER_LOCATION",
        "San Francisco",
    )

    weather = {
        "status": "not_configured",
        "location": weather_location,
    }

    if weather_api_key:
        try:
            weather_response = requests.get(
                "https://api.weatherapi.com/v1/current.json",
                params={
                    "key": weather_api_key,
                    "q": weather_location,
                    "aqi": "no",
                    "alerts": "yes",
                },
                timeout=8,
                verify=tls_verify(),
            )

            if weather_response.ok:
                weather_data = weather_response.json()

                current = (
                    weather_data.get("current")
                    or {}
                )

                location = (
                    weather_data.get("location")
                    or {}
                )

                alerts = (
                    weather_data.get("alerts", {})
                    .get("alert", [])
                    or []
                )

                weather = {
                    "status": "ok",
                    "location": location.get(
                        "name",
                        weather_location,
                    ),
                    "temperature_f": current.get(
                        "temp_f"
                    ),
                    "feels_like_f": current.get(
                        "feelslike_f"
                    ),
                    "condition": (
                        current.get("condition", {})
                        .get("text")
                    ),
                    "wind_mph": current.get(
                        "wind_mph"
                    ),
                    "precipitation_in": current.get(
                        "precip_in"
                    ),
                    "humidity": current.get(
                        "humidity"
                    ),
                    "last_updated": current.get(
                        "last_updated"
                    ),
                    "alert_count": len(alerts),
                }

            else:
                weather = {
                    "status": "error",
                    "location": weather_location,
                    "error": (
                        f"WeatherAPI returned "
                        f"{weather_response.status_code}"
                    ),
                }

        except Exception as error:
            print("=== WEATHER API ERROR ===")
            print(repr(error))

            weather = {
                "status": "error",
                "location": weather_location,
                "error": str(error),
            }

    # ---------------------------------------------------------------
    # OpenAI coordination intelligence
    # ---------------------------------------------------------------

    try:
        intelligence_agent = CommunityIntelligenceAgent()

        coordination_signal = intelligence_agent.analyze(
            supply=supply,
            demand=demand,
            food_balance=food_balance,
            community_need=community_need,
            shelter_system=shelter_system,
            weather=weather,
            expiring_donations=expiring_donations,
        )

    except Exception as error:
        print("=== COMMUNITY INTELLIGENCE ERROR ===")
        print(repr(error))

        coordination_signal = {
            "priority": pressure,
            "headline": (
                "Operational coordination signal"
            ),
            "recommendation": (
                "Continue matching available food "
                "to current community requests."
            ),
            "rationale": (
                "AI coordination intelligence is "
                "temporarily unavailable."
            ),
            "signals_considered": [
                "food supply",
                "recorded demand",
                "community need",
            ],
            "model": None,
            "source": "Community Pilot fallback",
        }

    return {
        "supply": supply,
        "demand": demand,
        "food_balance": food_balance,
        "community_need": community_need,
        "shelter_system": shelter_system,
        "weather": weather,
        "expiring_donations": expiring_donations,
        "coordination_signal": coordination_signal,
    }


# -------------------------------------------------------------------
# Dashboard
# -------------------------------------------------------------------

@app.get("/api/dashboard")
async def dashboard():
    """
    Return the data needed by the Community Pilot dashboard.

    The dashboard combines:
        Food Donation
        Food Request
        Volunteer Signup
        Dispatch Assignment

    into a single frontend-friendly payload.
    """

    donations_response = (
        supabase
        .table("Food Donation")
        .select("*")
        .execute()
    )

    requests_response = (
        supabase
        .table("Food Request")
        .select("*")
        .execute()
    )

    volunteers_response = (
        supabase
        .table("Volunteer Signup")
        .select("*")
        .execute()
    )

    assignments_response = (
        supabase
        .table("Dispatch Assignment")
        .select("*")
        .execute()
    )

    donations = donations_response.data or []
    requests = requests_response.data or []
    volunteers = volunteers_response.data or []
    assignments = assignments_response.data or []

    donation_lookup: dict[str, Any] = {}
    request_lookup: dict[str, Any] = {}
    volunteer_lookup: dict[str, Any] = {}

    for donation in donations:
        for key in (
            donation.get("whalesync_postgres_id"),
            donation.get("google_sheets_record_id"),
        ):
            if key:
                donation_lookup[str(key)] = donation

    for request in requests:
        for key in (
            request.get("whalesync_postgres_id"),
            request.get("google_sheets_record_id"),
        ):
            if key:
                request_lookup[str(key)] = request

    for volunteer in volunteers:
        for key in (
            volunteer.get("whalesync_postgres_id"),
            volunteer.get("google_sheets_record_id"),
        ):
            if key:
                volunteer_lookup[str(key)] = volunteer

    claimed_donation_ids = {
        str(assignment.get("donation_id"))
        for assignment in assignments
        if assignment.get("donation_id")
        and assignment_is_claimed(assignment)
        and str(assignment.get("volunteer_id") or "") in volunteer_lookup
    }

    declined_donation_ids = {
        str(assignment.get("donation_id"))
        for assignment in assignments
        if assignment.get("donation_id")
        and (
            (assignment.get("volunteer_outcome") or "").lower()
            == "declined"
            or (assignment.get("status") or "").lower()
            in ("declined", "needs_reassignment")
        )
    }

    meals_at_donor = 0

    for donation in donations:
        donation_id = str(
            donation.get("whalesync_postgres_id") or ""
        )

        if not donation_id or donation_id in claimed_donation_ids:
            continue

        value = donation.get(
            "approximately_how_many_meals_or_servings_are_available",
            0,
        )

        try:
            meals_at_donor += int(value or 0)
        except (TypeError, ValueError):
            pass

    meals_in_transit = sum(
        assignment.get("meals_assigned", 0) or 0
        for assignment in assignments
        if (assignment.get("status") or "").lower() in IN_TRANSIT_STATUSES
    )

    meals_delivered = sum(
        assignment.get("meals_assigned", 0) or 0
        for assignment in assignments
        if assignment.get("status") in [
            "delivered",
            "completed",
        ]
    )

    active_dispatches = sum(
        1
        for assignment in assignments
        if assignment_keeps_volunteer_busy(assignment)
    )

    enriched_assignments = []

    for assignment in assignments:

        donation_id = str(
            assignment.get("donation_id") or ""
        )

        request_id = str(
            assignment.get("request_id") or ""
        )

        volunteer_id = str(
            assignment.get("volunteer_id") or ""
        )

        donation = donation_lookup.get(
            donation_id
        )

        request = request_lookup.get(
            request_id
        )

        volunteer = volunteer_lookup.get(
            volunteer_id
        )

        donor_name = None
        donor_contact = None

        if donation:
            donor_name = donation.get(
                "restaurant_business_name"
            )

            donor_contact = donation.get(
                "contact_name"
            )

        recipient_name = None
        recipient_contact = None

        if request:
            recipient_name = request.get(
                "organization_name"
            )

            recipient_contact = request.get(
                "contact_name"
            )

        volunteer_name = None
        volunteer_email = None
        volunteer_phone = None

        if volunteer:
            volunteer_name = volunteer.get(
                "full_name"
            )

            volunteer_email = volunteer.get(
                "email"
            )

            volunteer_phone = volunteer.get(
                "phone_number"
            )

        enriched_assignment = {
            **assignment,

            "donor": {
                "name": donor_name,
                "contact": donor_contact,
            },

            "recipient": {
                "name": recipient_name,
                "contact": recipient_contact,
            },

            "volunteer": {
                "name": volunteer_name,
                "email": volunteer_email,
                "phone": volunteer_phone,
            },

            **expiry_payload(
                {
                    "pickup_deadline": assignment.get("pickup_deadline")
                    or (
                        donation.get(
                            "what_is_the_latest_time_the_food_can_be_picked_up"
                        )
                        if donation
                        else None
                    ),
                    "created_at": assignment.get("created_at")
                    or (
                        donation.get("timestamp") if donation else None
                    ),
                }
            ),

            "route": {
                "volunteer": coordinates_for_zip(
                    volunteer.get("starting_location_zip_code")
                    if volunteer
                    else None
                ),
                "pickup": coordinates_for_zip(
                    donation.get("zip_code") if donation else None
                ),
                "delivery": coordinates_for_zip(
                    request.get("zip_code") if request else None
                ),
            },

            "workflow": {
                "form_submitted": bool(
                    assignment.get("donation_id")
                ),

                "donation_logged": bool(
                    donation
                ),

                "match_found": bool(
                    assignment.get("id")
                ),

                "ai_call_placed": bool(
                    assignment.get("vapi_call_id")
                ),

                "pickup_confirmed": (
                    (assignment.get("status") or "").lower()
                    in ("picked_up", "in_transit", "delivered", "completed")
                ),

                "delivery_scheduled": bool(
                    assignment.get(
                        "calendar_event_id"
                    )
                ),

                "delivery_completed": (
                    assignment.get("status")
                    in [
                        "delivered",
                        "completed",
                    ]
                ),
            },
        }

        enriched_assignments.append(
            enriched_assignment
        )

    # ---------------------------------------------------------------
    # Sort recent assignments newest-first.
    #
    # Prefer updated_at because volunteer outreach, call status,
    # acceptance/decline, and calendar changes update this timestamp.
    # Fall back to created_at for older records.
    # ---------------------------------------------------------------

    recent_assignments = sorted(
        enriched_assignments,
        key=lambda x: (
            x.get("updated_at")
            or x.get("created_at")
            or ""
        ),
        reverse=True,
    )[:50]

    # ---------------------------------------------------------------
    # Volunteer Network
    #
    # Return the actual volunteer signup records, not just the count.
    # This allows the frontend to show newly registered volunteers
    # even when they have not yet been matched to a dispatch.
    #
    # The newest signup/activity appears first.
    #
    # Returns the FULL sorted list — the frontend is responsible for
    # scrolling. Do not truncate here.
    # ---------------------------------------------------------------

    volunteers_list = sorted(
        volunteers,
        key=lambda volunteer: (
            volunteer.get("timestamp")
            or volunteer.get("created_at")
            or volunteer.get("updated_at")
            or ""
        ),
        reverse=True,
    )

    # ---------------------------------------------------------------
    # Unified Rescue Queue
    #
    # Include dispatch assignments plus brand-new donations that
    # have not been matched yet. New rescues therefore appear
    # immediately after the donation is recorded.
    #
    # Returns the FULL sorted queue — the frontend is responsible for
    # scrolling. Do not truncate here.
    # ---------------------------------------------------------------

    assigned_donation_ids = claimed_donation_ids

    rescue_queue = [
        assignment
        for assignment in enriched_assignments
        if (assignment.get("status") or "").lower()
        not in ("declined", "needs_reassignment")
        and (assignment.get("volunteer_outcome") or "").lower()
        != "declined"
        and (
            not assignment.get("volunteer_id")
            or str(assignment.get("volunteer_id")) in volunteer_lookup
        )
    ]

    for donation in donations:
        donation_id = str(
            donation.get("whalesync_postgres_id") or ""
        )

        if not donation_id or donation_id in assigned_donation_ids:
            continue

        try:
            meals_available = int(
                donation.get(
                    "approximately_how_many_meals_or_servings_are_available",
                    0,
                )
            )
        except (TypeError, ValueError):
            meals_available = 0

        match_pending = donation_id in declined_donation_ids

        rescue_queue.append({
            "id": f"donation-{donation_id}",
            "status": (
                "match_pending" if match_pending else "needs_dispatch"
            ),
            "volunteer_outcome": None,
            "meals_assigned": meals_available,
            "pickup_address": donation.get("pickup_address"),
            "pickup_city": donation.get("city"),
            "pickup_deadline": donation.get(
                "what_is_the_latest_time_the_food_can_be_picked_up"
            ),
            "created_at": donation.get("timestamp"),
            "updated_at": donation.get("timestamp"),
            **expiry_payload(
                {
                    "pickup_deadline": donation.get(
                        "what_is_the_latest_time_the_food_can_be_picked_up"
                    ),
                    "created_at": donation.get("timestamp"),
                }
            ),
            "route": {
                "volunteer": None,
                "pickup": coordinates_for_zip(donation.get("zip_code")),
                "delivery": None,
            },
            "donor": {
                "name": donation.get("restaurant_business_name"),
                "contact": donation.get("contact_name"),
            },
            "recipient": {
                "name": None,
                "contact": None,
            },
            "volunteer": {
                "name": None,
                "email": None,
                "phone": None,
            },
            "workflow": {
                "form_submitted": True,
                "donation_logged": True,
                "match_found": False,
                "ai_call_placed": False,
                "pickup_confirmed": False,
                "delivery_scheduled": False,
                "delivery_completed": False,
            },
        })

    rescue_queue = sorted(
        rescue_queue,
        key=lambda item: (
            0 if item.get("minutes_remaining") is not None else 1,
            item.get("minutes_remaining")
            if item.get("minutes_remaining") is not None
            else 9999,
            str(item.get("updated_at") or item.get("created_at") or ""),
        ),
    )

    return {
        "stats": {
            "meals_rescued": meals_delivered,
            "meals_at_donor": meals_at_donor,
            "meals_in_transit": meals_in_transit,
            "meals_delivered": meals_delivered,
            "active_dispatches": active_dispatches,
            "volunteers": len(volunteers),
        },

        "counts": {
            "donations": len(donations),
            "requests": len(requests),
            "volunteers": len(volunteers),
            "assignments": len(assignments),
        },

        "recent_assignments": recent_assignments,

        "rescue_queue": rescue_queue,

        # Full volunteer registry for the Volunteer Network UI.
        # New volunteers appear here immediately after signup.
        "volunteers_list": volunteers_list,
    }


# -------------------------------------------------------------------
# Volunteer Call Details
# -------------------------------------------------------------------

@app.get("/api/volunteer-call/{call_id}")
async def volunteer_call(call_id: str):

    api_key = os.getenv("VAPI_API_KEY")

    if not api_key:
        return {
            "status": "not_configured",
            "call_id": call_id,
            "transcript": "",
            "messages": [],
        }

    try:
        response = requests.get(
            f"https://api.vapi.ai/call/{call_id}",
            headers={
                "Authorization": f"Bearer {api_key}",
            },
            timeout=10,
            verify=tls_verify(),
        )

        if not response.ok:
            return {
                "status": "vapi_error",
                "call_id": call_id,
                "transcript": "",
                "messages": [],
                "error": response.text,
            }

        call = response.json()

        artifact = call.get("artifact") or {}

        return {
            "call_id": call.get("id"),
            "status": call.get("status"),
            "ended_reason": call.get("endedReason"),
            "transcript": artifact.get("transcript")
            or call.get("transcript", ""),
            "messages": (
                artifact.get("messages")
                or call.get("messages")
                or []
            ),
        }

    except Exception as error:
        print("=== VOLUNTEER CALL FETCH ERROR ===")
        print(repr(error))

        return {
            "status": "error",
            "call_id": call_id,
            "transcript": "",
            "messages": [],
            "error": str(error),
        }


# -------------------------------------------------------------------
# Live Activity
# -------------------------------------------------------------------

@app.get("/api/activity")
async def activity():

    assignments_response = (
        supabase
        .table("Dispatch Assignment")
        .select("*")
        .execute()
    )

    assignments = assignments_response.data or []

    donations_response = (
        supabase
        .table("Food Donation")
        .select("*")
        .execute()
    )

    donations = donations_response.data or []

    volunteers_response = (
        supabase
        .table("Volunteer Signup")
        .select("*")
        .execute()
    )

    volunteers = volunteers_response.data or []

    donation_lookup = {
        str(donation.get("whalesync_postgres_id")): donation
        for donation in donations
        if donation.get("whalesync_postgres_id")
    }

    volunteer_lookup = {
        str(volunteer.get("whalesync_postgres_id")): volunteer
        for volunteer in volunteers
        if volunteer.get("whalesync_postgres_id")
    }

    events = []

    for assignment in assignments:

        assignment_id = assignment.get("id")

        donation = donation_lookup.get(
            str(assignment.get("donation_id"))
        )

        volunteer = volunteer_lookup.get(
            str(assignment.get("volunteer_id"))
        )

        donor_name = (
            donation.get("restaurant_business_name")
            if donation
            else "Food donor"
        )

        volunteer_name = (
            volunteer.get("full_name")
            if volunteer
            else "Volunteer"
        )

        meals = assignment.get(
            "meals_assigned",
            0,
        )

        created_at = (
            assignment.get("created_at")
            or assignment.get("updated_at")
        )

        updated_at = (
            assignment.get("updated_at")
            or created_at
        )

        if assignment.get("donation_id"):

            events.append(
                {
                    "id": f"{assignment_id}-donation",
                    "assignment_id": assignment_id,
                    "type": "donation",
                    "icon": "database",
                    "title": "Donation received",
                    "description": (
                        f"{donor_name} · "
                        f"{meals} meals logged"
                    ),
                    "timestamp": created_at,
                    "status": "complete",
                }
            )

        if assignment.get("id"):

            destination = (
                assignment.get(
                    "delivery_organization"
                )
                or "Community destination"
            )

            events.append(
                {
                    "id": f"{assignment_id}-match",
                    "assignment_id": assignment_id,
                    "type": "match",
                    "icon": "sparkles",
                    "title": "AI match found",
                    "description": (
                        f"{meals} meals matched → "
                        f"{destination}"
                    ),
                    "timestamp": created_at,
                    "status": "complete",
                }
            )

        if assignment.get("vapi_call_id"):

            events.append(
                {
                    "id": f"{assignment_id}-call",
                    "assignment_id": assignment_id,
                    "type": "call",
                    "icon": "phone",
                    "title": "AI volunteer call connected",
                    "description": (
                        f"Community Pilot contacted "
                        f"{volunteer_name}"
                    ),
                    "timestamp": updated_at,
                    "status": "complete",
                }
            )

        outcome = assignment.get(
            "volunteer_outcome"
        )

        if outcome == "accepted":

            events.append(
                {
                    "id": f"{assignment_id}-accepted",
                    "assignment_id": assignment_id,
                    "type": "accepted",
                    "icon": "check",
                    "title": "Volunteer accepted",
                    "description": (
                        f"{volunteer_name} confirmed "
                        f"the assignment"
                    ),
                    "timestamp": updated_at,
                    "status": "complete",
                }
            )

        elif outcome == "declined":

            events.append(
                {
                    "id": f"{assignment_id}-declined",
                    "assignment_id": assignment_id,
                    "type": "declined",
                    "icon": "x",
                    "title": "Volunteer declined",
                    "description": (
                        f"{volunteer_name} declined "
                        f"the assignment"
                    ),
                    "timestamp": updated_at,
                    "status": "declined",
                }
            )

        if assignment.get("calendar_event_id"):

            events.append(
                {
                    "id": f"{assignment_id}-calendar",
                    "assignment_id": assignment_id,
                    "type": "calendar",
                    "icon": "calendar",
                    "title": "Calendar event created",
                    "description": (
                        f"Pickup scheduled for "
                        f"{donor_name}"
                    ),
                    "timestamp": updated_at,
                    "status": "complete",
                }
            )

        if assignment.get("status") in [
            "delivered",
            "completed",
        ]:

            destination = (
                assignment.get(
                    "delivery_organization"
                )
                or "Community destination"
            )

            events.append(
                {
                    "id": f"{assignment_id}-delivery",
                    "assignment_id": assignment_id,
                    "type": "delivery",
                    "icon": "truck",
                    "title": "Delivery completed",
                    "description": (
                        f"{meals} meals delivered → "
                        f"{destination}"
                    ),
                    "timestamp": updated_at,
                    "status": "complete",
                }
            )

    events = sorted(
        events,
        key=lambda event: event.get("timestamp") or "",
        reverse=True,
    )

    return {
        "count": len(events),
        "events": events[:20],
    }


# -------------------------------------------------------------------
# Voice AI — Food Donation Intake
# -------------------------------------------------------------------

@app.post("/api/voice/donation")
async def create_voice_donation(
    payload: dict[str, Any],
):

    print("=== VAPI DONATION REQUEST ===")
    print(payload)

    message = payload.get("message", {})

    print("=== MESSAGE TYPE ===")
    print(message.get("type"))

    tool_calls = message.get("toolCallList", [])

    print("=== TOOL CALL LIST ===")
    print(tool_calls)

    if not tool_calls:
        print("=== NO TOOL CALLS FOUND ===")

        return {
            "results": []
        }

    results = []

    for tool_call in tool_calls:

        tool_call_id = tool_call.get("id")
        function = tool_call.get("function", {})
        function_name = function.get("name")
        arguments = function.get("arguments", {})

        if isinstance(arguments, str):
            try:
                arguments = json.loads(arguments)
            except json.JSONDecodeError:
                arguments = {}

        print("=== TOOL CALL ID ===")
        print(tool_call_id)

        print("=== FUNCTION NAME ===")
        print(function_name)

        print("=== ARGUMENTS ===")
        print(arguments)

        try:
            if function_name == "create_food_donation":
                create_donation(arguments)
                result_text = (
                    "The food donation was successfully recorded "
                    "in Community Pilot."
                )
            elif function_name in (
                "create_food_request",
                "create_community_request",
            ):
                create_community_request(arguments)
                result_text = (
                    "The food request was successfully recorded "
                    "in Community Pilot."
                )
            elif function_name in (
                "create_volunteer",
                "create_volunteer_signup",
            ):
                create_volunteer(arguments)
                result_text = (
                    "The volunteer was successfully registered "
                    "with Community Pilot."
                )
            else:
                print("=== UNKNOWN TOOL ===")
                print(function_name)
                result_text = "Unknown tool."

            results.append(
                {
                    "toolCallId": tool_call_id,
                    "result": result_text,
                }
            )

        except Exception as error:
            print("=== VOICE TOOL ERROR ===")
            print(repr(error))
            results.append(
                {
                    "toolCallId": tool_call_id,
                    "result": (
                        "That record could not be saved right now."
                    ),
                }
            )

    print("=== VAPI RESPONSE ===")
    print(results)

    return {
        "results": results
    }


# -------------------------------------------------------------------
# Dispatch orchestration
# -------------------------------------------------------------------

@app.post("/api/dispatch")
async def dispatch():
    return run_dispatch_plan()


# -------------------------------------------------------------------
# Volunteer Outreach
# -------------------------------------------------------------------

@app.post("/api/dispatch/outreach")
async def dispatch_outreach():
    return run_dispatch_outreach()


# -------------------------------------------------------------------
# Test outbound call
# -------------------------------------------------------------------

@app.post("/api/test-call")
async def test_call():

    volunteer = {
        "name": "Shreya",
        "phone": "+14083061143",
    }

    assignment = {
        "meals_assigned": 5,
        "pickup_address": "100 Market Street",
        "pickup_city": "San Jose",
        "delivery_organization": "Community Resource Center",
        "delivery_address": "200 Market Street",
        "delivery_city": "San Jose",
        "pickup_deadline": "8:00 PM",
        "delivery_instructions": (
            "Please call upon arrival."
        ),
    }

    result = place_volunteer_call(
        volunteer=volunteer,
        assignment=assignment,
    )

    return {
        "status": "call_initiated",
        "vapi": result,
    }


# -------------------------------------------------------------------
# Place volunteer call for a specific dispatch assignment
# -------------------------------------------------------------------

@app.post("/api/dispatch/outreach/{assignment_id}/call")
async def call_volunteer_for_assignment(
    assignment_id: str,
):

    response = (
        supabase
        .table("Dispatch Assignment")
        .select("*")
        .eq("id", assignment_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        return {
            "status": "assignment_not_found",
            "message": (
                "The dispatch assignment could not be found."
            ),
            "assignment_id": assignment_id,
        }

    assignment = response.data[0]

    volunteer = resolve_volunteer(assignment.get("volunteer_id"))

    if not volunteer:
        print("=== VOLUNTEER NOT FOUND FOR CALL ===")
        print(assignment.get("volunteer_id"))
        return {
            "status": "volunteer_not_found",
            "message": (
                "That volunteer is no longer in the registry. "
                "Run AI matching to assign someone else."
            ),
            "assignment_id": assignment_id,
            "volunteer_id": assignment.get("volunteer_id"),
        }

    contact = {
        "id": volunteer.get("id"),
        "name": volunteer.get("name") or volunteer.get("full_name"),
        "email": volunteer.get("email"),
        "phone": volunteer.get("phone") or volunteer.get("phone_number"),
    }

    if not contact["phone"]:
        return {
            "status": "missing_phone",
            "message": "That volunteer does not have a phone number.",
            "assignment_id": assignment_id,
            "volunteer_id": contact["id"],
        }

    call_result = initiate_volunteer_call(
        assignment,
        contact,
    )

    if call_result["call_status"] == "missing_phone":
        return {
            "status": "missing_phone",
            "message": "That volunteer does not have a phone number.",
            "assignment_id": assignment_id,
            "volunteer_id": contact["id"],
        }

    if call_result["call_status"] == "call_failed":
        return {
            "status": "call_failed",
            "message": (
                call_result.get("call_error")
                or "The volunteer call could not be placed."
            ),
            "assignment_id": assignment_id,
            "error": call_result.get("call_error"),
        }

    return {
        "status": "call_initiated",
        "assignment_id": assignment_id,
        "volunteer": {
            "id": contact["id"],
            "name": contact["name"],
            "phone": contact["phone"],
        },
        "vapi": call_result.get("vapi"),
        "vapi_call_id": call_result.get("vapi_call_id"),
    }


# -------------------------------------------------------------------
# Confirm delivery
# -------------------------------------------------------------------

@app.post("/api/dispatch/{assignment_id}/complete")
async def complete_assignment(assignment_id: str):
    return complete_dispatch_assignment(assignment_id)


@app.post("/api/dispatch/{assignment_id}/pickup")
async def pickup_assignment(assignment_id: str):
    return mark_assignment_picked_up(assignment_id)


@app.post("/api/dispatch/{assignment_id}/decline")
async def decline_assignment(assignment_id: str):
    return record_volunteer_decline(assignment_id)


# -------------------------------------------------------------------
# Volunteer response webhook
# -------------------------------------------------------------------

@app.post("/api/voice/volunteer-response")
async def volunteer_response(
    payload: dict[str, Any],
):

    print("=== VAPI VOLUNTEER RESPONSE ===")
    print(payload)

    message = payload.get("message", {})

    print("=== MESSAGE TYPE ===")
    print(message.get("type"))

    if message.get("type") != "end-of-call-report":
        return {
            "status": "ignored",
            "message_type": message.get("type"),
        }

    artifact = message.get("artifact", {})

    messages = artifact.get(
        "messages",
        [],
    )

    transcript = artifact.get(
        "transcript",
        "",
    )

    print("=== TRANSCRIPT ===")
    print(transcript)

    variable_values = (
        message
        .get("call", {})
        .get("assistantOverrides", {})
        .get("variableValues", {})
    )

    assignment_id = variable_values.get(
        "assignment_id"
    )

    if variable_values.get("call_role") == "donor_notify":
        return {
            "status": "ignored",
            "reason": "donor_notify",
        }

    print("=== ASSIGNMENT ID ===")
    print(assignment_id)

    if not assignment_id:

        print(
            "WARNING: No assignment_id found."
        )

        return {
            "status": "received",
            "volunteer_outcome": "uncertain",
            "error": "assignment_id missing",
        }

    outcome = "uncertain"

    for i, msg in enumerate(messages):

        if msg.get("role") != "bot":
            continue

        bot_text = msg.get(
            "message",
            "",
        ).lower()

        if (
            "would you be available to take "
            "this assignment"
            in bot_text
        ):

            for next_msg in messages[i + 1:]:

                if next_msg.get("role") == "user":

                    response = (
                        next_msg.get(
                            "message",
                            "",
                        )
                        .strip()
                        .lower()
                    )

                    print(
                        "=== VOLUNTEER RESPONSE ==="
                    )

                    print(
                        response
                    )

                    if any(
                        phrase in response
                        for phrase in [
                            "yes",
                            "yeah",
                            "yep",
                            "i can",
                            "i can pick",
                            "i'd be happy",
                            "i would be happy",
                            "sure",
                            "absolutely",
                        ]
                    ):
                        outcome = "accepted"

                    elif any(
                        phrase in response
                        for phrase in [
                            "no",
                            "nope",
                            "i can't",
                            "i cannot",
                            "not available",
                            "not today",
                        ]
                    ):
                        outcome = "declined"

                    break

            break

    ended_reason = str(
        message.get("endedReason")
        or message.get("call", {}).get("endedReason")
        or ""
    ).lower()

    user_spoke = any(
        (msg.get("role") == "user" and str(msg.get("message") or "").strip())
        for msg in messages
    )

    no_answer_markers = (
        "did-not-answer",
        "no-answer",
        "voicemail",
        "customer-busy",
        "busy",
        "silence-timed-out",
    )

    if outcome == "uncertain" and (
        not user_spoke
        or any(marker in ended_reason for marker in no_answer_markers)
    ):
        outcome = "no_answer"

    print(
        "=== VOLUNTEER OUTCOME ==="
    )

    print(
        outcome
    )

    assignment_response = (
        supabase
        .table("Dispatch Assignment")
        .select("*")
        .eq("id", assignment_id)
        .single()
        .execute()
    )

    assignment = assignment_response.data

    if not assignment:
        raise RuntimeError(
            f"Dispatch assignment not found: "
            f"{assignment_id}"
        )

    status_map = {
        "accepted": "accepted",
        "declined": "needs_reassignment",
        "no_answer": "needs_reassignment",
        "uncertain": "outreach_uncertain",
    }

    update_data = {
        "status": status_map.get(
            outcome,
            "outreach_uncertain",
        ),
        "volunteer_outcome": outcome,
        "updated_at": datetime.now().isoformat(),
    }

    if outcome == "accepted":

        volunteer_id = assignment.get(
            "volunteer_id"
        )

        volunteer_response = (
            supabase
            .table("Volunteer Signup")
            .select("*")
            .eq(
                "whalesync_postgres_id",
                volunteer_id,
            )
            .single()
            .execute()
        )

        volunteer_row = volunteer_response.data

        if not volunteer_row:
            raise RuntimeError(
                f"Volunteer not found: "
                f"{volunteer_id}"
            )

        volunteer = {
            "id": volunteer_row.get(
                "whalesync_postgres_id"
            ),
            "name": volunteer_row.get(
                "full_name"
            ),
            "email": volunteer_row.get(
                "email"
            ),
            "phone": volunteer_row.get(
                "phone_number"
            ),
        }

        print("=== VOLUNTEER ===")
        print(volunteer)

        existing_event_id = assignment.get(
            "calendar_event_id"
        )

        if existing_event_id:

            print(
                "=== CALENDAR EVENT ALREADY EXISTS ==="
            )
            print(existing_event_id)

        else:

            print(
                "=== CREATING GOOGLE CALENDAR EVENT ==="
            )

            calendar_event = (
                create_volunteer_calendar_event(
                    volunteer=volunteer,
                    assignment=assignment,
                )
            )

            update_data["calendar_event_id"] = (
                calendar_event.get("id")
            )
            update_data["calendar_event_url"] = (
                calendar_event.get("htmlLink")
            )

            print("=== CALENDAR EVENT CREATED ===")
            print(update_data["calendar_event_id"])
            print(update_data["calendar_event_url"])

        notify_donor_volunteer_en_route(assignment, volunteer)

    print("=== UPDATING DISPATCH ASSIGNMENT ===")
    print(update_data)

    updated_assignment = (
        supabase
        .table("Dispatch Assignment")
        .update(update_data)
        .eq("id", assignment_id)
        .execute()
    )

    print("=== DISPATCH ASSIGNMENT UPDATED ===")
    print(updated_assignment.data)

    reassignment = None

    if outcome in ("declined", "no_answer"):
        reassignment = reassign_after_decline(assignment)

        print("=== REASSIGNMENT ===")
        print(reassignment)

    return {
        "status": "received",
        "assignment_id": assignment_id,
        "volunteer_outcome": outcome,
        "calendar_event_id": update_data.get(
            "calendar_event_id"
        ),
        "calendar_event_url": update_data.get(
            "calendar_event_url"
        ),
        "reassignment": reassignment,
        "transcript": transcript,
    }