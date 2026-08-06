import { NextResponse } from "next/server";
import { searchDatasets } from "@/lib/datahub";

export async function GET() {
  try {
    const response = await searchDatasets("*");

    const body =
      typeof response.body === "string"
        ? JSON.parse(response.body)
        : response;

    const results =
  body?.data?.search?.searchResults?.map((item: any) => ({
    urn: item.entity.urn,

    name:
      item.entity.urn
        ?.split(",")[1]
        ?.replace(/_/g, " ") ?? "Unknown Dataset",

    description: "Enterprise dataset",

    platform: "Snowflake",
  })) ?? [];

    return NextResponse.json({
      datasets: results,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to search DataHub" },
      { status: 500 }
    );
  }
}