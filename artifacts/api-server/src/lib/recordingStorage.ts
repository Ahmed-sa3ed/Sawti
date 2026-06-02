import type { Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger.js";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

const supabaseUrl = getRequiredEnv("SUPABASE_URL");
const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const bucketName = process.env.SUPABASE_STORAGE_BUCKET ?? "recordings";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function downloadRecordingBlob(objectPath: string): Promise<Blob | null> {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(objectPath);

  if (error) {
    if (
      error.message.toLowerCase().includes("not found") ||
      error.message.toLowerCase().includes("does not exist")
    ) {
      return null;
    }

    throw error;
  }

  return data;
}

export async function uploadRecordingBuffer(
  buffer: Buffer,
  objectPath: string,
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(objectPath, buffer, {
      contentType: "audio/wav",
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
}

export async function deleteRecording(objectPath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([objectPath]);

    if (error) {
      logger.warn({ error, objectPath }, "failed to delete recording from Supabase");
    }
  } catch (err) {
    logger.warn({ err, objectPath }, "failed to delete recording from Supabase");
  }
}

export async function streamRecordingToResponse(
  objectPath: string,
  res: Response,
): Promise<void> {
  let blob: Blob | null;

  try {
    blob = await downloadRecordingBlob(objectPath);
  } catch (err) {
    logger.error({ err, objectPath }, "failed to download recording from Supabase");
    res.status(500).json({ error: "تعذر الوصول إلى الملف الصوتي" });
    return;
  }

  if (!blob) {
    res.status(404).json({ error: "الملف الصوتي غير موجود" });
    return;
  }

  const buffer = Buffer.from(await blob.arrayBuffer());

  res.setHeader("Content-Type", blob.type || "audio/wav");
  res.setHeader("Content-Length", buffer.length.toString());
  res.setHeader("Accept-Ranges", "bytes");
  res.end(buffer);
}

export async function downloadRecordingBuffer(
  objectPath: string,
): Promise<Buffer | null> {
  try {
    const blob = await downloadRecordingBlob(objectPath);
    if (!blob) return null;

    return Buffer.from(await blob.arrayBuffer());
  } catch (err) {
    logger.warn({ err, objectPath }, "failed to download recording buffer");
    return null;
  }
}

export async function checkRecordingExists(
  objectPath: string,
): Promise<boolean | null> {
  try {
    const blob = await downloadRecordingBlob(objectPath);
    return blob !== null;
  } catch (err) {
    logger.warn({ err, objectPath }, "checkRecordingExists failed");
    return null;
  }
}