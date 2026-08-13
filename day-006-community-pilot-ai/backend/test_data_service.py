from app.services.data_service import (
    get_donations,
    get_volunteers,
    get_community_requests,
    get_data_summary,
)


print("\n=== DONATIONS ===")
for donation in get_donations():
    print(donation)


print("\n=== VOLUNTEERS ===")
for volunteer in get_volunteers():
    print(volunteer)


print("\n=== COMMUNITY REQUESTS ===")
for request in get_community_requests():
    print(request)


print("\n=== SUMMARY ===")
print(get_data_summary())