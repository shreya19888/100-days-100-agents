import { YouCamApiError } from "./types";
import type {
  YouCamFileMetaResponse,
  YouCamTaskCreateResponse,
  YouCamSimulationPollResponse,
  YouCamSimulationTaskBody,
} from "./types";
import { youCamFetch, sleep, isYouCamConfigured } from "./client";
import type { SimulationResult } from "@/types";

const SIMULATION_CONCERNS = [
  "radiance",
  "redness",
  "texture",
  "pores",
  "acne",
  "wrinkle",
  "oiliness",
  "dark_circle",
  "eye_bags",
  "spots",
] as const;

export type SimulationConcern = (typeof SIMULATION_CONCERNS)[number];

export function isSimulationAvailable(): boolean {
  return isYouCamConfigured();
}

export function listSimulationConcerns(): SimulationConcern[] {
  return [...SIMULATION_CONCERNS];
}

async function uploadSimulationImage(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}): Promise<string> {
  const meta = await youCamFetch<YouCamFileMetaResponse>("/s2s/v2.0/file/skin-simulation", {
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
    throw new YouCamApiError("YouCam simulation upload metadata was incomplete.", "malformed_response");
  }

  const uploadResponse = await fetch(upload.url, {
    method: upload.method || "PUT",
    headers: upload.headers,
    body: new Uint8Array(params.buffer),
  });

  if (!uploadResponse.ok) {
    throw new YouCamApiError(
      "We couldn't upload your photo for visualization.",
      "api_error",
      uploadResponse.status,
    );
  }

  return file.file_id;
}

async function pollSimulation(taskId: string, maxAttempts = 40): Promise<YouCamSimulationPollResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await youCamFetch<YouCamSimulationPollResponse>(
      `/s2s/v2.0/task/skin-simulation/${encodeURIComponent(taskId)}`,
      { method: "GET" },
    );
    if (result.data?.task_status === "success") return result;
    if (result.data?.task_status === "error") {
      throw new YouCamApiError(
        "Skin visualization couldn't complete for this photo.",
        "api_error",
      );
    }
    await sleep(1500);
  }
  throw new YouCamApiError("Skin visualization timed out. Please try again.", "timeout");
}

function buildSimulationBody(
  concern: SimulationConcern,
  intensity: number,
  fileId: string,
): YouCamSimulationTaskBody {
  const body: YouCamSimulationTaskBody = { src_file_id: fileId };
  const value = Math.min(1, Math.max(0.1, intensity));
  switch (concern) {
    case "radiance":
      body.radiance = value;
      break;
    case "redness":
      body.redness = value;
      break;
    case "texture":
      body.texture = value;
      break;
    case "pores":
      body.pores = value;
      break;
    case "acne":
      body.acne = value;
      break;
    case "wrinkle":
      body.wrinkle = value;
      break;
    case "oiliness":
      body.oiliness = value;
      break;
    case "dark_circle":
      body.dark_circle = value;
      break;
    case "eye_bags":
      body.eye_bags = value;
      break;
    case "spots":
      body.spots = value;
      break;
  }
  return body;
}

export async function simulateSkinImprovement(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  concern: SimulationConcern;
  intensity?: number;
  beforeImageDataUrl?: string;
}): Promise<SimulationResult> {
  if (!isYouCamConfigured()) {
    throw new YouCamApiError(
      "Skin simulation requires a configured YouCam API key.",
      "missing_key",
    );
  }

  const fileId = await uploadSimulationImage({
    buffer: params.buffer,
    fileName: params.fileName,
    contentType: params.contentType,
  });

  const intensity = params.intensity ?? 0.6;
  const created = await youCamFetch<YouCamTaskCreateResponse>("/s2s/v2.0/task/skin-simulation", {
    method: "POST",
    body: JSON.stringify(buildSimulationBody(params.concern, intensity, fileId)),
  });

  const taskId = created.data?.task_id;
  if (!taskId) {
    throw new YouCamApiError("YouCam did not return a simulation task id.", "malformed_response");
  }

  const polled = await pollSimulation(taskId);
  const afterUrl =
    polled.data?.results?.url ||
    polled.data?.results?.output?.find((o) => o.url)?.url;

  if (!afterUrl) {
    throw new YouCamApiError("Simulation completed without an image URL.", "malformed_response");
  }

  return {
    concern: params.concern,
    intensity,
    beforeImageDataUrl: params.beforeImageDataUrl,
    afterImageUrl: afterUrl,
    disclaimer:
      "Optional cosmetic visualization. This illustrates a simulated appearance change based on selected characteristics. It does not define healthy or beautiful skin, and it is not a prediction of actual results.",
  };
}
