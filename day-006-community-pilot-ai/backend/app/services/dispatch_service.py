from datetime import datetime
from typing import Any

from app.database import supabase
from app.agents.coordinator import CoordinatorAgent
from app.agents.matching_agent import MatchingAgent
from app.agents.routing_agent import RoutingAgent
from app.agents.volunteer_outreach_agent import VolunteerOutreachAgent
from app.services.assignment_status import (
    COMPLETED_STATUSES,
    IN_TRANSIT_STATUSES,
    _sid,
    assignment_is_free,
    occupancy_from_assignments,
)
from app.services.data_service import (
    create_dispatch_assignment,
    get_community_requests,
    get_dispatch_assignments,
    get_donations,
    get_volunteers,
)
from app.services.vapi_service import (
    phone_is_callable,
    place_donor_notification_call,
    place_volunteer_call,
)


def _lookup(rows: list[dict[str, Any]], record_id: Any) -> dict[str, Any] | None:
    target = _sid(record_id)

    for row in rows:
        if _sid(row.get("id")) == target:
            return row

    return None


def _known_volunteer_ids(volunteers: list[dict[str, Any]]) -> set[str]:
    return {
        _sid(volunteer.get("id") or volunteer.get("whalesync_postgres_id"))
        for volunteer in volunteers
        if volunteer.get("id") or volunteer.get("whalesync_postgres_id")
    }


def resolve_volunteer(volunteer_id: Any) -> dict[str, Any] | None:
    target = _sid(volunteer_id)

    if not target:
        return None

    volunteer = _lookup(get_volunteers(), target)

    if volunteer:
        return volunteer

    for field in ("whalesync_postgres_id", "google_sheets_record_id"):
        response = (
            supabase
            .table("Volunteer Signup")
            .select("*")
            .eq(field, target)
            .limit(1)
            .execute()
        )

        if response.data:
            row = response.data[0]
            return {
                "id": row.get("whalesync_postgres_id"),
                "name": row.get("full_name"),
                "email": row.get("email"),
                "phone": row.get("phone_number"),
            }

    return None


def _volunteer_contact(volunteer: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": volunteer.get(
            "id",
            volunteer.get("whalesync_postgres_id"),
        ),
        "name": volunteer.get(
            "name",
            volunteer.get("full_name"),
        ),
        "email": volunteer.get("email"),
        "phone": volunteer.get(
            "phone",
            volunteer.get("phone_number"),
        ),
    }


def initiate_volunteer_call(
    assignment: dict[str, Any],
    volunteer: dict[str, Any],
) -> dict[str, Any]:
    """Place a Vapi outreach call and persist the call id."""

    contact = _volunteer_contact(volunteer)

    if not contact.get("phone"):
        return {
            "call_status": "missing_phone",
            "vapi_call_id": None,
            "call_error": "Volunteer does not have a phone number.",
        }

    try:
        vapi_assignment = {
            "assignment_id": assignment.get("id"),
            "donation_id": assignment.get("donation_id"),
            "request_id": assignment.get("request_id"),
            "volunteer_id": assignment.get("volunteer_id"),
            "meals_assigned": assignment.get("meals_assigned", 0),
            "pickup_address": assignment.get("pickup_address", ""),
            "pickup_city": assignment.get("pickup_city", ""),
            "pickup_deadline": assignment.get("pickup_deadline", ""),
            "delivery_organization": assignment.get(
                "delivery_organization",
                "",
            ),
            "delivery_address": assignment.get("delivery_address", ""),
            "delivery_city": assignment.get("delivery_city", ""),
            "delivery_instructions": assignment.get(
                "delivery_instructions",
                "",
            ),
        }

        print("=== VOLUNTEER OUTREACH ===")
        print(f"Calling {contact['name']} at {contact['phone']}")

        vapi_response = place_volunteer_call(
            volunteer=contact,
            assignment=vapi_assignment,
        )

        vapi_call_id = vapi_response.get("id")

        if not vapi_call_id:
            return {
                "call_status": "call_failed",
                "vapi_call_id": None,
                "call_error": "Vapi returned no call ID.",
                "vapi": vapi_response,
            }

        supabase.table("Dispatch Assignment").update(
            {
                "vapi_call_id": vapi_call_id,
                "updated_at": datetime.now().isoformat(),
            }
        ).eq("id", assignment["id"]).execute()

        return {
            "call_status": "call_initiated",
            "vapi_call_id": vapi_call_id,
            "call_error": None,
            "vapi": vapi_response,
        }

    except Exception as error:
        print("=== VAPI OUTREACH ERROR ===")
        print(repr(error))

        return {
            "call_status": "call_failed",
            "vapi_call_id": None,
            "call_error": str(error),
        }


