import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sentencesTable = pgTable("sentences", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  sessionId: integer("session_id").notNull(),
  assignedUserId: integer("assigned_user_id"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSentenceSchema = createInsertSchema(sentencesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSentence = z.infer<typeof insertSentenceSchema>;
export type Sentence = typeof sentencesTable.$inferSelect;

export const suggestionsTable = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  userId: integer("user_id").notNull(),
  isDuplicate: boolean("is_duplicate").notNull().default(false),
  isApproved: boolean("is_approved"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSuggestionSchema = createInsertSchema(suggestionsTable).omit({
  id: true,
  isDuplicate: true,
  isApproved: true,
  createdAt: true,
});
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Suggestion = typeof suggestionsTable.$inferSelect;
