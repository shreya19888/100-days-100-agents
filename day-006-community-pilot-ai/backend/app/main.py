from typing import Any

from fastapi import FastAPI
from app.services.vapi_service import place_volunteer_call
from app.agents.coordinator import CoordinatorAgent
from app.agents.matching_agent import MatchingAgent
from app.agents.routing_agent import RoutingAgent

from app.services.data_service import (
    create_donation,
    get_donations,
    get_volunteers,
    get_community_requests,
)
from app.agents.volunteer_outreach_agent import (
    VolunteerOutreachAgent,
)

app = FastAPI(
    title="Community Pilot AI",
    description=(
        "Multi-agent coordination platform for "
        "community food redistribution."
    ),
    version="0.2.0",
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
# Voice AI — Food Donation Intake
# -------------------------------------------------------------------

@app.post("/api/voice/donation")
async def create_voice_donation(payload: dict[str, Any]):
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

    # Vapi custom tool calls
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
            "message": "No food donations are currently available.",
        }

    if not volunteers:
        return {
            "status": "no_volunteers",
            "message": "No volunteers are currently available.",
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
            "message": "No food donations are currently available.",
        }

    if not volunteers:
        return {
            "status": "no_volunteers",
            "message": "No volunteers are currently available.",
        }

    if not requests:
        return {
            "status": "no_requests",
            "message": (
                "No community food requests are currently available."
            ),
        }

    # ---------------------------------------------------------------
    # 2. Run matching
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
    # 3. Build dispatch plans
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
        # Enrich volunteer information for outreach
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
                }
            )

        plan["delivery"]["volunteers"] = (
            outreach_volunteers
        )

        # -----------------------------------------------------------
        # Prepare outreach
        # -----------------------------------------------------------

        outreach = outreach_agent.prepare_outreach(
            plan
        )

        plans.append(
            {
                "plan": plan,
                "outreach": outreach,
            }
        )

    return {
        "status": "outreach_ready",
        "plans": plans,
        "summary": {
            "plans_created": len(plans),
            "volunteers_to_contact": sum(
                len(plan["outreach"])
                for plan in plans
            ),
        },
    }

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
        "delivery_instructions": "Please call upon arrival.",
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
# Volunteer response webhook
# -------------------------------------------------------------------

@app.post("/api/voice/volunteer-response")
async def volunteer_response(payload: dict[str, Any]):

    print("=== VAPI VOLUNTEER RESPONSE ===")
    print(payload)

    message = payload.get("message", {})

    # Vapi can send the final structured response
    # inside the analysis object.
    analysis = message.get("analysis", {})

    print("=== ANALYSIS ===")
    print(analysis)

    return {
        "status": "received",
        "message": "Volunteer response received.",
    }