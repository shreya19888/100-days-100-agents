export const YOUCAM_BASE_URL = "https://yce-api-01.makeupar.com";

/** HD requires short side ≥ 1080px */
export const HD_SKIN_ACTIONS = [
  "hd_moisture",
  "hd_redness",
  "hd_radiance",
  "hd_oiliness",
  "hd_pore",
  "hd_texture",
  "hd_acne",
  "hd_age_spot",
  "hd_wrinkle",
  "hd_dark_circle",
  "hd_eye_bag",
  "hd_firmness",
  "hd_skin_type",
] as const;

/** SD requires short side ≥ 480px — better for webcam selfies */
export const SD_SKIN_ACTIONS = [
  "moisture",
  "redness",
  "radiance",
  "oiliness",
  "pore",
  "texture",
  "acne",
  "age_spot",
  "wrinkle",
  "dark_circle_v2",
  "eye_bag",
  "firmness",
  "skin_type",
] as const;

export type YouCamHdAction = (typeof HD_SKIN_ACTIONS)[number];
export type YouCamSdAction = (typeof SD_SKIN_ACTIONS)[number];

export interface YouCamFileMetaRequest {
  files: Array<{
    content_type: string;
    file_name: string;
    file_size: number;
  }>;
}

export interface YouCamUploadRequestInfo {
  method: string;
  url: string;
  headers: Record<string, string>;
}

export interface YouCamFileMetaResponse {
  status: number;
  data: {
    files: Array<{
      content_type: string;
      file_name: string;
      file_id: string;
      requests: YouCamUploadRequestInfo[];
    }>;
  };
  error?: string;
  error_code?: string;
}

export interface YouCamTaskCreateResponse {
  status: number;
  data: {
    task_id: string;
  };
  error?: string;
  error_code?: string;
}

export interface YouCamAnalysisOutputItem {
  type: string;
  region?: string;
  raw_score?: number;
  ui_score?: number;
  score?: number;
  mask_urls?: string[];
  output_mask_name?: string;
}

export interface YouCamTaskPollResponse {
  status: number;
  data: {
    task_status: "running" | "success" | "error";
    results?: {
      output?: YouCamAnalysisOutputItem[];
      url?: string;
    };
    error?: string;
  };
  error?: string;
  error_code?: string;
}

export interface YouCamSimulationTaskBody {
  src_file_id?: string;
  src_file_url?: string;
  wrinkle?: number;
  radiance?: number;
  oiliness?: number;
  acne?: number;
  eye_bags?: number;
  dark_circle?: number;
  spots?: number;
  pores?: number;
  texture?: number;
  redness?: number;
}

export interface YouCamSimulationPollResponse {
  status: number;
  data: {
    task_status: "running" | "success" | "error";
    results?: {
      url?: string;
      output?: Array<{ url?: string; type?: string }>;
    };
    error?: string;
  };
  error?: string;
  error_code?: string;
}

export class YouCamApiError extends Error {
  constructor(
    message: string,
    public code:
      | "missing_key"
      | "invalid_image"
      | "no_face"
      | "rate_limit"
      | "timeout"
      | "api_error"
      | "malformed_response"
      | "credit_insufficiency"
      | "unknown",
    public status?: number,
  ) {
    super(message);
    this.name = "YouCamApiError";
  }
}
