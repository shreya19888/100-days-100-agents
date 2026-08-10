import { NextRequest, NextResponse } from "next/server";
import {
  isSimulationAvailable,
  listSimulationConcerns,
  simulateSkinImprovement,
  YouCamApiError,
  type SimulationConcern,
} from "@/lib/youcam";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({
    available: isSimulationAvailable(),
    concerns: isSimulationAvailable() ? listSimulationConcerns() : [],
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!isSimulationAvailable()) {
      return NextResponse.json(
        {
          error: "Skin simulation is available when a YouCam API key is configured.",
          available: false,
        },
        { status: 503 },
      );
    }

    const form = await request.formData();
    const file = form.get("image");
    const concern = String(form.get("concern") || "radiance") as SimulationConcern;
    const intensity = Number(form.get("intensity") || 0.6);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please include the same selfie used for analysis." }, { status: 400 });
    }

    const allowed = listSimulationConcerns();
    if (!allowed.includes(concern)) {
      return NextResponse.json({ error: "That simulation concern isn't supported." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const beforeImageDataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await simulateSkinImprovement({
      buffer,
      fileName: file.name || "selfie.jpg",
      contentType: file.type,
      concern,
      intensity: Number.isFinite(intensity) ? intensity : 0.6,
      beforeImageDataUrl: beforeImageDataUrl.length < 1_500_000 ? beforeImageDataUrl : undefined,
    });

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof YouCamApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Skin visualization couldn't complete right now." },
      { status: 500 },
    );
  }
}
