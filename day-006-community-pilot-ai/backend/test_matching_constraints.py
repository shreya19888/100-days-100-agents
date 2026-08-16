from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from app.agents.matching_agent import MatchingAgent
from app.services.assignment_status import (
    assignment_is_claimed,
    assignment_keeps_volunteer_busy,
    occupancy_from_assignments,
    volunteer_is_hard_busy,
)
from app.services.routing_service import estimate_distance
from app.services.time_window import (
    is_donation_expired,
    parse_clock_time,
    time_windows_compatible,
)
from app.services.vapi_service import phone_is_callable


try:
    PACIFIC = ZoneInfo("America/Los_Angeles")
except Exception:
    PACIFIC = timezone(timedelta(hours=-7))


def _donation(**overrides):
    base = {
        "id": "don-1",
        "restaurant_name": "Test Kitchen",
        "food_type": "vegetarian pasta",
        "dietary_information": "vegetarian",
        "meals": 20,
        "pickup_address": "100 Market Street",
        "city": "San Jose",
        "zip_code": "95112",
        "available_from": "5:00 PM",
        "pickup_deadline": "8:00 PM",
        "created_at": "2026-12-15T10:00:00",
    }
    base.update(overrides)
    return base


def _request(**overrides):
    base = {
        "id": "req-1",
        "organization_name": "Community Center",
        "meals_needed": 20,
        "capacity": 20,
        "dietary_preferences": "vegetarian",
        "urgency": "high",
        "address": "200 Market Street",
        "city": "San Jose",
        "zip_code": "95113",
        "available_from": "5:00 PM",
    }
    base.update(overrides)
    return base


def _volunteer(**overrides):
    base = {
        "id": "vol-1",
        "name": "Alex",
        "transportation": "car",
        "capacity": 25,
        "preferred_tasks": "pickup and delivery",
        "zip_code": "95112",
        "phone": "4083061143",
        "max_distance": 15,
        "available_from": "4:00 PM",
        "available_until": "9:00 PM",
    }
    base.update(overrides)
    return base


def test_parse_clock_time():
    assert parse_clock_time("5:00 PM").hour == 17
    assert parse_clock_time("after 6pm").hour == 18
    assert parse_clock_time("17:00").hour == 17


def test_expired_donation_uses_created_date():
    donation = _donation(
        pickup_deadline="8:00 PM",
        created_at="2026-08-14T10:00:00",
    )
    now = datetime(2026, 8, 15, 12, 0, tzinfo=PACIFIC)
    assert is_donation_expired(donation, now=now) is True


def test_same_day_deadline_not_expired():
    donation = _donation(
        pickup_deadline="8:00 PM",
        created_at="2026-08-15T10:00:00",
    )
    now = datetime(2026, 8, 15, 12, 0, tzinfo=PACIFIC)
    assert is_donation_expired(donation, now=now) is False


def test_time_window_overlap():
    assert time_windows_compatible(
        _volunteer(available_from="4:00 PM", available_until="9:00 PM"),
        _donation(available_from="5:00 PM", pickup_deadline="8:00 PM"),
    )
    assert not time_windows_compatible(
        _volunteer(available_from="9:00 AM", available_until="12:00 PM"),
        _donation(available_from="5:00 PM", pickup_deadline="8:00 PM"),
    )


def test_sf_to_san_jose_distance_is_available():
    result = estimate_distance("94102", "95112")
    assert result["available"] is True
    assert result["distance_miles"] > 30


def test_matching_skips_claimed_donation_and_busy_volunteer():
    agent = MatchingAgent()

    matches = agent.find_matches(
        donations=[_donation()],
        requests=[_request()],
        volunteers=[_volunteer()],
        claimed_donation_ids={"don-1"},
    )
    assert matches == []

    matches = agent.find_matches(
        donations=[_donation()],
        requests=[_request()],
        volunteers=[_volunteer()],
        busy_volunteer_ids={"vol-1"},
    )
    assert matches == []


def test_matching_skips_volunteer_outside_distance():
    agent = MatchingAgent()

    matches = agent.find_matches(
        donations=[_donation(zip_code="95112")],
        requests=[_request(zip_code="95113")],
        volunteers=[
            _volunteer(
                zip_code="94102",
                max_distance=10,
            )
        ],
    )
    assert matches == []


def test_matching_includes_volunteer_with_incomplete_profile():
    agent = MatchingAgent()

    matches = agent.find_matches(
        donations=[_donation()],
        requests=[_request()],
        volunteers=[
            _volunteer(
                transportation="",
                capacity=0,
                max_distance=0,
                available_from="",
                available_until="",
            )
        ],
    )

    assert len(matches) == 1
    assert matches[0]["volunteers"][0]["volunteer_id"] == "vol-1"


def test_matching_assigns_nearby_volunteer():
    agent = MatchingAgent()

    matches = agent.find_matches(
        donations=[_donation()],
        requests=[_request()],
        volunteers=[_volunteer()],
    )

    assert len(matches) == 1
    assert matches[0]["volunteers"][0]["volunteer_id"] == "vol-1"


