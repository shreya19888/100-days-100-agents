import { NextRequest, NextResponse } from "next/server";
import { searchDatasets } from "@/lib/datahub";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Dataset id required" },
        { status: 400 }
      );
    }

    const response = await searchDatasets(id);

    const body =
      typeof response.body === "string"
        ? JSON.parse(response.body)
        : response;

    const entity =
      body?.data?.search?.searchResults?.[0]?.entity;

    if (!entity) {
      return NextResponse.json(
        { error: "Dataset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      urn: entity.urn,

      name:
        entity.properties?.name ??
        id.replace(/-/g, " "),

      description:
        entity.properties?.description ??
        "No description available.",

      platform:
        entity.platform?.name ??
        "Snowflake",

      domain:
        entity.domain?.domain?.urn
          ?.split(":")
          .pop() ??
        "Enterprise",

      owner:
        entity.ownership?.owners?.[0]?.owner?.urn
          ?.split(":")
          .pop() ??
        "Unknown",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to fetch dataset" },
      { status: 500 }
    );
  }
}