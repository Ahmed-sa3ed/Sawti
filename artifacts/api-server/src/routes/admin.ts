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
import { eq, and, sql, inArray } from "drizzle-orm";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import {
  AdminCreateUserBody,
  AdminCreateSessionBody,
  AdminUploadSentencesBody,
  AdminUpdateRecordingStatusBody,
  AdminUpdateSuggestionBody,
  AdminAssignSessionBody,
  AdminDownloadQueryParams,
  AdminListRecordingsQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.use(requireAdmin);

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

  if (existing.length === 0) {
    await db.insert(userSessionsTable).values({ userId, sessionId });

    // Get all sentences in this session, ordered by orderIndex
    const allSentences = await db
      .select()
      .from(sentencesTable)
      .where(eq(sentencesTable.sessionId, sessionId))
      .orderBy(sentencesTable.orderIndex);

    // Find unique sentence texts (deduplicated) to know how many unique sentences there are
    const uniqueTexts = [...new Set(allSentences.map((s) => s.text))];
    const uniqueCount = uniqueTexts.length;

    // Get unassigned sentences - assign a batch of uniqueCount to this user
    const unassignedSentences = allSentences.filter((s) => s.assignedUserId === null);
    const batchSize = Math.min(uniqueCount, unassignedSentences.length);
    const toAssign = unassignedSentences.slice(0, batchSize);

    if (toAssign.length > 0) {
      for (const sentence of toAssign) {
        await db
          .update(sentencesTable)
          .set({ assignedUserId: userId })
          .where(eq(sentencesTable.id, sentence.id));
      }
    }
  }

  res.json({ message: "تم تعيين الجلسة للمستخدم بنجاح" });
});

router.get("/sessions", async (req, res) => {
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

      return {
        id: session.id,
        name: session.name,
        description: session.description,
        createdAt: session.createdAt.toISOString(),
        totalSentences: sentences.length,
        assignedUsers: assignedUsers.length,
        totalRecordings: recordings.length,
        acceptedRecordings: recordings.filter((r) => r.status === "accepted").length,
      };
    })
  );

  res.json(sessionsWithStats);
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
    }))
  );
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

  if (!fs.existsSync(recording.filePath)) {
    res.status(404).json({ error: "الملف الصوتي غير موجود" });
    return;
  }

  const stat = fs.statSync(recording.filePath);
  const fileExt = path.extname(recording.filePath).toLowerCase();
  const contentType = fileExt === ".wav" ? "audio/wav" : "audio/webm";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Accept-Ranges", "bytes");

  const stream = fs.createReadStream(recording.filePath);
  stream.pipe(res);
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
    if (fs.existsSync(recording.filePath)) {
      fs.unlinkSync(recording.filePath);
    }
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

  for (const rec of filtered) {
    if (fs.existsSync(rec.filePath)) {
      const fileName = path.basename(rec.filePath);
      archive.file(rec.filePath, {
        name: `${rec.username}/${rec.sessionName}/${fileName}`,
      });
      csvRows.push(
        `"${fileName}","${rec.sentenceText.replace(/"/g, '""')}","${rec.username}","${rec.sessionName}","${rec.status}","${rec.createdAt.toISOString()}"`
      );
    }
  }

  archive.append(csvRows.join("\n"), { name: "metadata.csv" });
  await archive.finalize();
});

export default router;
