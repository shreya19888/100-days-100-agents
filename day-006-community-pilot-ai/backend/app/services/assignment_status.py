from typing import Any


FREE_STATUSES = {
    "declined",
    "needs_reassignment",
    "cancelled",
    "match_pending",
}

COMPLETED_STATUSES = {
    "delivered",
    "completed",
}

IN_TRANSIT_STATUSES = {
    "picked_up",
    "in_transit",
}

BUSY_STATUSES = {
    "outreach_pending",
    "outreach_in_progress",
    "accepted",
    "confirmed",
    "uncertain",
    "outreach_uncertain",
    "picked_up",
    "in_transit",
}


def _sid(value: Any) -> str:
    return str(value or "")


def assignment_is_free(assignment: dict[str, Any]) -> bool:
    status = (assignment.get("status") or "").lower()
    outcome = (assignment.get("volunteer_outcome") or "").lower()

    if outcome in ("declined", "no_answer"):
        return True

    return status in FREE_STATUSES


def assignment_is_completed(assignment: dict[str, Any]) -> bool:
    status = (assignment.get("status") or "").lower()
    return status in COMPLETED_STATUSES


def assignment_is_claimed(assignment: dict[str, Any]) -> bool:
    """Food is claimed if it is in-flight or already delivered."""

    if assignment_is_free(assignment):
        return False

    status = (assignment.get("status") or "").lower()

    if status in BUSY_STATUSES or status in COMPLETED_STATUSES:
        return True

    if status in ("needs_dispatch", "pending", "match_pending", ""):
        return False

    return True


def assignment_keeps_volunteer_busy(assignment: dict[str, Any]) -> bool:
    if assignment_is_free(assignment):
        return False

    if assignment_is_completed(assignment):
        return False

    return True


def volunteer_is_hard_busy(assignment: dict[str, Any]) -> bool:
    """Busy only if already committed or currently on a live call."""

    if assignment_is_free(assignment) or assignment_is_completed(assignment):
        return False

    status = (assignment.get("status") or "").lower()

    if status in ("accepted", "confirmed", "picked_up", "in_transit"):
        return True

    if assignment.get("vapi_call_id") and not assignment.get(
        "volunteer_outcome"
    ):
        return True

    return False


def occupancy_from_assignments(
    assignments: list[dict[str, Any]],
    requests: list[dict[str, Any]] | None = None,
    *,
    replacement_search: bool = False,
    known_volunteer_ids: set[str] | None = None,
) -> dict[str, Any]:

    claimed_donation_ids: set[str] = set()
    busy_volunteer_ids: set[str] = set()
    declined_pairs: set[tuple[str, str]] = set()
    meals_by_request: dict[str, int] = {}
    known_ids = {
        _sid(item) for item in (known_volunteer_ids or set()) if _sid(item)
    }
    busy_check = (
        volunteer_is_hard_busy
        if replacement_search
        else assignment_keeps_volunteer_busy
    )

    for assignment in assignments:
        donation_id = _sid(assignment.get("donation_id"))
        volunteer_id = _sid(assignment.get("volunteer_id"))
        request_id = _sid(assignment.get("request_id"))
        outcome = (assignment.get("volunteer_outcome") or "").lower()

        if donation_id and volunteer_id and outcome in (
            "declined",
            "no_answer",
        ):
            declined_pairs.add((donation_id, volunteer_id))

        if known_volunteer_ids is not None and (
            not volunteer_id or volunteer_id not in known_ids
        ):
            continue

        if donation_id and assignment_is_claimed(assignment):
            claimed_donation_ids.add(donation_id)

        if volunteer_id and busy_check(assignment):
            busy_volunteer_ids.add(volunteer_id)

        if request_id and not assignment_is_free(assignment):
            meals_by_request[request_id] = meals_by_request.get(
                request_id, 0
            ) + int(assignment.get("meals_assigned") or 0)

    fulfilled_request_ids: set[str] = set()

    for request in requests or []:
        request_id = _sid(request.get("id"))
        needed = int(
            request.get("meals_needed")
            or request.get("capacity")
            or 0
        )

        if request_id and needed and meals_by_request.get(request_id, 0) >= needed:
            fulfilled_request_ids.add(request_id)

    return {
        "claimed_donation_ids": claimed_donation_ids,
        "busy_volunteer_ids": busy_volunteer_ids,
        "declined_pairs": declined_pairs,
        "fulfilled_request_ids": fulfilled_request_ids,
    }