def test_one_donation_matches_one_request():
    agent = MatchingAgent()

    matches = agent.find_matches(
        donations=[_donation()],
        requests=[
            _request(id="req-high", urgency="high"),
            _request(id="req-low", urgency="low"),
        ],
        volunteers=[_volunteer()],
    )

    assert len(matches) == 1
    assert matches[0]["request_id"] == "req-high"


def test_declined_pair_is_skipped():
    agent = MatchingAgent()

    matches = agent.find_matches(
        donations=[_donation()],
        requests=[_request()],
        volunteers=[_volunteer()],
        declined_pairs={("don-1", "vol-1")},
    )
    assert matches == []


def test_occupancy_frees_declined_donation():
    occupancy = occupancy_from_assignments(
        [
            {
                "donation_id": "don-1",
                "volunteer_id": "vol-1",
                "request_id": "req-1",
                "status": "needs_reassignment",
                "volunteer_outcome": "declined",
                "meals_assigned": 20,
            }
        ],
        requests=[_request()],
    )

    assert "don-1" not in occupancy["claimed_donation_ids"]
    assert "vol-1" not in occupancy["busy_volunteer_ids"]
    assert ("don-1", "vol-1") in occupancy["declined_pairs"]


def test_completed_assignment_claims_food_but_frees_volunteer():
    assignment = {
        "donation_id": "don-1",
        "volunteer_id": "vol-1",
        "status": "delivered",
        "meals_assigned": 20,
    }

    assert assignment_is_claimed(assignment) is True
    assert assignment_keeps_volunteer_busy(assignment) is False


def test_stale_pending_does_not_block_replacement_search():
    occupancy = occupancy_from_assignments(
        [
            {
                "donation_id": "don-stale",
                "volunteer_id": "vol-2",
                "status": "outreach_pending",
                "meals_assigned": 10,
            },
            {
                "donation_id": "don-1",
                "volunteer_id": "vol-1",
                "status": "needs_reassignment",
                "volunteer_outcome": "declined",
                "meals_assigned": 20,
            },
        ],
        requests=[_request()],
        replacement_search=True,
    )

    assert "don-1" not in occupancy["claimed_donation_ids"]
    assert "vol-2" not in occupancy["busy_volunteer_ids"]
    assert ("don-1", "vol-1") in occupancy["declined_pairs"]


def test_live_call_keeps_volunteer_hard_busy():
    assignment = {
        "donation_id": "don-2",
        "volunteer_id": "vol-2",
        "status": "outreach_pending",
        "vapi_call_id": "call-123",
        "meals_assigned": 10,
    }

    assert volunteer_is_hard_busy(assignment) is True
    assert assignment_keeps_volunteer_busy(assignment) is True


def test_orphan_volunteer_does_not_claim_donation():
    occupancy = occupancy_from_assignments(
        [
            {
                "donation_id": "don-1",
                "volunteer_id": "missing-volunteer",
                "status": "outreach_pending",
                "meals_assigned": 20,
            }
        ],
        requests=[_request()],
        known_volunteer_ids={"vol-1"},
    )

    assert "don-1" not in occupancy["claimed_donation_ids"]
    assert "missing-volunteer" not in occupancy["busy_volunteer_ids"]


def test_matching_picks_next_volunteer_after_decline():
    agent = MatchingAgent()

    matches = agent.find_matches(
        donations=[_donation()],
        requests=[_request()],
        volunteers=[
            _volunteer(id="vol-1", name="Alex"),
            _volunteer(id="vol-2", name="Jordan"),
        ],
        declined_pairs={("don-1", "vol-1")},
    )

    assert len(matches) == 1
    assert matches[0]["volunteers"][0]["volunteer_id"] == "vol-2"


def test_matching_skips_uncallable_phone():
    agent = MatchingAgent()

    matches = agent.find_matches(
        donations=[_donation()],
        requests=[_request()],
        volunteers=[_volunteer(phone="5550103")],
    )
    assert matches == []


def test_matching_splits_large_donation_across_volunteers():
    agent = MatchingAgent()

    matches = agent.find_matches(
        donations=[_donation(meals=40)],
        requests=[_request(meals_needed=40, capacity=40)],
        volunteers=[
            _volunteer(id="vol-1", name="Alex", capacity=20),
            _volunteer(id="vol-2", name="Jordan", capacity=20),
        ],
    )

    assert len(matches) == 1
    volunteers = matches[0]["volunteers"]
    assert len(volunteers) == 2
    assert {item["volunteer_id"] for item in volunteers} == {"vol-1", "vol-2"}
    assert sum(item["meals_assigned"] for item in volunteers) == 40


def test_phone_is_callable():
    assert phone_is_callable("4083061143") is True
    assert phone_is_callable("5550103") is False
    assert phone_is_callable("4085551212") is False
    assert phone_is_callable("") is False