def create_assignment(
    donation: dict[str, Any],
    request: dict[str, Any],
    volunteer: dict[str, Any],
    meals_assigned: int,
) -> dict[str, Any]:

    assignment = create_dispatch_assignment(
        {
            "donation_id": donation["id"],
            "request_id": request["id"],
            "volunteer_id": volunteer.get(
                "id",
                volunteer.get("volunteer_id"),
            ),
            "meals_assigned": meals_assigned,
            "pickup_address": donation.get("pickup_address", ""),
            "pickup_city": donation.get("city", ""),
            "pickup_deadline": donation.get("pickup_deadline", ""),
            "delivery_organization": request.get(
                "organization_name",
                "",
            ),
            "delivery_address": request.get("address", ""),
            "delivery_city": request.get("city", ""),
            "delivery_instructions": request.get(
                "delivery_instructions",
                "",
            ),
        }
    )

    return {
        "assignment_id": assignment["id"],
        "volunteer_id": volunteer.get(
            "id",
            volunteer.get("volunteer_id"),
        ),
        "volunteer_name": volunteer.get(
            "name",
            volunteer.get("volunteer_name"),
        ),
        "phone": volunteer.get(
            "phone",
            volunteer.get("phone_number"),
        ),
        "email": volunteer.get("email"),
        "meals_assigned": meals_assigned,
        "status": assignment.get("status", "outreach_pending"),
        "call_status": "not_attempted",
        "vapi_call_id": None,
        "call_error": None,
        "assignment": assignment,
    }


def create_assignment_and_call(
    donation: dict[str, Any],
    request: dict[str, Any],
    volunteer: dict[str, Any],
    meals_assigned: int,
) -> dict[str, Any]:

    created = create_assignment(
        donation=donation,
        request=request,
        volunteer=volunteer,
        meals_assigned=meals_assigned,
    )

    call_result = initiate_volunteer_call(
        created["assignment"],
        volunteer,
    )

    return {
        **created,
        "status": (
            "outreach_in_progress"
            if call_result["call_status"] == "call_initiated"
            else created["status"]
        ),
        **call_result,
    }


