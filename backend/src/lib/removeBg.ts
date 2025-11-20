import FormData from "form-data";
import fetch, { BodyInit, Response } from "node-fetch";

type RemoveBgErrorCode =
  | "config"
  | "invalid_image"
  | "insufficient_credits"
  | "rate_limited"
  | "timeout"
  | "network"
  | "unknown";

export class RemoveBgError extends Error {
  public readonly statusCode: number;
  public readonly code: RemoveBgErrorCode;

  constructor(message: string, statusCode: number, code: RemoveBgErrorCode = "unknown") {
    super(message);
    this.name = "RemoveBgError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

type RemoveBgOptions = {
  buffer: Buffer;
  fileName?: string | null;
  mimeType?: string | null;
  timeoutMs?: number;
};

type RemoveBgResult = {
  buffer: Buffer;
  mimeType: string;
  fromCache: boolean;
};

const DEFAULT_TIMEOUT_MS = Number(process.env.REMOVE_BG_TIMEOUT_MS ?? 25000);
const API_URL = process.env.REMOVE_BG_API_URL ?? "https://api.remove.bg/v1.0/removebg";
const MAX_REMOVE_BG_FILE_BYTES = 12 * 1024 * 1024; // service hard-limit

export async function removeBackgroundFromImage(opts: RemoveBgOptions): Promise<RemoveBgResult> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    throw new RemoveBgError("remove.bg API key is not configured.", 500, "config");
  }
  if (!opts.buffer?.length) {
    throw new RemoveBgError("Image buffer is empty.", 400, "invalid_image");
  }
  if (opts.buffer.length > MAX_REMOVE_BG_FILE_BYTES) {
    throw new RemoveBgError(
      "Image is too large for remove.bg (max 12MB).",
      413,
      "invalid_image"
    );
  }

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const form = new FormData();
    form.append("size", "auto");
    form.append("format", "png");
    form.append("image_file", opts.buffer, {
      filename: opts.fileName || `upload-${Date.now()}.png`,
      contentType: opts.mimeType || "application/octet-stream"
    });

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        ...form.getHeaders()
      },
      body: form as unknown as BodyInit,
      signal: controller.signal
    });

    if (!response.ok) {
      const err = await parseRemoveBgError(response);
      throw err;
    }

    const mimeType = response.headers.get("content-type") || "image/png";
    const buffer = await response.buffer();
    const fromCache = response.headers.get("x-from-cache") === "1";

    return { buffer, mimeType, fromCache };
  } catch (error) {
    if (error instanceof RemoveBgError) {
      throw error;
    }
    if ((error as Error).name === "AbortError") {
      throw new RemoveBgError("remove.bg request timed out.", 504, "timeout");
    }
    throw new RemoveBgError("remove.bg request failed.", 502, "network");
  } finally {
    clearTimeout(timeout);
  }
}

async function parseRemoveBgError(response: Response): Promise<RemoveBgError> {
  const status = response.status;
  const contentType = response.headers.get("content-type") || "";
  let message = `remove.bg request failed (${status}).`;
  let code: RemoveBgErrorCode = "unknown";

  if (contentType.includes("application/json")) {
    const body = (await response.json().catch(() => null)) as
      | { errors?: Array<{ title?: string; detail?: string; code?: string }> }
      | null;
    const firstError = body?.errors?.[0];
    if (firstError?.title) {
      message = firstError.title;
    }
    if (firstError?.detail) {
      message += ` ${firstError.detail}`;
    }
    const errorCode = firstError?.code?.toLowerCase();
    if (errorCode) {
      if (errorCode.includes("insufficient_credits")) {
        code = "insufficient_credits";
      } else if (errorCode.includes("rate_limit")) {
        code = "rate_limited";
      } else if (errorCode.includes("image")) {
        code = "invalid_image";
      }
    }
  } else {
    const text = await response.text().catch(() => "");
    if (text) {
      message = text;
    }
  }

  return new RemoveBgError(message, status, code);
}
