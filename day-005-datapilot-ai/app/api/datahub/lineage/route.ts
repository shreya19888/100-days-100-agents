import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Lineage endpoint coming soon.",
  });
}