def _requests_or_fallback(
    requests: list[dict[str, Any]],
    donations: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    if requests:
        return requests

    sample = donations[0] if donations else {}
    total_meals = sum(donation.get("meals") or 0 for donation in donations)

    return [
        {
            "id": "",
            "organization_name": "Community destination TBD",
            "meals_needed": total_meals or 999,
            "capacity": total_meals or 999,
            "dietary_preferences": "",
            "urgency": "normal",
            "address": "",
            "city": sample.get("city", ""),
            "zip_code": sample.get("zip_code"),
            "available_from": None,
            "delivery_instructions": "",
        }
    ]


def _build_matches(
    donations: list[dict[str, Any]],
    requests: list[dict[str, Any]],
    volunteers: list[dict[str, Any]],
    occupancy: dict[str, Any],
) -> list[dict[str, Any]]:

    matching_agent = MatchingAgent()

    return matching_agent.find_matches(
        donations=donations,
        requests=requests,
        volunteers=volunteers,
        claimed_donation_ids=occupancy["claimed_donation_ids"],
        busy_volunteer_ids=occupancy["busy_volunteer_ids"],
        declined_pairs=occupancy["declined_pairs"],
        fulfilled_request_ids=occupancy["fulfilled_request_ids"],
    )


def _empty_pool_response(
    donations: list[dict[str, Any]],
    volunteers: list[dict[str, Any]],
    requests: list[dict[str, Any]],
    occupancy: dict[str, Any],
) -> dict[str, Any] | None:

    open_donations = [
        donation
        for donation in donations
        if _sid(donation.get("id")) not in occupancy["claimed_donation_ids"]
    ]

    if not donations or not open_donations:
        return {
            "status": "no_donations",
            "message": (
                "No food donations are currently available."
                if not donations
                else "All current donations are already in an active dispatch."
            ),
        }

    open_volunteers = [
        volunteer
        for volunteer in volunteers
        if _sid(volunteer.get("id")) not in occupancy["busy_volunteer_ids"]
    ]

    if not volunteers or not open_volunteers:
        return {
            "status": "no_volunteers",
            "message": (
                "No volunteers are currently available."
                if not volunteers
                else "All current volunteers are already on an assignment."
            ),
        }

    return None


def ready_to_call_plans() -> dict[str, Any] | None:
    """Existing matches that still need the coordinator to place a call."""

    donations = get_donations()
    volunteers = get_volunteers()
    assignments = get_dispatch_assignments()

    pending = [
        assignment
        for assignment in assignments
        if (assignment.get("status") or "").lower()
        in ("outreach_pending", "outreach_in_progress")
        and not assignment.get("vapi_call_id")
        and not assignment.get("volunteer_outcome")
    ]

    pending.sort(
        key=lambda assignment: (
            assignment.get("updated_at")
            or assignment.get("created_at")
            or ""
        ),
        reverse=True,
    )

    seen_donations: set[str] = set()
    plans = []

    for assignment in pending:
        donation_id = _sid(assignment.get("donation_id"))
        if donation_id and donation_id in seen_donations:
            continue
        if donation_id:
            seen_donations.add(donation_id)

        volunteer = resolve_volunteer(assignment.get("volunteer_id"))
        donation = _lookup(
            donations,
            assignment.get("donation_id"),
        )
        contact = _volunteer_contact(volunteer) if volunteer else {}

        if not contact.get("phone") or not phone_is_callable(contact.get("phone")):
            continue

        plans.append(
            {
                "plan": {
                    "donation": {
                        "restaurant_name": (
                            donation.get("restaurant_name")
                            if donation
                            else assignment.get("pickup_city")
                        ),
                    },
                    "request": {
                        "organization_name": assignment.get(
                            "delivery_organization"
                        ),
                    },
                },
                "assignments": [
                    {
                        "assignment_id": assignment.get("id"),
                        "volunteer_id": assignment.get("volunteer_id"),
                        "volunteer_name": contact.get("name"),
                        "phone": contact.get("phone"),
                        "email": contact.get("email"),
                        "meals_assigned": assignment.get(
                            "meals_assigned",
                            0,
                        ),
                        "status": assignment.get(
                            "status",
                            "outreach_pending",
                        ),
                        "call_status": "not_attempted",
                        "vapi_call_id": None,
                    }
                ],
                "outreach": [],
            }
        )

        if len(plans) >= 8:
            break

    if not plans:
        return None

    return {
        "status": "outreach_ready",
        "plans": plans,
        "summary": {
            "plans_created": len(plans),
            "assignments_created": 0,
            "volunteers_to_contact": len(plans),
        },
        "message": (
            f"{len(plans)} volunteer(s) are already matched. "
            "Place a call below."
        ),
    }


def run_dispatch_plan() -> dict[str, Any]:
    donations = get_donations()
    volunteers = get_volunteers()
    requests = _requests_or_fallback(
        get_community_requests(),
        donations,
    )
    occupancy = occupancy_from_assignments(
        get_dispatch_assignments(),
        requests,
        known_volunteer_ids=_known_volunteer_ids(volunteers),
    )

    empty = _empty_pool_response(
        donations, volunteers, requests, occupancy
    )
    if empty:
        return empty

    matches = _build_matches(
        donations, requests, volunteers, occupancy
    )

    if not matches:
        return {
            "status": "no_matches",
            "message": (
                "No compatible donation, community request, "
                "and volunteer combination was found."
            ),
        }

    routing_agent = RoutingAgent()
    coordinator = CoordinatorAgent()
    plans = []

    for match in matches:
        donation = _lookup(donations, match["donation_id"])
        request = _lookup(requests, match["request_id"])

        if not donation or not request:
            continue

        route_results = []

        for volunteer_match in match["volunteers"]:
            volunteer = _lookup(
                volunteers,
                volunteer_match["volunteer_id"],
            )

            if not volunteer:
                continue

            route_results.append(
                routing_agent.evaluate_route(
                    volunteer=volunteer,
                    donation=donation,
                    request=request,
                    meals_assigned=volunteer_match["meals_assigned"],
                )
            )

        plan = coordinator.create_plan(
            donation=donation,
            request=request,
            match=match,
        )
        plan["routes"] = route_results
        plans.append(plan)

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


def run_dispatch_outreach() -> dict[str, Any]:
    donations = get_donations()
    volunteers = get_volunteers()
    requests = _requests_or_fallback(
        get_community_requests(),
        donations,
    )
    occupancy = occupancy_from_assignments(
        get_dispatch_assignments(),
        requests,
        known_volunteer_ids=_known_volunteer_ids(volunteers),
    )

    empty = _empty_pool_response(
        donations, volunteers, requests, occupancy
    )
    if empty:
        return ready_to_call_plans() or empty

    matches = _build_matches(
        donations, requests, volunteers, occupancy
    )

    if not matches:
        return ready_to_call_plans() or {
            "status": "no_matches",
            "message": "No dispatch matches were found.",
        }

    routing_agent = RoutingAgent()
    coordinator = CoordinatorAgent()
    outreach_agent = VolunteerOutreachAgent()
    plans = []

    for match in matches:
        donation = _lookup(donations, match["donation_id"])
        request = _lookup(requests, match["request_id"])

        if not donation or not request:
            continue

        routes = []
        outreach_volunteers = []

        for volunteer_match in match["volunteers"]:
            volunteer = _lookup(
                volunteers,
                volunteer_match["volunteer_id"],
            )

            if not volunteer:
                continue

            routes.append(
                routing_agent.evaluate_route(
                    volunteer=volunteer,
                    donation=donation,
                    request=request,
                    meals_assigned=volunteer_match["meals_assigned"],
                )
            )

            outreach_volunteers.append(
                {
                    **volunteer_match,
                    **_volunteer_contact(volunteer),
                    "volunteer_id": volunteer_match["volunteer_id"],
                }
            )

        routed_match = {**match, "routes": routes}

        plan = coordinator.create_plan(
            donation=donation,
            request=request,
            match=routed_match,
        )
        plan["routes"] = routes
        plan["delivery"]["volunteers"] = outreach_volunteers

        assignments = []

        for volunteer_match in outreach_volunteers:
            assignments.append(
                create_assignment(
                    donation=donation,
                    request=request,
                    volunteer=volunteer_match,
                    meals_assigned=volunteer_match.get(
                        "meals_assigned",
                        0,
                    ),
                )
            )

        plans.append(
            {
                "plan": plan,
                "assignments": assignments,
                "outreach": outreach_agent.prepare_outreach(plan),
            }
        )

    return {
        "status": "outreach_ready",
        "plans": plans,
        "summary": {
            "plans_created": len(plans),
            "assignments_created": sum(
                len(plan["assignments"]) for plan in plans
            ),
            "volunteers_to_contact": sum(
                len(plan["outreach"]) for plan in plans
            ),
        },
        "message": (
            "Volunteers were matched. Place a call from the "
            "dispatch queue when you are ready."
        ),
    }


def reassign_after_decline(
    declined_assignment: dict[str, Any],
) -> dict[str, Any]:
    """Find the next feasible volunteer for the same donation."""

    donations = get_donations()
    volunteers = get_volunteers()
    requests = _requests_or_fallback(
        get_community_requests(),
        donations,
    )
    occupancy = occupancy_from_assignments(
        get_dispatch_assignments(),
        requests,
        replacement_search=True,
        known_volunteer_ids=_known_volunteer_ids(volunteers),
    )

    donation = _lookup(
        donations,
        declined_assignment.get("donation_id"),
    )
    original_request = _lookup(
        requests,
        declined_assignment.get("request_id"),
    )

    if not donation:
        return {
            "status": "donation_not_found",
            "message": "The original donation could not be found.",
        }

    preferred_requests = (
        [original_request] if original_request else requests
    )

    matches = _build_matches(
        donations=[donation],
        requests=preferred_requests,
        volunteers=volunteers,
        occupancy=occupancy,
    )

    if not matches and original_request:
        matches = _build_matches(
            donations=[donation],
            requests=requests,
            volunteers=volunteers,
            occupancy=occupancy,
        )

    if not matches or not matches[0].get("volunteers"):
        return {
            "status": "match_pending",
            "message": "Volunteer match pending",
            "donation_id": declined_assignment.get("donation_id"),
        }

    match = matches[0]
    request = _lookup(requests, match["request_id"]) or original_request
    next_volunteer_match = match["volunteers"][0]
    volunteer = _lookup(
        volunteers,
        next_volunteer_match["volunteer_id"],
    )

    if not request or not volunteer:
        return {
            "status": "match_pending",
            "message": "Volunteer match pending",
            "donation_id": declined_assignment.get("donation_id"),
        }

    assignment = create_assignment(
        donation=donation,
        request=request,
        volunteer={
            **volunteer,
            **next_volunteer_match,
        },
        meals_assigned=next_volunteer_match.get(
            "meals_assigned",
            declined_assignment.get("meals_assigned") or 0,
        ),
    )

    print("=== REPLACEMENT MATCH ===")
    print(assignment)

    return {
        "status": "reassigned",
        "assignment": assignment,
        "volunteer_name": assignment.get("volunteer_name"),
        "message": (
            f"{assignment.get('volunteer_name')} was matched. "
            "Place a call when you are ready."
        ),
    }


def record_volunteer_decline(assignment_id: str) -> dict[str, Any]:
    """Mark a volunteer declined and match the next available person."""

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
            "message": "The dispatch assignment could not be found.",
            "assignment_id": assignment_id,
        }

    assignment = response.data[0]
    status = (assignment.get("status") or "").lower()
    outcome = (assignment.get("volunteer_outcome") or "").lower()

    if status in COMPLETED_STATUSES:
        return {
            "status": "already_delivered",
            "message": "Delivered assignments cannot be declined.",
            "assignment_id": assignment_id,
            "assignment": assignment,
        }

    if outcome != "declined" and status not in (
        "declined",
        "needs_reassignment",
    ):
        updated = (
            supabase
            .table("Dispatch Assignment")
            .update(
                {
                    "status": "needs_reassignment",
                    "volunteer_outcome": "declined",
                    "updated_at": datetime.now().isoformat(),
                }
            )
            .eq("id", assignment_id)
            .execute()
        )
        assignment = (updated.data or [assignment])[0]

    reassignment = reassign_after_decline(assignment)

    print("=== VOLUNTEER DECLINED ===")
    print(reassignment)

    return {
        "status": "declined",
        "assignment_id": assignment_id,
        "assignment": assignment,
        "reassignment": reassignment,
        "message": reassignment.get("message") or "Volunteer match pending",
    }


