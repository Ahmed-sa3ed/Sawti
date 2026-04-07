import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recordingStatusEnum = pgEnum("recording_status", ["pending", "accepted", "rejected"]);

export const recordingsTable = pgTable("recordings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionId: integer("session_id").notNull(),
  sentenceId: integer("sentence_id").notNull(),
  filePath: text("file_path").notNull(),
  status: recordingStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRecordingSchema = createInsertSchema(recordingsTable).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Recording = typeof recordingsTable.$inferSelect;
