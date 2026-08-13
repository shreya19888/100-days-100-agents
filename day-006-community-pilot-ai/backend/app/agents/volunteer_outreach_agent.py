from typing import Any


class VolunteerOutreachAgent:
    """
    Prepares volunteer outreach actions from a dispatch plan.

    This agent does not place phone calls itself.
    It determines who should be contacted and what
    information should be communicated.
    """

    def prepare_outreach(
        self,
        plan: dict[str, Any],
    ) -> list[dict[str, Any]]:

        outreach = []

        delivery = plan.get("delivery", {})

        volunteers = delivery.get("volunteers", [])

        donation = plan.get("donation", {})
        request = plan.get("request", {})

        for volunteer in volunteers:

            outreach.append(
                {
                    "volunteer_id": volunteer.get(
                        "volunteer_id"
                    ),
                    "volunteer_name": volunteer.get(
                        "volunteer_name"
                    ),
                    "phone": volunteer.get("phone"),
                    "meals_assigned": volunteer.get(
                        "meals_assigned",
                        0,
                    ),
                    "transportation": volunteer.get(
                        "transportation"
                    ),
                    "pickup": {
                        "address": donation.get(
                            "pickup_address"
                        ),
                        "city": donation.get("city"),
                    },
                    "delivery": {
                        "organization": request.get(
                            "organization_name"
                        ),
                        "address": request.get(
                            "address"
                        ),
                        "city": request.get("city"),
                    },
                    "pickup_deadline": donation.get(
                        "pickup_deadline"
                    ),
                    "delivery_instructions": request.get(
                        "delivery_instructions"
                    ),
                }
            )

        return outreach