def complete_dispatch_assignment(assignment_id: str) -> dict[str, Any]:
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
            "message": "The dispatch assignment could not be found.",
            "assignment_id": assignment_id,
        }

    assignment = response.data[0]
    status = (assignment.get("status") or "").lower()
    outcome = (assignment.get("volunteer_outcome") or "").lower()

    if status in COMPLETED_STATUSES:
        return {
            "status": "already_delivered",
            "assignment_id": assignment_id,
            "assignment": assignment,
        }

    if assignment_is_free(assignment) or outcome == "declined":
        return {
            "status": "not_accepted",
            "message": (
                "Only accepted assignments can be marked delivered."
            ),
            "assignment_id": assignment_id,
        }

    if outcome != "accepted" and status not in (
        "accepted",
        "confirmed",
        "picked_up",
        "in_transit",
    ):
        return {
            "status": "not_accepted",
            "message": (
                "The volunteer has not accepted this assignment yet."
            ),
            "assignment_id": assignment_id,
        }

    updated = (
        supabase
        .table("Dispatch Assignment")
        .update(
            {
                "status": "delivered",
                "updated_at": datetime.now().isoformat(),
            }
        )
        .eq("id", assignment_id)
        .execute()
    )

    return {
        "status": "delivered",
        "assignment_id": assignment_id,
        "assignment": (updated.data or [assignment])[0],
    }


