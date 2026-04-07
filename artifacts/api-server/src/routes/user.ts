import { Router } from "express";
import { db } from "@workspace/db";
import {
  sentencesTable,
  sessionsTable,
  userSessionsTable,
  recordingsTable,
  suggestionsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { CreateSuggestionBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();
router.use(requireAuth);

function getRecordingsDir(userId: number, sessionName: string): string {
  const dir = path.join(process.cwd(), "recordings", String(userId), sessionName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      const userId = req.session.userId!;
      const sessionId = parseInt(req.body.sessionId);
      const [session] = await db
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, sessionId))
        .limit(1);
      const dir = getRecordingsDir(userId, session?.name ?? String(sessionId));
      cb(null, dir);
    } catch (err) {
      cb(err as Error, "");
    }
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = file.mimetype.includes("webm") ? ".webm" : ".audio";
    cb(null, `recording_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
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

  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(
      sessionIds.length === 1
        ? eq(sessionsTable.id, sessionIds[0])
        : eq(sessionsTable.id, sessionIds[0])
    );

  const sessionsAll = await db.select().from(sessionsTable);
  const filteredSessions = sessionsAll.filter((s) => sessionIds.includes(s.id));

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

  if (!file) {
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
    if (fs.existsSync(existing.filePath)) {
      fs.unlinkSync(existing.filePath);
    }
    await db.delete(recordingsTable).where(eq(recordingsTable.id, existing.id));
  }

  const inserted = await db
    .insert(recordingsTable)
    .values({
      userId,
      sessionId,
      sentenceId,
      filePath: file.path,
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
