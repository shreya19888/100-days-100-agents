from datetime import datetime, time, date, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo
import re


try:
    PACIFIC = ZoneInfo("America/Los_Angeles")
except Exception:
    PACIFIC = timezone(timedelta(hours=-7))

_TIME_RE = re.compile(
    r"(?P<hour>\d{1,2})(?::(?P<minute>\d{2}))?(?::(?P<second>\d{2}))?"
    r"\s*(?P<ampm>a\.?m\.?|p\.?m\.?)?",
    re.IGNORECASE,
)

_PREFIX_RE = re.compile(
    r"^(after|before|until|from|by|around|approx(?:imately)?)\s+",
    re.IGNORECASE,
)


def _parse_datetime(value: Any) -> datetime | None:
    if value is None or value == "":
        return None

    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=PACIFIC)
        return value.astimezone(PACIFIC)

    text = str(value).strip()
    if not text:
        return None

    iso_text = text.replace("Z", "+00:00")

    try:
        parsed = datetime.fromisoformat(iso_text)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=PACIFIC)
        return parsed.astimezone(PACIFIC)
    except ValueError:
        return None


def parse_clock_time(value: Any) -> time | None:
    """Parse a clock time from form text such as '5:00 PM' or 'after 6pm'."""

    if value is None or value == "":
        return None

    if isinstance(value, time):
        return value

    parsed_dt = _parse_datetime(value)
    if parsed_dt is not None:
        return parsed_dt.timetz().replace(tzinfo=None)

    text = str(value).strip().lower()
    text = _PREFIX_RE.sub("", text)
    text = text.replace(".", "")

    match = _TIME_RE.search(text)
    if not match:
        return None

    hour = int(match.group("hour"))
    minute = int(match.group("minute") or 0)
    ampm = (match.group("ampm") or "").replace(".", "")

    if hour > 23:
        return None

    if ampm.startswith("p") and hour < 12:
        hour += 12
    elif ampm.startswith("a") and hour == 12:
        hour = 0

    if hour > 23 or minute > 59:
        return None

    return time(hour=hour, minute=minute)


def pickup_deadline_at(donation: dict[str, Any]) -> datetime | None:
    """
    Combine the donation's created date with its pickup deadline clock time.

    Google Form deadlines are often times without dates, so we anchor them
    to the day the donation was recorded.
    """

    deadline_dt = _parse_datetime(donation.get("pickup_deadline"))
    if deadline_dt is not None and "T" in str(donation.get("pickup_deadline", "")):
        return deadline_dt

    clock = parse_clock_time(donation.get("pickup_deadline"))
    if clock is None:
        return None

    created = _parse_datetime(donation.get("created_at"))
    base_date = created.date() if created else datetime.now(PACIFIC).date()

    return datetime.combine(base_date, clock, tzinfo=PACIFIC)


def is_donation_expired(
    donation: dict[str, Any],
    now: datetime | None = None,
) -> bool:
    deadline = pickup_deadline_at(donation)
    if deadline is None:
        return False

    current = now or datetime.now(PACIFIC)
    return current > deadline


def _window_from_fields(
    start_value: Any,
    end_value: Any,
    day: date,
) -> tuple[datetime | None, datetime | None]:
    start_clock = parse_clock_time(start_value)
    end_clock = parse_clock_time(end_value)

    start_dt = (
        datetime.combine(day, start_clock, tzinfo=PACIFIC)
        if start_clock
        else None
    )
    end_dt = (
        datetime.combine(day, end_clock, tzinfo=PACIFIC)
        if end_clock
        else None
    )

    if start_dt and end_dt and end_dt <= start_dt:
        end_dt = end_dt + timedelta(days=1)

    return start_dt, end_dt


def time_windows_compatible(
    volunteer: dict[str, Any],
    donation: dict[str, Any],
    request: dict[str, Any] | None = None,
) -> bool:
    """
    Return True unless we can prove the volunteer cannot make the pickup.

    Missing or unparseable windows do not block a match.
    """

    created = _parse_datetime(donation.get("created_at"))
    day = created.date() if created else datetime.now(PACIFIC).date()

    volunteer_start, volunteer_end = _window_from_fields(
        volunteer.get("available_from"),
        volunteer.get("available_until"),
        day,
    )

    pickup_start, pickup_end = _window_from_fields(
        donation.get("available_from"),
        donation.get("pickup_deadline"),
        day,
    )

    if volunteer_start is None and volunteer_end is None:
        return True

    if pickup_start is None and pickup_end is None:
        return True

    volunteer_from = volunteer_start or datetime.combine(
        day, time.min, tzinfo=PACIFIC
    )
    volunteer_until = volunteer_end or datetime.combine(
        day, time.max, tzinfo=PACIFIC
    )
    pickup_from = pickup_start or datetime.combine(
        day, time.min, tzinfo=PACIFIC
    )
    pickup_until = pickup_end or datetime.combine(
        day, time.max, tzinfo=PACIFIC
    )

    if volunteer_until <= pickup_from:
        return False

    if volunteer_from >= pickup_until:
        return False

    if request:
        receive_start = parse_clock_time(request.get("available_from"))
        if receive_start is not None:
            receive_dt = datetime.combine(
                day, receive_start, tzinfo=PACIFIC
            )
            if volunteer_until <= receive_dt:
                return False

    return True


def expiry_payload(
    record: dict[str, Any],
    now: datetime | None = None,
) -> dict[str, Any]:
    deadline = pickup_deadline_at(record)
    current = now or datetime.now(PACIFIC)

    if deadline is None:
        return {
            "expires_at": None,
            "minutes_remaining": None,
            "expired": False,
        }

    minutes = int((deadline - current).total_seconds() // 60)

    return {
        "expires_at": deadline.isoformat(),
        "minutes_remaining": minutes,
        "expired": minutes < 0,
    }
