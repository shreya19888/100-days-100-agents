import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json([]);
  }

  const apiKey = process.env.WEATHERAPI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API key" },
      { status: 500 }
    );
  }

  const url =
    `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${encodeURIComponent(query)}`;

  const response = await fetch(url);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Search failed" },
      { status: response.status }
    );
  }

  const data = await response.json();

  return NextResponse.json(data);
}