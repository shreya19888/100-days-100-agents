from datetime import datetime
from typing import Any
import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import supabase

from app.services.vapi_service import place_volunteer_call
from app.services.calendar_service import (
    create_volunteer_calendar_event,
)

from app.agents.coordinator import CoordinatorAgent
from app.agents.matching_agent import MatchingAgent
from app.agents.routing_agent import RoutingAgent
from app.agents.volunteer_outreach_agent import (
    VolunteerOutreachAgent,
)

from app.services.data_service import (
    create_donation,
    get_donations,
    get_volunteers,
    get_community_requests,
    create_dispatch_assignment,
    update_dispatch_assignment,
)


app = FastAPI(
    title="Community Pilot AI",
    description=(
        "Multi-agent coordination platform for "
        "community food redistribution."
    ),
    version="0.2.0",
)

# -------------------------
# CORS
# -------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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
async def community_intelligence():
    """
    Return community-level signals for the coordinator.

    This first version uses live Supabase data for supply/demand
    and a clearly labeled public community-need signal.
    External weather data will be added next.
    """

    # ---------------------------------------------------------------
    # Fetch food supply
    # ---------------------------------------------------------------

    donations_response = (
        supabase
        .table("Food Donation")
        .select(
            "whalesync_postgres_id,"
            "approximately_how_many_meals_or_servings_are_available,"
            "city"
        )
        .execute()
    )

    donations = donations_response.data or []

    meals_available = 0

    for donation in donations:
        value = donation.get(
            "approximately_how_many_meals_or_servings_are_available",
            0,
        )

        try:
            meals_available += int(value)
        except (TypeError, ValueError):
            pass

    # ---------------------------------------------------------------
    # Fetch food demand
    # ---------------------------------------------------------------

    requests_response = (
        supabase
        .table("Food Request")
        .select(
            "whalesync_postgres_id,"
            "how_many_meals_are_currently_needed,"
            "city"
        )
        .execute()
    )

    requests = requests_response.data or []

    meals_requested = 0

    for request in requests:
        value = request.get(
            "how_many_meals_are_currently_needed",
            0,
        )

        try:
            meals_requested += int(value)
        except (TypeError, ValueError):
            pass

    # ---------------------------------------------------------------
    # Supply / demand signal
    # ---------------------------------------------------------------

    supply_gap = meals_available - meals_requested

    if supply_gap < 0:
        pressure = "HIGH"
    elif supply_gap < max(25, meals_requested * 0.20):
        pressure = "MODERATE"
    else:
        pressure = "LOW"

    # ---------------------------------------------------------------
    # Community need signal
    #
    # IMPORTANT:
    # This is a public historical snapshot, not live population data.
    # ---------------------------------------------------------------

    community_need = {
        "location": "San Francisco",
        "pit_count": 8323,
        "unsheltered_count": 4354,
        "data_year": 2024,
        "signal": "HIGH",
        "source": "San Francisco HSH 2024 Point-in-Time Count",
        "source_type": "historical_public_snapshot",
    }

    # ---------------------------------------------------------------
    # Coordinator signal
    # ---------------------------------------------------------------

    if pressure == "HIGH":
        coordination_signal = (
            "Demand currently exceeds available surplus food. "
            "Prioritize high-urgency requests and minimize "
            "pickup distance where possible."
        )
    elif pressure == "MODERATE":
        coordination_signal = (
            "Supply is available but should be allocated carefully "
            "against current community requests."
        )
    else:
        coordination_signal = (
            "Available surplus currently exceeds recorded demand. "
            "Continue matching donations to the highest-priority "
            "community requests."
        )

    return {
        "supply": {
            "meals_available": meals_available,
            "donation_count": len(donations),
        },
        "demand": {
            "meals_requested": meals_requested,
            "request_count": len(requests),
        },
        "food_balance": {
            "gap": supply_gap,
            "pressure": pressure,
        },
        "community_need": community_need,
        "weather": {
            "status": "not_configured",
            "location": "San Jose",
        },
        "coordination_signal": {
            "priority": pressure,
            "message": coordination_signal,
        },
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

    # ---------------------------------------------------------------
    # Fetch core tables
    # ---------------------------------------------------------------

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

    # ---------------------------------------------------------------
    # Build lookup dictionaries
    # ---------------------------------------------------------------

    donation_lookup = {
        str(donation.get("whalesync_postgres_id")): donation
        for donation in donations
        if donation.get("whalesync_postgres_id")
    }

    request_lookup = {
        str(request.get("whalesync_postgres_id")): request
        for request in requests
        if request.get("whalesync_postgres_id")
    }

    volunteer_lookup = {
        str(volunteer.get("whalesync_postgres_id")): volunteer
        for volunteer in volunteers
        if volunteer.get("whalesync_postgres_id")
    }

    # ---------------------------------------------------------------
    # Calculate impact
    # ---------------------------------------------------------------

    meals_rescued = 0

    for donation in donations:
        value = donation.get(
            "approximately_how_many_meals_or_servings_are_available",
            0,
        )

        try:
            meals_rescued += int(value)
        except (TypeError, ValueError):
            pass

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
        if assignment.get("status") not in [
            "delivered",
            "completed",
            "cancelled",
        ]
    )

    # ---------------------------------------------------------------
    # Enrich dispatch assignments
    # ---------------------------------------------------------------

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

        # -----------------------------------------------------------
        # Donor information
        # -----------------------------------------------------------

        donor_name = None
        donor_contact = None

        if donation:
            donor_name = donation.get(
                "restaurant_business_name"
            )

            donor_contact = donation.get(
                "contact_name"
            )

        # -----------------------------------------------------------
        # Recipient information
        # -----------------------------------------------------------

        recipient_name = None
        recipient_contact = None

        if request:
            recipient_name = request.get(
                "organization_name"
            )

            recipient_contact = request.get(
                "contact_name"
            )

        # -----------------------------------------------------------
        # Volunteer information
        # -----------------------------------------------------------

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

        # -----------------------------------------------------------
        # Build frontend-friendly assignment
        # -----------------------------------------------------------

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
                    assignment.get(
                        "volunteer_outcome"
                    )
                    == "accepted"
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
    # Sort newest assignments first
    # ---------------------------------------------------------------

    recent_assignments = sorted(
        enriched_assignments,
        key=lambda x: x.get("updated_at") or "",
        reverse=True,
    )[:10]

    # ---------------------------------------------------------------
    # Return dashboard payload
    # ---------------------------------------------------------------

    return {
        "stats": {
            "meals_rescued": meals_rescued,
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
    }

# -------------------------------------------------------------------
# Volunteer Call Details
# -------------------------------------------------------------------

@app.get("/api/volunteer-call/{call_id}")
async def volunteer_call(call_id: str):
    """
    Return the latest Vapi call state and transcript.

    The Vapi private API key stays server-side.
    """

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
            "transcript": artifact.get("transcript") or call.get(
                "transcript",
                "",
            ),
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
    """
    Return recent real workflow events for the dashboard.

    Events are derived from the current Dispatch Assignment
    records, so the frontend can poll this endpoint and show
    what Community Pilot has actually completed.
    """

    # ---------------------------------------------------------------
    # Fetch assignments
    # ---------------------------------------------------------------

    assignments_response = (
        supabase
        .table("Dispatch Assignment")
        .select("*")
        .execute()
    )

    assignments = assignments_response.data or []

    # ---------------------------------------------------------------
    # Fetch related records
    # ---------------------------------------------------------------

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

    # ---------------------------------------------------------------
    # Build lookups
    # ---------------------------------------------------------------

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

    # ---------------------------------------------------------------
    # Build activity events
    # ---------------------------------------------------------------

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

        # -----------------------------------------------------------
        # Donation received
        # -----------------------------------------------------------

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

        # -----------------------------------------------------------
        # AI match
        # -----------------------------------------------------------

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

        # -----------------------------------------------------------
        # Volunteer AI call
        # -----------------------------------------------------------

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

        # -----------------------------------------------------------
        # Volunteer response
        # -----------------------------------------------------------

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

        # -----------------------------------------------------------
        # Calendar event
        # -----------------------------------------------------------

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

        # -----------------------------------------------------------
        # Delivery
        # -----------------------------------------------------------

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

    # ---------------------------------------------------------------
    # Sort newest first
    # ---------------------------------------------------------------

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
    """
    Receives a create_food_donation tool call from Vapi,
    creates the donation in Supabase, and returns the
    tool result to Vapi.
    """

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

        print("=== TOOL CALL ID ===")
        print(tool_call_id)

        print("=== FUNCTION NAME ===")
        print(function_name)

        print("=== ARGUMENTS ===")
        print(arguments)

        # -----------------------------------------------------------
        # Create food donation
        # -----------------------------------------------------------

        if function_name == "create_food_donation":

            try:
                donation = create_donation(arguments)

                print("=== DONATION CREATED ===")
                print(donation)

                results.append(
                    {
                        "toolCallId": tool_call_id,
                        "result": (
                            "The food donation was successfully "
                            "recorded in Community Pilot."
                        ),
                    }
                )

            except Exception as error:

                print("=== DONATION ERROR ===")
                print(repr(error))

                results.append(
                    {
                        "toolCallId": tool_call_id,
                        "result": (
                            "The food donation could not be "
                            "recorded right now."
                        ),
                    }
                )

        # -----------------------------------------------------------
        # Unknown tool
        # -----------------------------------------------------------

        else:

            print("=== UNKNOWN TOOL ===")
            print(function_name)

            results.append(
                {
                    "toolCallId": tool_call_id,
                    "result": "Unknown tool.",
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

    # ---------------------------------------------------------------
    # 1. Load live data
    # ---------------------------------------------------------------

    donations = get_donations()
    volunteers = get_volunteers()
    requests = get_community_requests()

    if not donations:
        return {
            "status": "no_donations",
            "message": (
                "No food donations are currently available."
            ),
        }

    if not volunteers:
        return {
            "status": "no_volunteers",
            "message": (
                "No volunteers are currently available."
            ),
        }

    if not requests:
        return {
            "status": "no_requests",
            "message": (
                "No community food requests are currently available."
            ),
        }

    # ---------------------------------------------------------------
    # 2. Matching Agent
    # ---------------------------------------------------------------

    matching_agent = MatchingAgent()

    matches = matching_agent.find_matches(
        donations=donations,
        requests=requests,
        volunteers=volunteers,
    )

    if not matches:
        return {
            "status": "no_matches",
            "message": (
                "No compatible donation, community request, "
                "and volunteer combination was found."
            ),
        }

    # ---------------------------------------------------------------
    # 3. Routing Agent
    # ---------------------------------------------------------------

    routing_agent = RoutingAgent()

    routed_matches = []

    for match in matches:

        donation = next(
            (
                donation
                for donation in donations
                if donation["id"] == match["donation_id"]
            ),
            None,
        )

        request = next(
            (
                request
                for request in requests
                if request["id"] == match["request_id"]
            ),
            None,
        )

        if not donation or not request:
            continue

        route_results = []

        for volunteer_match in match["volunteers"]:

            volunteer = next(
                (
                    volunteer
                    for volunteer in volunteers
                    if volunteer["id"]
                    == volunteer_match["volunteer_id"]
                ),
                None,
            )

            if not volunteer:
                continue

            route = routing_agent.evaluate_route(
                volunteer=volunteer,
                donation=donation,
                request=request,
                meals_assigned=volunteer_match[
                    "meals_assigned"
                ],
            )

            route_results.append(route)

        routed_matches.append(
            {
                **match,
                "routes": route_results,
            }
        )

    # ---------------------------------------------------------------
    # 4. Coordinator Agent
    # ---------------------------------------------------------------

    coordinator = CoordinatorAgent()

    plans = []

    for match in routed_matches:

        donation = next(
            (
                donation
                for donation in donations
                if donation["id"] == match["donation_id"]
            ),
            None,
        )

        request = next(
            (
                request
                for request in requests
                if request["id"] == match["request_id"]
            ),
            None,
        )

        if not donation or not request:
            continue

        plan = coordinator.create_plan(
            donation=donation,
            request=request,
            match=match,
        )

        plan["routes"] = match["routes"]

        plans.append(plan)

    # ---------------------------------------------------------------
    # 5. Return complete operational picture
    # ---------------------------------------------------------------

    return {
        "status": "dispatch_plan_created",
        "plans": plans,
        "summary": {
            "donations_evaluated": len(donations),
            "requests_evaluated": len(requests),
            "volunteers_evaluated": len(volunteers),
            "matches_found": len(matches),
            "plans_created": len(plans),
        },
    }


# -------------------------------------------------------------------
# Volunteer Outreach
# -------------------------------------------------------------------

@app.post("/api/dispatch/outreach")
async def dispatch_outreach():

    # ---------------------------------------------------------------
    # 1. Load live data
    # ---------------------------------------------------------------

    donations = get_donations()
    volunteers = get_volunteers()
    requests = get_community_requests()

    if not donations:
        return {
            "status": "no_donations",
            "message": (
                "No food donations are currently available."
            ),
        }

    if not volunteers:
        return {
            "status": "no_volunteers",
            "message": (
                "No volunteers are currently available."
            ),
        }

    if not requests:
        return {
            "status": "no_requests",
            "message": (
                "No community food requests are currently available."
            ),
        }

    # ---------------------------------------------------------------
    # 2. Matching Agent
    # ---------------------------------------------------------------

    matching_agent = MatchingAgent()

    matches = matching_agent.find_matches(
        donations=donations,
        requests=requests,
        volunteers=volunteers,
    )

    if not matches:
        return {
            "status": "no_matches",
            "message": "No dispatch matches were found.",
        }

    # ---------------------------------------------------------------
    # 3. Routing + Coordinator
    # ---------------------------------------------------------------

    routing_agent = RoutingAgent()
    coordinator = CoordinatorAgent()
    outreach_agent = VolunteerOutreachAgent()

    plans = []

    for match in matches:

        donation = next(
            (
                donation
                for donation in donations
                if donation["id"] == match["donation_id"]
            ),
            None,
        )

        request = next(
            (
                request
                for request in requests
                if request["id"] == match["request_id"]
            ),
            None,
        )

        if not donation or not request:
            continue

        routes = []

        for volunteer_match in match["volunteers"]:

            volunteer = next(
                (
                    volunteer
                    for volunteer in volunteers
                    if volunteer["id"]
                    == volunteer_match["volunteer_id"]
                ),
                None,
            )

            if not volunteer:
                continue

            route = routing_agent.evaluate_route(
                volunteer=volunteer,
                donation=donation,
                request=request,
                meals_assigned=volunteer_match[
                    "meals_assigned"
                ],
            )

            routes.append(route)

        routed_match = {
            **match,
            "routes": routes,
        }

        plan = coordinator.create_plan(
            donation=donation,
            request=request,
            match=routed_match,
        )

        plan["routes"] = routes

        # -----------------------------------------------------------
        # 4. Prepare volunteer outreach
        # -----------------------------------------------------------

        outreach_volunteers = []

        for volunteer_match in match["volunteers"]:

            volunteer = next(
                (
                    volunteer
                    for volunteer in volunteers
                    if volunteer["id"]
                    == volunteer_match["volunteer_id"]
                ),
                None,
            )

            if not volunteer:
                continue

            outreach_volunteers.append(
                {
                    **volunteer_match,
                    "phone": volunteer.get("phone"),
                    "email": volunteer.get("email"),
                    "name": volunteer.get("name"),
                }
            )

        plan["delivery"]["volunteers"] = (
            outreach_volunteers
        )

        # -----------------------------------------------------------
        # 5. Create persistent dispatch assignments
        # -----------------------------------------------------------

        assignments = []

        for volunteer_match in outreach_volunteers:

            assignment_data = {
                "donation_id": donation["id"],
                "request_id": request["id"],
                "volunteer_id": volunteer_match[
                    "volunteer_id"
                ],
                "meals_assigned": volunteer_match.get(
                    "meals_assigned",
                    0,
                ),
                "pickup_address": donation.get(
                    "pickup_address",
                    "",
                ),
                "pickup_city": donation.get(
                    "city",
                    "",
                ),
                "pickup_deadline": donation.get(
                    "pickup_deadline",
                    "",
                ),
                "delivery_organization": request.get(
                    "organization_name",
                    "",
                ),
                "delivery_address": request.get(
                    "address",
                    "",
                ),
                "delivery_city": request.get(
                    "city",
                    "",
                ),
                "delivery_instructions": request.get(
                    "delivery_instructions",
                    "",
                ),
            }

            assignment = create_dispatch_assignment(
                assignment_data
            )

            assignments.append(
                {
                    "assignment_id": assignment["id"],
                    "volunteer_id": volunteer_match[
                        "volunteer_id"
                    ],
                    "volunteer_name": volunteer_match.get(
                        "volunteer_name"
                    ),
                    "phone": volunteer_match.get(
                        "phone"
                    ),
                    "email": volunteer_match.get(
                        "email"
                    ),
                    "meals_assigned": volunteer_match.get(
                        "meals_assigned",
                        0,
                    ),
                    "status": assignment["status"],
                }
            )

        # -----------------------------------------------------------
        # 6. Prepare outreach messages
        # -----------------------------------------------------------

        outreach = outreach_agent.prepare_outreach(
            plan
        )

        plans.append(
            {
                "plan": plan,
                "assignments": assignments,
                "outreach": outreach,
            }
        )

    return {
        "status": "outreach_ready",
        "plans": plans,
        "summary": {
            "plans_created": len(plans),
            "assignments_created": sum(
                len(plan["assignments"])
                for plan in plans
            ),
            "volunteers_to_contact": sum(
                len(plan["outreach"])
                for plan in plans
            ),
        },
    }


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

    # ---------------------------------------------------------------
    # 1. Get assignment
    # ---------------------------------------------------------------

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

    # ---------------------------------------------------------------
    # 2. Prevent duplicate calls
    # ---------------------------------------------------------------

    if assignment.get("vapi_call_id"):
        return {
            "status": "already_called",
            "assignment_id": assignment_id,
            "vapi_call_id": assignment["vapi_call_id"],
        }

    # ---------------------------------------------------------------
    # 3. Get volunteer
    # ---------------------------------------------------------------

    volunteer_response = (
        supabase
        .table("Volunteer Signup")
        .select("*")
        .eq(
            "whalesync_postgres_id",
            assignment["volunteer_id"],
        )
        .limit(1)
        .execute()
    )

    if not volunteer_response.data:
        return {
            "status": "volunteer_not_found",
            "assignment_id": assignment_id,
            "volunteer_id": assignment["volunteer_id"],
        }

    volunteer_row = volunteer_response.data[0]

    # ---------------------------------------------------------------
    # 4. Normalize volunteer
    # ---------------------------------------------------------------

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

    if not volunteer["phone"]:
        return {
            "status": "missing_phone",
            "assignment_id": assignment_id,
            "volunteer_id": volunteer["id"],
        }

    # ---------------------------------------------------------------
    # 5. Build Vapi assignment payload
    # ---------------------------------------------------------------

    vapi_assignment = {
        "assignment_id": assignment["id"],
        "donation_id": assignment.get(
            "donation_id"
        ),
        "request_id": assignment.get(
            "request_id"
        ),
        "volunteer_id": assignment.get(
            "volunteer_id"
        ),
        "meals_assigned": assignment.get(
            "meals_assigned",
            0,
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

    # ---------------------------------------------------------------
    # 6. Place outbound Vapi call
    # ---------------------------------------------------------------

    try:

        vapi_response = place_volunteer_call(
            volunteer=volunteer,
            assignment=vapi_assignment,
        )

    except Exception as error:

        print("=== VAPI OUTREACH ERROR ===")
        print(repr(error))

        return {
            "status": "call_failed",
            "assignment_id": assignment_id,
            "error": str(error),
        }

    # ---------------------------------------------------------------
    # 7. Save Vapi call ID
    # ---------------------------------------------------------------

    vapi_call_id = vapi_response.get("id")

    if vapi_call_id:

        update_response = (
            supabase
            .table("Dispatch Assignment")
            .update(
                {
                    "vapi_call_id": vapi_call_id,
                    "updated_at": (
                        datetime.now().isoformat()
                    ),
                }
            )
            .eq("id", assignment_id)
            .execute()
        )

        print(
            "=== DISPATCH ASSIGNMENT UPDATED ==="
        )
        print(update_response.data)

    return {
        "status": "call_initiated",
        "assignment_id": assignment_id,
        "volunteer": {
            "id": volunteer["id"],
            "name": volunteer["name"],
            "phone": volunteer["phone"],
        },
        "vapi": vapi_response,
    }


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

    # ---------------------------------------------------------------
    # End-of-call report
    # ---------------------------------------------------------------

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

    # ---------------------------------------------------------------
    # Extract assignment ID
    # ---------------------------------------------------------------

    variable_values = (
        message
        .get("call", {})
        .get("assistantOverrides", {})
        .get("variableValues", {})
    )

    assignment_id = variable_values.get(
        "assignment_id"
    )

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

    # ---------------------------------------------------------------
    # Determine volunteer response
    # ---------------------------------------------------------------

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
                    print(response)

                    # -----------------------------------------------
                    # ACCEPTED
                    # -----------------------------------------------

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

                    # -----------------------------------------------
                    # DECLINED
                    # -----------------------------------------------

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

    print("=== VOLUNTEER OUTCOME ===")
    print(outcome)

    # ---------------------------------------------------------------
    # Fetch assignment
    # ---------------------------------------------------------------

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

    # ---------------------------------------------------------------
    # Fetch volunteer
    # ---------------------------------------------------------------

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

    # ---------------------------------------------------------------
    # Update assignment outcome
    # ---------------------------------------------------------------

    update_data = {
        "status": outcome,
        "volunteer_outcome": outcome,
        "updated_at": datetime.now().isoformat(),
    }

    # ---------------------------------------------------------------
    # Create calendar event ONLY if accepted
    # ---------------------------------------------------------------

    if outcome == "accepted":

        # -----------------------------------------------------------
        # Prevent duplicate calendar invitations
        # -----------------------------------------------------------

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

            calendar_event_id = (
                calendar_event.get("id")
            )

            calendar_event_url = (
                calendar_event.get("htmlLink")
            )

            update_data[
                "calendar_event_id"
            ] = calendar_event_id

            update_data[
                "calendar_event_url"
            ] = calendar_event_url

            print(
                "=== CALENDAR EVENT CREATED ==="
            )
            print(calendar_event_id)
            print(calendar_event_url)

    # ---------------------------------------------------------------
    # Update Supabase
    # ---------------------------------------------------------------

    print(
        "=== UPDATING DISPATCH ASSIGNMENT ==="
    )

    print(update_data)

    updated_assignment = (
        supabase
        .table("Dispatch Assignment")
        .update(update_data)
        .eq("id", assignment_id)
        .execute()
    )

    print(
        "=== DISPATCH ASSIGNMENT UPDATED ==="
    )

    print(updated_assignment.data)

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
        "transcript": transcript,
    }