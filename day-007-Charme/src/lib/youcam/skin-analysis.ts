import { HD_SKIN_ACTIONS, SD_SKIN_ACTIONS, YouCamApiError } from "./types";
import type {
  YouCamFileMetaResponse,
  YouCamTaskCreateResponse,
  YouCamTaskPollResponse,
} from "./types";
import { youCamFetch, sleep, isYouCamConfigured } from "./client";
import { createAnalysisFromConcerns, mapYouCamOutputToConcerns } from "./normalize";
import { getDemoSkinAnalysis } from "@/data/demo/persona";
import { getImageDimensions } from "./image-size";
import type { SkinAnalysis } from "@/types";

function detectContentType(fileName: string, fallback?: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return fallback || "image/jpeg";
}

function chooseActions(buffer: Buffer): string[] {
  const size = getImageDimensions(buffer);
  const shortSide = size ? Math.min(size.width, size.height) : 0;

  // HD needs short side ≥ 1080. Webcam captures are often smaller → use SD.
  if (shortSide >= 1080) {
    return [...HD_SKIN_ACTIONS];
  }
  return [...SD_SKIN_ACTIONS];
}

function mapTaskError(message: string): YouCamApiError {
  const lower = message.toLowerCase();
  if (lower.includes("face") && (lower.includes("small") || lower.includes("too_small"))) {
    return new YouCamApiError(
      "Your face looks a bit small in the frame. Move closer so your face fills most of the photo.",
      "no_face",
    );
  }
  if (lower.includes("face") || lower.includes("no face")) {
    return new YouCamApiError(
      "We couldn't find a clear face in this photo. Try a front-facing selfie with even lighting.",
      "no_face",
    );
  }
  if (lower.includes("lighting") || lower.includes("dark")) {
    return new YouCamApiError(
      "The photo looks too dark. Try again near a window or with even front lighting.",
      "invalid_image",
    );
  }
  if (lower.includes("min_image") || lower.includes("below_min") || lower.includes("resolution")) {
    return new YouCamApiError(
      "That photo resolution is too low. Try uploading a clearer selfie (at least about 480px on the short side).",
      "invalid_image",
    );
  }
  if (lower.includes("out_of_bound")) {
    return new YouCamApiError(
      "Your face looks cut off in the frame. Center your face and try again.",
      "invalid_image",
    );
  }
  return new YouCamApiError(
    "We couldn't get a reliable reading from this photo. Try a front-facing photo with even lighting.",
    "invalid_image",
  );
}

async function uploadImageBuffer(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}): Promise<string> {
  const meta = await youCamFetch<YouCamFileMetaResponse>("/s2s/v2.0/file/skin-analysis", {
    method: "POST",
    body: JSON.stringify({
      files: [
        {
          content_type: params.contentType,
          file_name: params.fileName,
          file_size: params.buffer.byteLength,
        },
      ],
    }),
  });

  const file = meta.data?.files?.[0];
  const upload = file?.requests?.[0];
  if (!file?.file_id || !upload?.url) {
    throw new YouCamApiError("YouCam file upload metadata was incomplete.", "malformed_response");
  }

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(upload.url, {
      method: upload.method || "PUT",
      headers: upload.headers,
      body: new Uint8Array(params.buffer),
    });
  } catch (error) {
    console.error("[youcam] upload network error", error);
    throw new YouCamApiError(
      "We couldn't upload your photo securely. Please try again.",
      "api_error",
    );
  }

  if (!uploadResponse.ok) {
    throw new YouCamApiError(
      "We couldn't upload your photo securely. Please try again.",
      "api_error",
      uploadResponse.status,
    );
  }

  return file.file_id;
}

async function pollAnalysisTask(taskId: string, maxAttempts = 40): Promise<YouCamTaskPollResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await youCamFetch<YouCamTaskPollResponse>(
      `/s2s/v2.0/task/skin-analysis/${encodeURIComponent(taskId)}`,
      { method: "GET" },
    );

    if (result.data?.task_status === "success") return result;
    if (result.data?.task_status === "error") {
      const message = result.data.error || result.error || result.error_code || "";
      console.error("[youcam] task error", message, result);
      throw mapTaskError(message);
    }

    await sleep(1500);
  }

  throw new YouCamApiError(
    "Skin analysis is taking longer than expected. Please try again shortly.",
    "timeout",
  );
}

