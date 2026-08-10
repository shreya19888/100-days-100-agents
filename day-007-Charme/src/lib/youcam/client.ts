import { YOUCAM_BASE_URL, YouCamApiError } from "./types";

export function getYouCamApiKey(): string | undefined {
  const key = process.env.YOUCAM_API_KEY?.trim();
  return key || undefined;
}

export function isYouCamConfigured(): boolean {
  return Boolean(getYouCamApiKey());
}

export function youCamAuthHeaders(): HeadersInit {
  const key = getYouCamApiKey();
  if (!key) {
    throw new YouCamApiError(
      "YouCam API key is not configured. Running without credentials uses demo mode.",
      "missing_key",
    );
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function youCamFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${YOUCAM_BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...youCamAuthHeaders(),
        ...(init?.headers || {}),
      },
    });
  } catch (error) {
    const detail =
      error instanceof Error
        ? `${error.message}${error.cause instanceof Error ? ` (${error.cause.message})` : ""}`
        : String(error);
    console.error("[youcam] network error", detail);

    const isTls = /certificate|CERT|TLS|SSL|UNABLE_TO_VERIFY|unable to verify/i.test(detail);
    throw new YouCamApiError(
      isTls
        ? "Secure connection to YouCam failed. Restart the app with: npm run dev (uses system certificates)."
        : "We couldn't reach YouCam right now. Please try again in a moment.",
      "api_error",
    );
  }

  let body: T & { error?: string; error_code?: string; status?: number };
  try {
    body = (await response.json()) as T & {
      error?: string;
      error_code?: string;
      status?: number;
    };
  } catch {
    throw new YouCamApiError(
      "YouCam returned an unexpected response.",
      "malformed_response",
      response.status,
    );
  }

  if (response.status === 401) {
    throw new YouCamApiError("YouCam API key appears invalid.", "api_error", 401);
  }
  if (response.status === 429) {
    throw new YouCamApiError(
      "YouCam is rate-limiting requests. Please wait a moment and try again.",
      "rate_limit",
      429,
    );
  }
  if (response.status === 400 && body.error_code === "CreditInsufficiency") {
    throw new YouCamApiError(
      "YouCam credits are insufficient for this analysis.",
      "credit_insufficiency",
      400,
    );
  }
  if (!response.ok) {
    console.error("[youcam] api error", response.status, body.error || body.error_code);
    throw new YouCamApiError(
      body.error || "YouCam request failed.",
      "api_error",
      response.status,
    );
  }

  return body;
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
