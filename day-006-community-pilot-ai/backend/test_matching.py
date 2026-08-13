from app.services.data_service import (
    get_donations,
    get_volunteers,
    get_community_requests,
)

from app.agents.matching_agent import MatchingAgent


donations = get_donations()
volunteers = get_volunteers()
requests = get_community_requests()


agent = MatchingAgent()

matches = agent.find_matches(
    donations=donations,
    requests=requests,
    volunteers=volunteers,
)


print("\n==============================")
print("COMMUNITY PILOT MATCH RESULTS")
print("==============================\n")


for match in matches:

    print(
        f"Donation: {match['restaurant_name']}"
    )

    print(
        f"Community: {match['organization_name']}"
    )

    print(
        f"Food: {match['food_type']}"
    )

    print(
        f"Requested: {match['meals_requested']} meals"
    )

    print(
        f"Matched: {match['meals_matched']} meals"
    )

    print(
        f"Remaining: {match['meals_remaining']} meals"
    )

    print(
        f"Status: {match['status']}"
    )

    print(
        f"Urgency: {match['urgency']}"
    )

    print("\nVolunteers:")

    for volunteer in match["volunteers"]:

        print(
            f"  - {volunteer['volunteer_name']}: "
            f"{volunteer['meals_assigned']} meals "
            f"({volunteer['transportation']})"
        )

    print("\n------------------------------\n")