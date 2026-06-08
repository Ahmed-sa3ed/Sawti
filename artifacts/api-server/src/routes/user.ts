import { Router } from "express";
import { db } from "@workspace/db";
import {
  sentencesTable,
  sessionsTable,
  userSessionsTable,
  recordingsTable,
  suggestionsTable,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import ffmpegStatic from "ffmpeg-static";
import { CreateSuggestionBody } from "@workspace/api-zod";
import { requireUser } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";
import {
  uploadRecordingBuffer,
  deleteRecording,
} from "../lib/recordingStorage.js";

const execAsync = promisify(exec);

const router = Router();
router.use(requireUser);

function getRecordingObjectPath(userId: number, sessionName: string, timestamp: number): string {
  const safeName = sessionName.replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, "_");
  return `recordings/${userId}/${safeName}/recording_${timestamp}.wav`;
}

async function convertToWav16kMono(inputBuffer: Buffer, inputMimeType: string): Promise<Buffer> {
  const tmpDir = path.join(process.cwd(), "recordings", "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  const timestamp = Date.now();
  const ext = inputMimeType.includes("webm")
    ? ".webm"
    : inputMimeType.includes("ogg")
    ? ".ogg"
    : inputMimeType.includes("mp4")
    ? ".mp4"
    : ".audio";
  const inputPath = path.join(tmpDir, `input_${timestamp}${ext}`);
  const outputPath = path.join(tmpDir, `output_${timestamp}.wav`);

  fs.writeFileSync(inputPath, inputBuffer);

  try {
    const ffmpegBin = ffmpegStatic ?? "ffmpeg";
    const cmd = `${JSON.stringify(ffmpegBin)} -y -i ${JSON.stringify(inputPath)} -ar 16000 -ac 1 -acodec pcm_s16le ${JSON.stringify(outputPath)}`;
    const { stderr } = await execAsync(cmd);
    if (stderr) logger.debug({ stderr }, "ffmpeg stderr");

    const wavBuffer = fs.readFileSync(outputPath);
    return wavBuffer;
  } catch (err) {
    logger.error({ err, inputMimeType }, "ffmpeg conversion failed");
    throw err;
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get("/sessions", async (req, res) => {
  const userId = req.session.userId!;

  const userSessions = await db
    .select({
      sessionId: userSessionsTable.sessionId,
    })
    .from(userSessionsTable)
    .where(eq(userSessionsTable.userId, userId));

  if (userSessions.length === 0) {
    res.json([]);
    return;
  }

  const sessionIds = userSessions.map((us) => us.sessionId);

  const filteredSessions = await db
    .select()
    .from(sessionsTable)
    .where(inArray(sessionsTable.id, sessionIds));

  const result = await Promise.all(
    filteredSessions.map(async (session) => {
      const sentences = await db
        .select()
        .from(sentencesTable)
        .where(
          and(
            eq(sentencesTable.sessionId, session.id),
            eq(sentencesTable.assignedUserId, userId)
          )
        );

      const recordings = await db
        .select()
        .from(recordingsTable)
        .where(
          and(
            eq(recordingsTable.userId, userId),
            eq(recordingsTable.sessionId, session.id)
          )
        );

      return {
        id: session.id,
        name: session.name,
        description: session.description,
        totalSentences: sentences.length,
        recordedCount: recordings.length,
        acceptedCount: recordings.filter((r) => r.status === "accepted").length,
      };
    })
  );

  res.json(result);
});

router.get("/sessions/:sessionId/sentences", async (req, res) => {
  const userId = req.session.userId!;
  const sessionId = parseInt(req.params.sessionId);

  if (isNaN(sessionId)) {
    res.status(400).json({ error: "معرف غير صالح" });
    return;
  }

  const [userSession] = await db
    .select()
    .from(userSessionsTable)
    .where(
      and(
        eq(userSessionsTable.userId, userId),
        eq(userSessionsTable.sessionId, sessionId)
      )
    )
    .limit(1);

  if (!userSession) {
    res.status(403).json({ error: "غير مصرح بالوصول إلى هذه الجلسة" });
    return;
  }

  const sentences = await db
    .select()
    .from(sentencesTable)
    .where(
      and(
        eq(sentencesTable.sessionId, sessionId),
        eq(sentencesTable.assignedUserId, userId)
      )
    );

  const recordings = await db
    .select()
    .from(recordingsTable)
    .where(
      and(
        eq(recordingsTable.userId, userId),
        eq(recordingsTable.sessionId, sessionId)
      )
    );

  const recordingMap = new Map(
    recordings.map((r) => [r.sentenceId, r])
  );

  const result = sentences
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((sentence) => {
      const recording = recordingMap.get(sentence.id);
      return {
        id: sentence.id,
        text: sentence.text,
        orderIndex: sentence.orderIndex,
        recordingId: recording?.id ?? null,
        recordingStatus: recording?.status ?? null,
      };
    });

  res.json(result);
});

router.post("/recordings", upload.single("audio"), async (req, res) => {
  const userId = req.session.userId!;
  const file = req.file;

  if (!file || !file.buffer) {
    res.status(400).json({ error: "لم يتم رفع الملف الصوتي" });
    return;
  }

  const sentenceId = parseInt(req.body.sentenceId);
  const sessionId = parseInt(req.body.sessionId);

  if (isNaN(sentenceId) || isNaN(sessionId)) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }

  // Authorization check: verify user is assigned to this session
  const [userSession] = await db
    .select()
    .from(userSessionsTable)
    .where(
      and(
        eq(userSessionsTable.userId, userId),
        eq(userSessionsTable.sessionId, sessionId)
      )
    )
    .limit(1);

  if (!userSession) {
    res.status(403).json({ error: "غير مصرح بالوصول إلى هذه الجلسة" });
    return;
  }

  // Authorization check: verify the sentence belongs to this user
  const [sentence] = await db
    .select()
    .from(sentencesTable)
    .where(
      and(
        eq(sentencesTable.id, sentenceId),
        eq(sentencesTable.sessionId, sessionId),
        eq(sentencesTable.assignedUserId, userId)
      )
    )
    .limit(1);

  if (!sentence) {
    res.status(403).json({ error: "هذه الجملة غير مخصصة لك" });
    return;
  }

  // Convert uploaded audio to WAV 16kHz mono using ffmpeg
  let wavBuffer: Buffer;
  try {
    wavBuffer = await convertToWav16kMono(file.buffer, file.mimetype);
  } catch (convErr) {
    res.status(422).json({ error: "تعذر معالجة الملف الصوتي. يرجى التحقق من صحة الملف." });
    return;
  }

  // Determine output object path and upload to object storage
  const [sessionRow] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .limit(1);

  const timestamp = Date.now();
  const objectPath = getRecordingObjectPath(userId, sessionRow?.name ?? String(sessionId), timestamp);

  try {
    await uploadRecordingBuffer(wavBuffer, objectPath);
  } catch (uploadErr) {
    const uploadErrMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
    logger.error({ err: uploadErr, uploadErrMsg }, "failed to upload recording to object storage");
    res.status(500).json({ error: "تعذر حفظ الملف الصوتي. يرجى المحاولة مجدداً." });
    return;
  }

  // Delete any existing recordings for this sentence by this user (and their files)
  const existingRecordings = await db
    .select()
    .from(recordingsTable)
    .where(
      and(
        eq(recordingsTable.userId, userId),
        eq(recordingsTable.sentenceId, sentenceId)
      )
    );

  for (const existing of existingRecordings) {
    await deleteRecording(existing.filePath);
    await db.delete(recordingsTable).where(eq(recordingsTable.id, existing.id));
  }

  const inserted = await db
    .insert(recordingsTable)
    .values({
      userId,
      sessionId,
      sentenceId,
      filePath: objectPath,
    })
    .returning();

  const recording = inserted[0];

  res.status(201).json({
    id: recording.id,
    sentenceId: recording.sentenceId,
    sessionId: recording.sessionId,
    status: recording.status,
    createdAt: recording.createdAt.toISOString(),
  });
});

router.get("/tts", async (req, res) => {
  const text = req.query.text;
  if (!text || typeof text !== "string" || text.trim() === "") {
    res.status(400).json({ error: "النص مطلوب" });
    return;
  }

  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.trim())}&tl=ar&client=tw-ob`;

  try {
    const ttsResponse = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/",
      },
    });

    if (!ttsResponse.ok) {
      res.status(502).json({ error: "تعذر الحصول على الصوت" });
      return;
    }

    const contentType = ttsResponse.headers.get("content-type") ?? "audio/mpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");

    const arrayBuffer = await ttsResponse.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch {
    res.status(502).json({ error: "تعذر الاتصال بخدمة الصوت" });
  }
});

router.post("/suggestions", async (req, res) => {
  const userId = req.session.userId!;
  const parsed = CreateSuggestionBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }

  const { text } = parsed.data;

  const trimmedText = text.trim();

  const allSentences = await db.select({ text: sentencesTable.text }).from(sentencesTable);
  const allSuggestions = await db.select({ text: suggestionsTable.text }).from(suggestionsTable);

  const isDuplicate =
    allSentences.some((s) => s.text.toLowerCase() === trimmedText.toLowerCase()) ||
    allSuggestions.some((s) => s.text.toLowerCase() === trimmedText.toLowerCase());

  const inserted = await db
    .insert(suggestionsTable)
    .values({ text: trimmedText, userId, isDuplicate })
    .returning();

  const suggestion = inserted[0];

  res.status(201).json({
    id: suggestion.id,
    text: suggestion.text,
    isDuplicate: suggestion.isDuplicate,
    createdAt: suggestion.createdAt.toISOString(),
  });
});

export default router;