export async function analyzeSkinImage(params: {
  buffer: Buffer;
  fileName: string;
  contentType?: string;
  sourceImageDataUrl?: string;
  forceDemo?: boolean;
}): Promise<SkinAnalysis> {
  if (params.forceDemo || !isYouCamConfigured()) {
    return getDemoSkinAnalysis(params.sourceImageDataUrl);
  }

  const originalType = detectContentType(params.fileName, params.contentType);
  const { buildReframeAttempts } = await import("@/lib/ai/face-reframe");

  // Build progressively tighter reframes (OpenAI Vision + center zoom fallbacks)
  let candidates: Array<{ buffer: Buffer; contentType: string; label: string }> = [
    { buffer: params.buffer, contentType: originalType, label: "original" },
  ];
  try {
    const reframes = await buildReframeAttempts({
      buffer: params.buffer,
      contentType: originalType,
    });
    candidates = [...reframes, ...candidates];
  } catch (error) {
    console.error("[youcam] reframe attempts failed", error);
  }

  // Deduplicate by buffer length+first bytes roughly, keep order
  const seen = new Set<string>();
  candidates = candidates.filter((c) => {
    const key = `${c.buffer.byteLength}:${c.buffer[0]}:${c.buffer[10]}:${c.buffer[20]}:${c.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      console.info("[youcam] trying frame", candidate.label, candidate.buffer.byteLength);
      return await runYouCamAnalysis({
        buffer: candidate.buffer,
        fileName: "selfie.jpg",
        contentType: candidate.contentType,
        sourceImageDataUrl: params.sourceImageDataUrl,
      });
    } catch (error) {
      lastError = error;
      const isFaceIssue =
        error instanceof YouCamApiError &&
        (error.code === "no_face" || /face|small in the frame/i.test(error.message));
      if (!isFaceIssue) throw error;
      console.warn("[youcam] face framing rejected for", candidate.label, error.message);
      // try next tighter crop
    }
  }

  throw (
    lastError ||
    new YouCamApiError(
      "Your face looks a bit small in the frame. Move closer so your face fills most of the photo.",
      "no_face",
    )
  );
}

async function runYouCamAnalysis(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  sourceImageDataUrl?: string;
}): Promise<SkinAnalysis> {
  const dims = getImageDimensions(params.buffer);
  const shortSide = dims ? Math.min(dims.width, dims.height) : 0;
  if (dims && shortSide < 480) {
    throw new YouCamApiError(
      "That photo resolution is too low for analysis. Try a clearer selfie or move a bit closer to the camera.",
      "invalid_image",
    );
  }

  const actions = chooseActions(params.buffer);
  console.info(
    "[youcam] analyzing",
    dims ? `${dims.width}x${dims.height}` : "unknown-size",
    actions[0]?.startsWith("hd_") ? "HD" : "SD",
  );

  const fileId = await uploadImageBuffer({
    buffer: params.buffer,
    fileName: params.fileName,
    contentType: params.contentType,
  });

  const created = await youCamFetch<YouCamTaskCreateResponse>("/s2s/v2.0/task/skin-analysis", {
    method: "POST",
    body: JSON.stringify({
      src_file_id: fileId,
      dst_actions: actions,
      miniserver_args: {
        enable_mask_overlay: true,
      },
      format: "json",
    }),
  });

  const taskId = created.data?.task_id;
  if (!taskId) {
    throw new YouCamApiError("YouCam did not return a task id.", "malformed_response");
  }

  const polled = await pollAnalysisTask(taskId);
  const output = polled.data?.results?.output;
  if (!output || !Array.isArray(output)) {
    throw new YouCamApiError("YouCam analysis result was incomplete.", "malformed_response");
  }

  const concerns = mapYouCamOutputToConcerns(output);
  if (concerns.length === 0) {
    throw new YouCamApiError(
      "We couldn't interpret the skin analysis result. Please try another photo.",
      "malformed_response",
    );
  }

  const overall = output.find((o) => typeof o.score === "number" && !o.type)?.score;
  const skinType = output.find(
    (o) => o.type === "hd_skin_type" || o.type === "skin_type",
  );

  return createAnalysisFromConcerns({
    concerns,
    mode: "real",
    overallScore: overall ?? skinType?.ui_score,
    sourceImageDataUrl: params.sourceImageDataUrl,
  });
}

export { isYouCamConfigured };
