import { NextRequest, NextResponse } from "next/server";
import { analyzeSkinImage, isYouCamConfigured, YouCamApiError } from "@/lib/youcam";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 8 * 1024 * 1024;

export async function GET() {
  return NextResponse.json({
    configured: isYouCamConfigured(),
    mode: isYouCamConfigured() ? "real" : "demo",
  });
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("image");
    const forceDemo = form.get("forceDemo") === "true";
    const isRecheck = form.get("recheck") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a photo to continue." },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "That file doesn't look like an image. Try a JPG or PNG selfie." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "That photo is a bit large. Try one under 8MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Demo recheck path uses improved persona when no API key
    if ((forceDemo || !isYouCamConfigured()) && isRecheck) {
      const { getDemoRecheckAnalysis } = await import("@/data/demo/persona");
      const analysis = getDemoRecheckAnalysis(dataUrl);
      return NextResponse.json({
        analysis,
        mode: "demo",
        configured: false,
      });
    }

    const analysis = await analyzeSkinImage({
      buffer,
      fileName: file.name || "selfie.jpg",
      contentType: file.type,
      sourceImageDataUrl: dataUrl,
      forceDemo,
    });

    const { sourceImageDataUrl: _omit, ...safeAnalysis } = analysis;
    void _omit;

    return NextResponse.json({
      analysis: safeAnalysis,
      previewDataUrl: dataUrl.length < 1_500_000 ? dataUrl : undefined,
      mode: analysis.mode,
      configured: isYouCamConfigured(),
    });
  } catch (error) {
    if (error instanceof YouCamApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status && error.status >= 400 ? error.status : 400 },
      );
    }
    console.error("[skin-analysis] unexpected error", error);
    return NextResponse.json(
      {
        error:
          "Something went wrong while reading your photo. Please try another selfie with even lighting.",
      },
      { status: 500 },
    );
  }
}
