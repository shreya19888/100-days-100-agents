import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Latitude and longitude are required." },
      { status: 400 }
    );
  }

  const apiKey = process.env.WEATHERAPI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "WeatherAPI key not found." },
      { status: 500 }
    );
  }

  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=yes`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.text();

    return NextResponse.json(
      {
        status: response.status,
        error,
      },
      { status: response.status }
    );
  }

  const data = await response.json();

  return NextResponse.json({
    city: data.location.name,
    region: data.location.region,
    country: data.location.country,

    temperature: data.current.temp_c,
    feelsLike: data.current.feelslike_c,
    humidity: data.current.humidity,

    wind: data.current.wind_kph,
    uv: data.current.uv,

    condition: data.current.condition.text,
    icon: `https:${data.current.condition.icon}`,

    airQuality: data.current.air_quality["us-epa-index"],
  });
}