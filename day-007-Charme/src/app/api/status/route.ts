import { NextResponse } from "next/server";
import { isYouCamConfigured, YOUCAM_BASE_URL } from "@/lib/youcam";
import { isOpenAIConfigured } from "@/lib/ai/openai";

export async function GET() {
  const youcam = isYouCamConfigured();
  const ai = isOpenAIConfigured();

  let youcamReachable: boolean | null = null;
  let youcamReachError: string | null = null;
  if (youcam) {
    try {
      const res = await fetch(YOUCAM_BASE_URL, { method: "GET" });
      youcamReachable = res.status < 500;
    } catch (error) {
      youcamReachable = false;
      youcamReachError =
        error instanceof Error
          ? `${error.message}${error.cause instanceof Error ? ` (${error.cause.message})` : ""}`
          : "unknown";
    }
  }

  return NextResponse.json({
    youcamConfigured: youcam,
    youcamReachable,
    youcamReachError,
    aiConfigured: ai,
    openaiConfigured: ai,
    mode: youcam ? "real" : "demo",
    demoAvailable: true,
  });
}