def mark_assignment_picked_up(assignment_id: str) -> dict[str, Any]:
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
            "message": "The dispatch assignment could not be found.",
            "assignment_id": assignment_id,
        }

    assignment = response.data[0]
    status = (assignment.get("status") or "").lower()
    outcome = (assignment.get("volunteer_outcome") or "").lower()

    if status in COMPLETED_STATUSES:
        return {
            "status": "already_delivered",
            "assignment_id": assignment_id,
            "assignment": assignment,
        }

    if status in IN_TRANSIT_STATUSES:
        return {
            "status": "picked_up",
            "assignment_id": assignment_id,
            "assignment": assignment,
        }

    if assignment_is_free(assignment) or outcome == "declined":
        return {
            "status": "not_accepted",
            "message": "Only accepted assignments can be marked picked up.",
            "assignment_id": assignment_id,
        }

    if outcome != "accepted" and status not in ("accepted", "confirmed"):
        return {
            "status": "not_accepted",
            "message": "The volunteer has not accepted this assignment yet.",
            "assignment_id": assignment_id,
        }

    updated = (
        supabase
        .table("Dispatch Assignment")
        .update(
            {
                "status": "picked_up",
                "updated_at": datetime.now().isoformat(),
            }
        )
        .eq("id", assignment_id)
        .execute()
    )

    return {
        "status": "picked_up",
        "assignment_id": assignment_id,
        "assignment": (updated.data or [assignment])[0],
    }


