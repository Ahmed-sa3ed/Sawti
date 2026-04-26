import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import {
  usersTable,
  sessionsTable,
  userSessionsTable,
  sentencesTable,
  recordingsTable,
  suggestionsTable,
} from "@workspace/db";
import { eq, and, sql, inArray, isNull, or } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import archiver from "archiver";
import path from "path";
import multer from "multer";
import {
  streamRecordingToResponse,
  deleteRecording,
  downloadRecordingBuffer,
  checkRecordingExists,
} from "../lib/recordingStorage.js";
import {
  AdminCreateUserBody,
  AdminCreateSessionBody,
  AdminUploadSentencesBody,
  AdminUpdateRecordingStatusBody,
  AdminUpdateSuggestionBody,
  AdminAssignSessionBody,
  AdminDownloadQueryParams,
  AdminListRecordingsQueryParams,
  AdminListSessionsQueryParams,
  AdminResetUserPasswordBody,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth.js";

async function getNextSessionNumberForPrefix(prefix: string): Promise<number> {
  const existingNames = await db.select({ name: sessionsTable.name }).from(sessionsTable);
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedPrefix} (\\d+)$`);
  let max = 0;
  for (const { name } of existingNames) {
    const match = name.match(pattern);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return max + 1;
}

const router = Router();

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function parseSentencesFromFile(buffer: Buffer, ext: string): Promise<string[]> {
  let rawText = "";

  if (ext === ".txt") {
    rawText = buffer.toString("utf-8");
  } else if (ext === ".csv") {
    rawText = buffer.toString("utf-8");
    return rawText
      .split("\n")
      .map((line) => {
        const cols = line.split(",");
        return cols[0].replace(/^"|"$/g, "").trim();
      })
      .filter((s) => s.length > 3);
  } else if (ext === ".pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    rawText = data.text;
  } else if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value;
  }

  return rawText
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

router.use(requireAdmin);

router.post("/bulk-upload", fileUpload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "يجب رفع ملف" });
    return;
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = [".txt", ".csv", ".pdf", ".docx"];
  if (!allowed.includes(ext)) {
    res.status(400).json({ error: "نوع الملف غير مدعوم. المقبول: .txt .csv .pdf .docx" });
    return;
  }

  let parsed: string[];
  try {
    parsed = await parseSentencesFromFile(file.buffer, ext);
  } catch (err) {
    res.status(422).json({ error: "تعذر قراءة الملف أو استخراج الجمل منه" });
    return;
  }

  const uniqueSentences = [...new Set(parsed)];
  if (uniqueSentences.length === 0) {
    res.status(400).json({ error: "لم يتم العثور على جمل في الملف" });
    return;
  }

  const MAX_PER_SESSION = 50;

  // multer reads filenames as latin1; re-decode as utf-8 to handle Arabic names
  const decodedName = Buffer.from(file.originalname, "latin1").toString("utf8");
  const filePrefix = path.basename(decodedName, path.extname(decodedName)).trim() || "جلسة";
  let sessionNumber = await getNextSessionNumberForPrefix(filePrefix);

  const createdSessionIds: number[] = [];

  for (let copy = 0; copy < 3; copy++) {
    const shuffled = shuffleArray(uniqueSentences);
    for (let i = 0; i < shuffled.length; i += MAX_PER_SESSION) {
      const chunk = shuffled.slice(i, i + MAX_PER_SESSION);

      const [newSession] = await db
        .insert(sessionsTable)
        .values({ name: `${filePrefix} ${sessionNumber}`, description: null })
        .returning();

      sessionNumber++;

      const values = chunk.map((text, idx) => ({
        text,
        sessionId: newSession.id,
        orderIndex: idx + 1,
      }));

      await db.insert(sentencesTable).values(values);
      createdSessionIds.push(newSession.id);
    }
  }

  res.status(201).json({
    message: `تم إنشاء ${createdSessionIds.length} جلسة بنجاح`,
    sessionsCreated: createdSessionIds.length,
    uniqueSentences: uniqueSentences.length,
    totalSentences: uniqueSentences.length * 3,
  });
});

router.get("/users", async (req, res) => {
  const users = await db.select().from(usersTable);

  const usersWithProgress = await Promise.all(
    users.map(async (user) => {
      const sentences = await db
        .select()
        .from(sentencesTable)
        .where(eq(sentencesTable.assignedUserId, user.id));

      const recordings = await db
        .select()
        .from(recordingsTable)
        .where(eq(recordingsTable.userId, user.id));

      return {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        totalSentences: sentences.length,
        completedRecordings: recordings.length,
        acceptedRecordings: recordings.filter((r) => r.status === "accepted").length,
        rejectedRecordings: recordings.filter((r) => r.status === "rejected").length,
      };
    })
  );

  res.json(usersWithProgress);
});

router.post("/users", async (req, res) => {
  const parsed = AdminCreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }

  const { username, password } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "اسم المستخدم موجود بالفعل" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const inserted = await db
    .insert(usersTable)
    .values({ username, passwordHash, role: "user" })
    .returning();

  const user = inserted[0];
  res.status(201).json({
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
});

router.delete("/users/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    res.status(400).json({ error: "معرف غير صالح" });
    return;
  }

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (user.length === 0) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }

  await db.delete(recordingsTable).where(eq(recordingsTable.userId, userId));
  await db.delete(userSessionsTable).where(eq(userSessionsTable.userId, userId));
  await db
    .update(sentencesTable)
    .set({ assignedUserId: null })
    .where(eq(sentencesTable.assignedUserId, userId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));

  res.json({ message: "تم حذف المستخدم بنجاح" });
});

router.patch("/users/:userId/password", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    res.status(400).json({ error: "معرف غير صالح" });
    return;
  }

  const parsed = AdminResetUserPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, userId));

  res.json({ message: "تم تحديث كلمة المرور بنجاح" });
});

router.post("/users/:userId/sessions", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const parsed = AdminAssignSessionBody.safeParse(req.body);

  if (isNaN(userId) || !parsed.success) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }

  const { sessionId } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);

  if (!user || !session) {
    res.status(404).json({ error: "المستخدم أو الجلسة غير موجودة" });
    return;
  }

  const existing = await db
    .select()
    .from(userSessionsTable)
    .where(
      and(
        eq(userSessionsTable.userId, userId),
        eq(userSessionsTable.sessionId, sessionId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "المستخدم مُعيَّن لهذه الجلسة بالفعل" });
    return;
  }

  // Get all sentences in this session, ordered by orderIndex
  const allSentences = await db
    .select()
    .from(sentencesTable)
    .where(eq(sentencesTable.sessionId, sessionId))
    .orderBy(sentencesTable.orderIndex);

  // Find unique sentence texts to know how many unique sentences there are
  const uniqueTexts = [...new Set(allSentences.map((s) => s.text))];

  // For each unique text, pick ONE unassigned copy to assign to this user.
  const unassignedSentences = allSentences.filter((s) => s.assignedUserId === null);
  const usedTexts = new Set<string>();
  const toAssign = unassignedSentences.filter((s) => {
    if (usedTexts.has(s.text)) return false;
    usedTexts.add(s.text);
    return true;
  }).slice(0, uniqueTexts.length);

  if (toAssign.length === 0) {
    res.status(409).json({ error: "الجلسة ممتلئة — جميع الجمل مُعيَّنة لمستخدمين آخرين" });
    return;
  }

  await db.insert(userSessionsTable).values({ userId, sessionId });

  for (const sentence of toAssign) {
    await db
      .update(sentencesTable)
      .set({ assignedUserId: userId })
      .where(eq(sentencesTable.id, sentence.id));
  }

  res.json({ message: "تم تعيين الجلسة للمستخدم بنجاح" });
});

router.get("/sessions", async (req, res) => {
  const paramsResult = AdminListSessionsQueryParams.safeParse(req.query);
  const params = paramsResult.success ? paramsResult.data : {};

  let assignedSessionIds: Set<number> = new Set();
  if (params.userId !== undefined) {
    const assigned = await db
      .select({ sessionId: userSessionsTable.sessionId })
      .from(userSessionsTable)
      .where(eq(userSessionsTable.userId, params.userId));
    assignedSessionIds = new Set(assigned.map((a) => a.sessionId));
  }

  const sessions = await db.select().from(sessionsTable);

  const sessionsWithStats = await Promise.all(
    sessions.map(async (session) => {
      const sentences = await db
        .select()
        .from(sentencesTable)
        .where(eq(sentencesTable.sessionId, session.id));

      const assignedUsers = await db
        .select()
        .from(userSessionsTable)
        .where(eq(userSessionsTable.sessionId, session.id));

      const recordings = await db
        .select()
        .from(recordingsTable)
        .where(eq(recordingsTable.sessionId, session.id));

      const unassignedCount = sentences.filter((s) => s.assignedUserId === null).length;

      return {
        id: session.id,
        name: session.name,
        description: session.description,
        createdAt: session.createdAt.toISOString(),
        totalSentences: sentences.length,
        unassignedCount,
        assignedUsers: assignedUsers.length,
        totalRecordings: recordings.length,
        acceptedRecordings: recordings.filter((r) => r.status === "accepted").length,
      };
    })
  );

  let filteredSessions = assignedSessionIds.size > 0
    ? sessionsWithStats.filter((s) => !assignedSessionIds.has(s.id))
    : sessionsWithStats;

  // When fetching sessions for a specific user (to assign), only show sessions
  // that still have unassigned sentences available
  if (params.userId !== undefined) {
    filteredSessions = filteredSessions.filter((s) => s.unassignedCount > 0);
  }

  res.json(filteredSessions);
});

router.get("/sessions/:sessionId/sentences", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) { res.status(400).json({ error: "معرف غير صالح" }); return; }

  const sentences = await db
    .select()
    .from(sentencesTable)
    .where(eq(sentencesTable.sessionId, sessionId));

  res.json(sentences.map(s => ({
    id: s.id,
    text: s.text,
    orderIndex: s.orderIndex,
    assignedUserId: s.assignedUserId,
  })));
});

router.patch("/sessions/:sessionId", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) { res.status(400).json({ error: "معرف غير صالح" }); return; }

  const { name } = req.body as { name?: string };
  if (!name || name.trim().length === 0) {
    res.status(400).json({ error: "اسم الجلسة مطلوب" });
    return;
  }

  const updated = await db
    .update(sessionsTable)
    .set({ name: name.trim() })
    .where(eq(sessionsTable.id, sessionId))
    .returning();

  if (updated.length === 0) { res.status(404).json({ error: "الجلسة غير موجودة" }); return; }
  res.json({ id: updated[0].id, name: updated[0].name });
});

router.delete("/sessions/bulk", async (req, res) => {
  const { ids } = req.body as { ids: unknown };
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "لم يتم تحديد جلسات" });
    return;
  }
  const numericIds = (ids as unknown[]).map(Number).filter((n) => !isNaN(n));
  if (numericIds.length === 0) {
    res.status(400).json({ error: "معرفات غير صالحة" });
    return;
  }

  for (const sessionId of numericIds) {
    const recordings = await db.select().from(recordingsTable).where(eq(recordingsTable.sessionId, sessionId));
    for (const rec of recordings) {
      if (rec.filePath) await deleteRecording(rec.filePath);
    }
    await db.delete(recordingsTable).where(eq(recordingsTable.sessionId, sessionId));
    await db.delete(userSessionsTable).where(eq(userSessionsTable.sessionId, sessionId));
    await db.delete(sentencesTable).where(eq(sentencesTable.sessionId, sessionId));
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
  }

  res.json({ ok: true, deleted: numericIds.length });
});

router.post("/sessions/bulk-duplicate", async (req, res) => {
  const { ids } = req.body as { ids: unknown };
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "لم يتم تحديد جلسات" });
    return;
  }
  const numericIds = (ids as unknown[]).map(Number).filter((n) => !isNaN(n));
  if (numericIds.length === 0) {
    res.status(400).json({ error: "معرفات غير صالحة" });
    return;
  }

  const created: number[] = [];
  for (const sessionId of numericIds) {
    const [original] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);
    if (!original) continue;

    // Extract prefix (remove trailing number) for consistent naming
    const prefix = original.name.replace(/ \d+$/, "").trim() || original.name;
    const nextNum = await getNextSessionNumberForPrefix(prefix);

    const [newSession] = await db
      .insert(sessionsTable)
      .values({ name: `${prefix} ${nextNum}`, description: original.description })
      .returning();

    const originalSentences = await db
      .select()
      .from(sentencesTable)
      .where(eq(sentencesTable.sessionId, sessionId))
      .orderBy(sentencesTable.orderIndex);

    if (originalSentences.length > 0) {
      await db.insert(sentencesTable).values(
        originalSentences.map((s, idx) => ({
          text: s.text,
          sessionId: newSession.id,
          orderIndex: idx + 1,
          assignedUserId: null,
        }))
      );
    }
    created.push(newSession.id);
  }

  res.status(201).json({ ok: true, created: created.length });
});

router.delete("/sessions/:sessionId", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) { res.status(400).json({ error: "معرف غير صالح" }); return; }

  // Delete recording files from object storage
  const recordings = await db
    .select()
    .from(recordingsTable)
    .where(eq(recordingsTable.sessionId, sessionId));

  for (const rec of recordings) {
    if (rec.filePath) {
      await deleteRecording(rec.filePath);
    }
  }

  await db.delete(recordingsTable).where(eq(recordingsTable.sessionId, sessionId));
  await db.delete(userSessionsTable).where(eq(userSessionsTable.sessionId, sessionId));
  await db.delete(sentencesTable).where(eq(sentencesTable.sessionId, sessionId));
  await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));

  res.json({ ok: true });
});

router.post("/sessions", async (req, res) => {
  const parsed = AdminCreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }

  const { name, description } = parsed.data;

  const inserted = await db
    .insert(sessionsTable)
    .values({ name, description: description ?? null })
    .returning();

  const session = inserted[0];
  res.status(201).json({
    id: session.id,
    name: session.name,
    description: session.description,
    createdAt: session.createdAt.toISOString(),
  });
});

router.post("/sessions/:sessionId/sentences", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const parsed = AdminUploadSentencesBody.safeParse(req.body);

  if (isNaN(sessionId) || !parsed.success) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "الجلسة غير موجودة" });
    return;
  }

  const rawSentences = parsed.data.sentences.filter((s) => s.trim().length > 0);

  const existingSentences = await db
    .select({ text: sentencesTable.text })
    .from(sentencesTable)
    .where(eq(sentencesTable.sessionId, sessionId));

  const existingTexts = new Set(existingSentences.map((s) => s.text));

  const uniqueNew = rawSentences.filter((s) => !existingTexts.has(s.trim()));

  const tripled = uniqueNew.flatMap((s) => [s.trim(), s.trim(), s.trim()]);

  const shuffled = tripled.sort(() => Math.random() - 0.5);

  const currentMaxResult = await db
    .select({ max: sql<number>`COALESCE(MAX(order_index), 0)` })
    .from(sentencesTable)
    .where(eq(sentencesTable.sessionId, sessionId));

  let orderIndex = (currentMaxResult[0]?.max ?? 0) + 1;

  if (shuffled.length > 0) {
    const values = shuffled.map((text) => ({
      text,
      sessionId,
      orderIndex: orderIndex++,
    }));

    await db.insert(sentencesTable).values(values);
  }

  res.status(201).json({
    message: `تم إضافة ${shuffled.length} جملة بنجاح`,
    count: shuffled.length,
  });
});

router.patch("/recordings/bulk/status", async (req, res) => {
  const { ids, status } = req.body as { ids: unknown; status: unknown };
  if (!Array.isArray(ids) || ids.length === 0 || (status !== "accepted" && status !== "rejected")) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }
  const numericIds = (ids as unknown[]).map(Number).filter((n) => !isNaN(n));
  if (numericIds.length === 0) {
    res.status(400).json({ error: "معرفات غير صالحة" });
    return;
  }

  if (status === "rejected") {
    const recordings = await db.select().from(recordingsTable).where(inArray(recordingsTable.id, numericIds));
    for (const rec of recordings) {
      if (rec.filePath) await deleteRecording(rec.filePath);
    }
    await db.delete(recordingsTable).where(inArray(recordingsTable.id, numericIds));
  } else {
    await db.update(recordingsTable).set({ status: "accepted" }).where(inArray(recordingsTable.id, numericIds));
  }

  res.json({ message: `تم تحديث ${numericIds.length} تسجيل`, count: numericIds.length });
});

router.delete("/recordings/bulk", async (req, res) => {
  const { ids } = req.body as { ids: unknown };
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "لم يتم تحديد تسجيلات" });
    return;
  }
  const numericIds = (ids as unknown[]).map(Number).filter((n) => !isNaN(n));
  if (numericIds.length === 0) {
    res.status(400).json({ error: "معرفات غير صالحة" });
    return;
  }

  // Only allow deleting recordings that have been downloaded
  const recordings = await db.select().from(recordingsTable).where(inArray(recordingsTable.id, numericIds));
  const downloadedRecordings = recordings.filter((r) => r.downloadedAt !== null);

  if (downloadedRecordings.length === 0) {
    res.status(403).json({ error: "لا يمكن حذف تسجيلات لم يتم تنزيلها بعد" });
    return;
  }

  const downloadedIds = downloadedRecordings.map((r) => r.id);
  for (const rec of downloadedRecordings) {
    if (rec.filePath) await deleteRecording(rec.filePath);
  }
  await db.delete(recordingsTable).where(inArray(recordingsTable.id, downloadedIds));

  res.json({ message: `تم حذف ${downloadedIds.length} تسجيل`, deleted: downloadedIds.length });
});

router.post("/recordings/accept-all", async (req, res) => {
  const pendingRecordings = await db
    .select()
    .from(recordingsTable)
    .where(eq(recordingsTable.status, "pending"));

  if (pendingRecordings.length === 0) {
    res.json({ message: "لا توجد تسجيلات بانتظار المراجعة", count: 0 });
    return;
  }

  const ids = pendingRecordings.map((r) => r.id);
  await db
    .update(recordingsTable)
    .set({ status: "accepted" })
    .where(inArray(recordingsTable.id, ids));

  res.json({ message: `تم قبول ${pendingRecordings.length} تسجيل`, count: pendingRecordings.length });
});

router.get("/recordings", async (req, res) => {
  const paramsResult = AdminListRecordingsQueryParams.safeParse(req.query);
  const params = paramsResult.success ? paramsResult.data : {};

  const recordings = await db
    .select({
      id: recordingsTable.id,
      userId: recordingsTable.userId,
      username: usersTable.username,
      sessionId: recordingsTable.sessionId,
      sessionName: sessionsTable.name,
      sentenceId: recordingsTable.sentenceId,
      sentenceText: sentencesTable.text,
      status: recordingsTable.status,
      filePath: recordingsTable.filePath,
      downloadedAt: recordingsTable.downloadedAt,
      createdAt: recordingsTable.createdAt,
    })
    .from(recordingsTable)
    .innerJoin(usersTable, eq(recordingsTable.userId, usersTable.id))
    .innerJoin(sessionsTable, eq(recordingsTable.sessionId, sessionsTable.id))
    .innerJoin(sentencesTable, eq(recordingsTable.sentenceId, sentencesTable.id));

  const filtered = recordings.filter((r) => {
    if (params.status && r.status !== params.status) return false;
    if (params.userId !== undefined && r.userId !== params.userId) return false;
    if (params.sessionId !== undefined && r.sessionId !== params.sessionId) return false;
    return true;
  });

  res.json(
    filtered.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      downloadedAt: r.downloadedAt ? r.downloadedAt.toISOString() : null,
    }))
  );
});

const ORPHAN_CHECK_CONCURRENCY = 10;

async function runConcurrently<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

router.get("/recordings/orphaned", async (req, res) => {
  const recordings = await db
    .select({
      id: recordingsTable.id,
      filePath: recordingsTable.filePath,
    })
    .from(recordingsTable);

  const tasks = recordings.map(
    (rec) => async (): Promise<{ id: number; result: boolean | null }> => ({
      id: rec.id,
      result: await checkRecordingExists(rec.filePath),
    })
  );

  const checks = await runConcurrently(tasks, ORPHAN_CHECK_CONCURRENCY);

  const errorCount = checks.filter((c) => c.result === null).length;
  const orphanedIds = checks
    .filter((c) => c.result === false)
    .map((c) => c.id);

  res.json({ orphanedIds, errorCount });
});

router.delete("/recordings/orphaned", async (req, res) => {
  const recordings = await db
    .select({
      id: recordingsTable.id,
      filePath: recordingsTable.filePath,
    })
    .from(recordingsTable);

  const tasks = recordings.map(
    (rec) => async (): Promise<{ id: number; filePath: string; result: boolean | null }> => ({
      id: rec.id,
      filePath: rec.filePath,
      result: await checkRecordingExists(rec.filePath),
    })
  );

  const checks = await runConcurrently(tasks, ORPHAN_CHECK_CONCURRENCY);

  const errorCount = checks.filter((c) => c.result === null).length;
  if (errorCount > 0) {
    logger.error({ errorCount }, "Aborting orphan delete: storage checks returned errors");
    res.status(503).json({
      error: `فشل فحص ${errorCount} ملف، تم إلغاء الحذف للحفاظ على سلامة البيانات`,
    });
    return;
  }

  const orphaned = checks.filter((c) => c.result === false);

  if (orphaned.length === 0) {
    res.json({ message: "لا توجد تسجيلات يتيمة", count: 0 });
    return;
  }

  const ids = orphaned.map((r) => r.id);
  await db.delete(recordingsTable).where(inArray(recordingsTable.id, ids));

  logger.info({ count: orphaned.length }, "Deleted orphaned recordings");
  res.json({ message: `تم حذف ${orphaned.length} تسجيل يتيم`, count: orphaned.length });
});

router.get("/recordings/:recordingId/audio", async (req, res) => {
  const recordingId = parseInt(req.params.recordingId);
  if (isNaN(recordingId)) {
    res.status(400).json({ error: "معرف التسجيل غير صالح" });
    return;
  }

  const [recording] = await db
    .select()
    .from(recordingsTable)
    .where(eq(recordingsTable.id, recordingId))
    .limit(1);

  if (!recording) {
    res.status(404).json({ error: "التسجيل غير موجود" });
    return;
  }

  await streamRecordingToResponse(recording.filePath, res);
});

router.patch("/recordings/:recordingId/status", async (req, res) => {
  const recordingId = parseInt(req.params.recordingId);
  const parsed = AdminUpdateRecordingStatusBody.safeParse(req.body);

  if (isNaN(recordingId) || !parsed.success) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }

  const [recording] = await db
    .select()
    .from(recordingsTable)
    .where(eq(recordingsTable.id, recordingId))
    .limit(1);

  if (!recording) {
    res.status(404).json({ error: "التسجيل غير موجود" });
    return;
  }

  const { status } = parsed.data;

  if (status === "rejected") {
    // Delete the audio file from object storage
    await deleteRecording(recording.filePath);
    // Delete the recording row - the sentence remains assigned to the same user
    // so they can re-record it (the sentence shows as unrecorded in their queue)
    await db.delete(recordingsTable).where(eq(recordingsTable.id, recordingId));
  } else {
    await db
      .update(recordingsTable)
      .set({ status })
      .where(eq(recordingsTable.id, recordingId));
  }

  res.json({ message: `تم تحديث حالة التسجيل إلى ${status}` });
});

router.get("/suggestions", async (req, res) => {
  const suggestions = await db
    .select({
      id: suggestionsTable.id,
      text: suggestionsTable.text,
      userId: suggestionsTable.userId,
      username: usersTable.username,
      isDuplicate: suggestionsTable.isDuplicate,
      isApproved: suggestionsTable.isApproved,
      createdAt: suggestionsTable.createdAt,
    })
    .from(suggestionsTable)
    .innerJoin(usersTable, eq(suggestionsTable.userId, usersTable.id));

  res.json(
    suggestions.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

router.patch("/suggestions/:suggestionId", async (req, res) => {
  const suggestionId = parseInt(req.params.suggestionId);
  const parsed = AdminUpdateSuggestionBody.safeParse(req.body);

  if (isNaN(suggestionId) || !parsed.success) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }

  const [suggestion] = await db
    .select()
    .from(suggestionsTable)
    .where(eq(suggestionsTable.id, suggestionId))
    .limit(1);

  if (!suggestion) {
    res.status(404).json({ error: "الاقتراح غير موجود" });
    return;
  }

  await db
    .update(suggestionsTable)
    .set({ isApproved: parsed.data.isApproved })
    .where(eq(suggestionsTable.id, suggestionId));

  res.json({ message: "تم تحديث حالة الاقتراح" });
});

router.post("/suggestions/accept-all", async (req, res) => {
  try {
    // 1. Find all non-duplicate suggestions that haven't been rejected
    //    (includes both pending (isApproved IS NULL) and already individually approved (isApproved = true))
    const toProcess = await db
      .select()
      .from(suggestionsTable)
      .where(
        and(
          eq(suggestionsTable.isDuplicate, false),
          or(isNull(suggestionsTable.isApproved), eq(suggestionsTable.isApproved, true))
        )
      );

    if (toProcess.length === 0) {
      res.json({ message: "لا توجد اقتراحات صالحة لإنشاء جلسات منها", sessionsCreated: 0, uniqueSentences: 0 });
      return;
    }

    // 2. Mark all still-pending ones as approved
    const pendingIds = toProcess.filter((s) => s.isApproved === null).map((s) => s.id);
    if (pendingIds.length > 0) {
      await db
        .update(suggestionsTable)
        .set({ isApproved: true })
        .where(inArray(suggestionsTable.id, pendingIds));
    }

    // 3. Collect unique texts from the current batch of suggestions
    const uniqueSentences = [...new Set(
      toProcess.map((s) => s.text.trim()).filter((t) => t.length > 3)
    )];

    if (uniqueSentences.length === 0) {
      res.json({
        message: `تمت الموافقة على ${pendingIds.length} اقتراح، لكن لا توجد نصوص صالحة لإنشاء جلسات`,
        sessionsCreated: 0,
        uniqueSentences: 0,
        approvedSuggestions: pendingIds.length,
      });
      return;
    }

    // 4. Triplication + session creation (same algorithm as bulk-upload)
    const MAX_PER_SESSION = 50;
    let sessionNumber = await getNextSessionNumberForPrefix("جلسة");
    const createdSessionIds: number[] = [];

    for (let copy = 0; copy < 3; copy++) {
      const shuffled = shuffleArray(uniqueSentences);
      for (let i = 0; i < shuffled.length; i += MAX_PER_SESSION) {
        const chunk = shuffled.slice(i, i + MAX_PER_SESSION);

        const [newSession] = await db
          .insert(sessionsTable)
          .values({ name: `جلسة ${sessionNumber}`, description: null })
          .returning();

        sessionNumber++;

        const values = chunk.map((text, idx) => ({
          text,
          sessionId: newSession.id,
          orderIndex: idx + 1,
        }));

        await db.insert(sentencesTable).values(values);
        createdSessionIds.push(newSession.id);
      }
    }

    res.status(201).json({
      message: `تم قبول ${pendingIds.length} اقتراح وإنشاء ${createdSessionIds.length} جلسة`,
      sessionsCreated: createdSessionIds.length,
      uniqueSentences: uniqueSentences.length,
      approvedSuggestions: pendingIds.length,
    });
  } catch (err) {
    logger.error({ err }, "accept-all suggestions failed");
    res.status(500).json({ error: "حدث خطأ أثناء معالجة الاقتراحات" });
  }
});

router.delete("/suggestions/processed", async (req, res) => {
  try {
    const deleted = await db
      .delete(suggestionsTable)
      .where(or(eq(suggestionsTable.isApproved, true), eq(suggestionsTable.isApproved, false)))
      .returning({ id: suggestionsTable.id });

    res.json({ message: `تم حذف ${deleted.length} اقتراح مُعالَج`, deletedCount: deleted.length });
  } catch (err) {
    logger.error({ err }, "clear processed suggestions failed");
    res.status(500).json({ error: "حدث خطأ أثناء حذف الاقتراحات" });
  }
});

router.get("/dashboard", async (req, res) => {
  const [totalUsersResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(usersTable);
  const [totalSessionsResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(sessionsTable);
  const [totalSentencesResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(sentencesTable);
  const [totalRecordingsResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(recordingsTable);

  const allRecordings = await db.select({ status: recordingsTable.status }).from(recordingsTable);

  const [pendingSuggestionsResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(suggestionsTable)
    .where(sql`is_approved IS NULL`);

  res.json({
    totalUsers: Number(totalUsersResult.count),
    totalSessions: Number(totalSessionsResult.count),
    totalSentences: Number(totalSentencesResult.count),
    totalRecordings: Number(totalRecordingsResult.count),
    acceptedRecordings: allRecordings.filter((r) => r.status === "accepted").length,
    rejectedRecordings: allRecordings.filter((r) => r.status === "rejected").length,
    pendingRecordings: allRecordings.filter((r) => r.status === "pending").length,
    pendingSuggestions: Number(pendingSuggestionsResult.count),
  });
});

router.get("/download", async (req, res) => {
  const paramsResult = AdminDownloadQueryParams.safeParse(req.query);
  const params = paramsResult.success ? paramsResult.data : {};

  const recordings = await db
    .select({
      id: recordingsTable.id,
      userId: recordingsTable.userId,
      username: usersTable.username,
      sessionId: recordingsTable.sessionId,
      sessionName: sessionsTable.name,
      sentenceId: recordingsTable.sentenceId,
      sentenceText: sentencesTable.text,
      status: recordingsTable.status,
      filePath: recordingsTable.filePath,
      createdAt: recordingsTable.createdAt,
    })
    .from(recordingsTable)
    .innerJoin(usersTable, eq(recordingsTable.userId, usersTable.id))
    .innerJoin(sessionsTable, eq(recordingsTable.sessionId, sessionsTable.id))
    .innerJoin(sentencesTable, eq(recordingsTable.sentenceId, sentencesTable.id))
    .where(eq(recordingsTable.status, "accepted"));

  const filtered = recordings.filter((r) => {
    if (params.userId !== undefined && r.userId !== params.userId) return false;
    if (params.sessionId !== undefined && r.sessionId !== params.sessionId) return false;
    return true;
  });

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=recordings.zip");

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);

  const csvRows = ["file_name,sentence_text,username,session,status,timestamp"];
  const downloadedIds: number[] = [];

  for (const rec of filtered) {
    const buffer = await downloadRecordingBuffer(rec.filePath);
    if (buffer) {
      const fileName = path.basename(rec.filePath);
      archive.append(buffer, {
        name: `${rec.username}/${rec.sessionName}/${fileName}`,
      });
      csvRows.push(
        `"${fileName}","${rec.sentenceText.replace(/"/g, '""')}","${rec.username}","${rec.sessionName}","${rec.status}","${rec.createdAt.toISOString()}"`
      );
      downloadedIds.push(rec.id);
    }
  }

  archive.append(csvRows.join("\n"), { name: "metadata.csv" });
  await archive.finalize();

  // Mark successfully downloaded recordings
  if (downloadedIds.length > 0) {
    await db
      .update(recordingsTable)
      .set({ downloadedAt: new Date() })
      .where(inArray(recordingsTable.id, downloadedIds));
  }
});

export default router;
