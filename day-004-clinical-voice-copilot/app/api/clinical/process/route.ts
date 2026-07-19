import { NextRequest, NextResponse } from "next/server";
import { generateSOAP } from "@/lib/clinical/soap";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    const soap = await generateSOAP(transcript);

    return NextResponse.json({
      transcript,
      soap,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to generate SOAP note." },
      { status: 500 }
    );
  }
}