def notify_donor_volunteer_en_route(
    assignment: dict[str, Any],
    volunteer: dict[str, Any],
) -> dict[str, Any] | None:
    donation_id = assignment.get("donation_id")
    if not donation_id:
        return None

    donation = _lookup(get_donations(), donation_id)
    phone = None
    name = None

    if donation:
        phone = donation.get("contact_phone")
        name = donation.get("contact_name") or donation.get("restaurant_name")
    else:
        response = (
            supabase
            .table("Food Donation")
            .select("contact_phone,contact_name,restaurant_business_name")
            .eq("whalesync_postgres_id", donation_id)
            .limit(1)
            .execute()
        )
        row = (response.data or [None])[0]
        if row:
            phone = row.get("contact_phone")
            name = row.get("contact_name") or row.get(
                "restaurant_business_name"
            )

    if not phone_is_callable(phone):
        print("=== DONOR NOTIFY SKIPPED: no callable phone ===")
        return None

    try:
        result = place_donor_notification_call(
            donor={"name": name, "phone": phone},
            volunteer=volunteer,
            assignment=assignment,
        )
        print("=== DONOR NOTIFIED ===")
        print(result.get("id"))
        return result
    except Exception as error:
        print("=== DONOR NOTIFY ERROR ===")
        print(repr(error))
        return None
