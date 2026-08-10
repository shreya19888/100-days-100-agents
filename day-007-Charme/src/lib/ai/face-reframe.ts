import { z } from "zod";
import sharp from "sharp";
import { getOpenAIConfig, isOpenAIConfigured } from "./openai";
import { getImageDimensions } from "@/lib/youcam/image-size";

const FaceBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0.02).max(1),
  height: z.number().min(0.02).max(1),
  found: z.boolean().optional(),
});

export type FaceBox = z.infer<typeof FaceBoxSchema>;

/**
 * Build multiple reframed candidates for YouCam.
 * OpenAI Vision is called at most once; then we generate tighter crops + center zooms.
 */
export async function buildReframeAttempts(params: {
  buffer: Buffer;
  contentType: string;
}): Promise<Array<{ buffer: Buffer; contentType: string; label: string }>> {
  const dims = getImageDimensions(params.buffer);
  if (!dims) return [];

  const attempts: Array<{ buffer: Buffer; contentType: string; label: string }> = [];
  let box: FaceBox | null = null;

  if (isOpenAIConfigured()) {
    try {
      box = await detectFaceBoxWithOpenAI(params.buffer, params.contentType);
      console.info("[face-reframe] OpenAI face box", box);
    } catch (error) {
      console.error("[face-reframe] OpenAI detection failed", error);
    }
  }

  // Progressive LLM-guided crops (discount loose boxes more each step)
  if (box) {
    const configs = [
      { fill: 0.82, discount: 0.72, label: "openai-crop-a" },
      { fill: 0.88, discount: 0.6, label: "openai-crop-b" },
      { fill: 0.92, discount: 0.5, label: "openai-crop-c" },
    ];
    for (const cfg of configs) {
      try {
        const buffer = await cropAroundFace(
          params.buffer,
          dims,
          box,
          cfg.fill,
          cfg.discount,
        );
        attempts.push({ buffer, contentType: "image/jpeg", label: cfg.label });
      } catch (error) {
        console.error("[face-reframe] crop failed", cfg.label, error);
      }
    }
  }

  // Deterministic center zooms — reliable for webcam selfies
  for (const zoom of [0.55, 0.42, 0.34, 0.26]) {
    try {
      const buffer = await centerZoom(params.buffer, dims, zoom);
      attempts.push({
        buffer,
        contentType: "image/jpeg",
        label: `center-zoom-${zoom}`,
      });
    } catch (error) {
      console.error("[face-reframe] center zoom failed", zoom, error);
    }
  }

  return attempts;
}

async function detectFaceBoxWithOpenAI(
  buffer: Buffer,
  contentType: string,
): Promise<FaceBox | null> {
  const { apiKey, baseUrl, model } = getOpenAIConfig();
  if (!apiKey) return null;

  const preview = await sharp(buffer)
    .rotate()
    .resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const dataUrl = `data:image/jpeg;base64,${preview.toString("base64")}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Locate ONLY the facial skin oval (forehead to chin, cheek to cheek). Do NOT include hair, neck, or shoulders. Coordinates are normalized 0-1, origin top-left. Return JSON only.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Return:
{"found":true,"x":0.0,"y":0.0,"width":0.0,"height":0.0}
x,y = top-left of the tight face oval. width/height as fractions of the image. Prefer a TIGHT box around the face only.`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("[face-reframe] OpenAI vision failed", response.status, errText.slice(0, 300));
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = FaceBoxSchema.parse(JSON.parse(content));
    if (parsed.found === false) return null;
    const x = Math.min(Math.max(parsed.x, 0), 0.95);
    const y = Math.min(Math.max(parsed.y, 0), 0.95);
    const width = Math.min(Math.max(parsed.width, 0.05), 1 - x);
    const height = Math.min(Math.max(parsed.height, 0.05), 1 - y);
    return { found: true, x, y, width, height };
  } catch (error) {
    console.error("[face-reframe] invalid bbox", content, error);
    return null;
  }
}

async function cropAroundFace(
  buffer: Buffer,
  dims: { width: number; height: number },
  box: FaceBox,
  targetFaceRatio: number,
  boxDiscount: number,
): Promise<Buffer> {
  const faceW = box.width * dims.width * boxDiscount;
  const faceH = box.height * dims.height * boxDiscount;
  const faceCx = (box.x + box.width / 2) * dims.width;
  const faceCy = (box.y + box.height / 2) * dims.height;

  let cropW = faceW / targetFaceRatio;
  let cropH = faceH / Math.min(targetFaceRatio + 0.02, 0.95);

  const desiredAspect = 3 / 4;
  if (cropW / cropH > desiredAspect) {
    cropH = cropW / desiredAspect;
  } else {
    cropW = cropH * desiredAspect;
  }

  cropW = Math.min(cropW, dims.width);
  cropH = Math.min(cropH, dims.height);

  let left = Math.round(faceCx - cropW / 2);
  let top = Math.round(faceCy - cropH / 2);
  const width = Math.max(32, Math.round(cropW));
  const height = Math.max(32, Math.round(cropH));
  left = Math.max(0, Math.min(left, dims.width - width));
  top = Math.max(0, Math.min(top, dims.height - height));

  return finalizeCrop(buffer, left, top, width, height);
}

async function centerZoom(
  buffer: Buffer,
  dims: { width: number; height: number },
  fraction: number,
): Promise<Buffer> {
  const width = Math.max(32, Math.round(dims.width * fraction));
  const height = Math.max(32, Math.round(dims.height * fraction));
  const left = Math.round((dims.width - width) / 2);
  const top = Math.max(0, Math.round((dims.height - height) / 2 - dims.height * 0.04));
  return finalizeCrop(buffer, left, Math.min(top, dims.height - height), width, height);
}

async function finalizeCrop(
  buffer: Buffer,
  left: number,
  top: number,
  width: number,
  height: number,
): Promise<Buffer> {
  let pipeline = sharp(buffer).rotate().extract({ left, top, width, height });

  const shortSide = Math.min(width, height);
  if (shortSide < 720) {
    const scale = 720 / shortSide;
    pipeline = pipeline.resize({
      width: Math.round(width * scale),
      height: Math.round(height * scale),
      fit: "fill",
      kernel: "lanczos3",
    });
  }

  return pipeline.jpeg({ quality: 93 }).toBuffer();
}
