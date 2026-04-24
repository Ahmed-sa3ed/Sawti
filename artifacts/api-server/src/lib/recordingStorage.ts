import { Readable } from "stream";
import type { Response } from "express";
import { logger } from "./logger.js";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const SIGNED_URL_TTL_SEC = 900;

function getBucketAndObject(objectPath: string): { bucketName: string; objectName: string } {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    throw new Error(
      "DEFAULT_OBJECT_STORAGE_BUCKET_ID is not set. Object storage has not been provisioned."
    );
  }
  return { bucketName: bucketId, objectName: objectPath };
}

async function getSignedUrl(
  bucketName: string,
  objectName: string,
  method: "GET" | "PUT" | "DELETE"
): Promise<string> {
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket_name: bucketName,
        object_name: objectName,
        method,
        expires_at: new Date(Date.now() + SIGNED_URL_TTL_SEC * 1000).toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Sidecar returned ${response.status} when signing ${method} URL for "${objectName}"`
    );
  }
  const body = (await response.json()) as { signed_url: string };
  return body.signed_url;
}

export async function uploadRecordingBuffer(
  buffer: Buffer,
  objectPath: string
): Promise<void> {
  const { bucketName, objectName } = getBucketAndObject(objectPath);
  const url = await getSignedUrl(bucketName, objectName, "PUT");
  const uploadResponse = await fetch(url, {
    method: "PUT",
    body: buffer,
    headers: { "Content-Type": "audio/wav" },
  });
  if (!uploadResponse.ok) {
    throw new Error(`GCS upload failed with status ${uploadResponse.status}`);
  }
}

export async function deleteRecording(objectPath: string): Promise<void> {
  try {
    const { bucketName, objectName } = getBucketAndObject(objectPath);
    const url = await getSignedUrl(bucketName, objectName, "DELETE");
    await fetch(url, { method: "DELETE" });
  } catch {
    // Best-effort: ignore errors when deleting
  }
}

export async function streamRecordingToResponse(
  objectPath: string,
  res: Response
): Promise<void> {
  let url: string;
  try {
    const { bucketName, objectName } = getBucketAndObject(objectPath);
    url = await getSignedUrl(bucketName, objectName, "GET");
  } catch (err) {
    logger.error({ err, objectPath }, "failed to get signed URL for recording");
    res.status(500).json({ error: "تعذر الوصول إلى الملف الصوتي" });
    return;
  }

  const gcsResponse = await fetch(url);
  if (gcsResponse.status === 404) {
    res.status(404).json({ error: "الملف الصوتي غير موجود" });
    return;
  }
  if (!gcsResponse.ok) {
    logger.error({ status: gcsResponse.status, objectPath }, "GCS returned error for recording");
    res.status(502).json({ error: "تعذر تحميل الملف الصوتي" });
    return;
  }

  res.setHeader("Content-Type", gcsResponse.headers.get("content-type") ?? "audio/wav");
  const contentLength = gcsResponse.headers.get("content-length");
  if (contentLength) {
    res.setHeader("Content-Length", contentLength);
  }
  res.setHeader("Accept-Ranges", "bytes");

  if (gcsResponse.body) {
    Readable.fromWeb(gcsResponse.body as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
  } else {
    res.end();
  }
}

export async function downloadRecordingBuffer(objectPath: string): Promise<Buffer | null> {
  try {
    const { bucketName, objectName } = getBucketAndObject(objectPath);
    const url = await getSignedUrl(bucketName, objectName, "GET");
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}
