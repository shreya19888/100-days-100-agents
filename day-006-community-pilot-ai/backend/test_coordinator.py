from app.services.data_service import (
    get_donations,
    get_volunteers,
    get_community_requests,
)

from app.agents.matching_agent import MatchingAgent
from app.agents.coordinator import CoordinatorAgent


donations = get_donations()
volunteers = get_volunteers()
requests = get_community_requests()


matching_agent = MatchingAgent()

matches = matching_agent.find_matches(
    donations=donations,
    requests=requests,
    volunteers=volunteers,
)


coordinator = CoordinatorAgent()


print("\n================================")
print("COMMUNITY PILOT ACTION PLAN")
print("================================\n")


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

    plan = coordinator.create_plan(
        donation=donation,
        request=request,
        match=match,
    )

    print(f"Status: {plan['status']}")
    print(f"Priority: {plan['priority']}")
    print()
    print(plan["recommendation"])
    print()

    print("DONATION")
    print(f"  Restaurant: {plan['donation']['restaurant_name']}")
    print(f"  Food: {plan['donation']['food_type']}")
    print(f"  Meals: {plan['donation']['meals_available']}")
    print()

    print("COMMUNITY REQUEST")
    print(
        f"  Organization: "
        f"{plan['request']['organization_name']}"
    )
    print(
        f"  Requested: "
        f"{plan['request']['meals_requested']} meals"
    )
    print(
        f"  Urgency: "
        f"{plan['request']['urgency']}"
    )
    print()

    print("DELIVERY")
    print(
        f"  Matched: "
        f"{plan['delivery']['meals_matched']} meals"
    )
    print(
        f"  Remaining: "
        f"{plan['delivery']['meals_remaining']} meals"
    )

    for volunteer in plan["delivery"]["volunteers"]:
        print(
            f"  Volunteer: "
            f"{volunteer['volunteer_name']} "
            f"({volunteer['meals_assigned']} meals)"
        )

    print("\n--------------------------------\n")