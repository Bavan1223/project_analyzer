import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  techStack: text("tech_stack").array().notNull(),
  status: text("status").notNull().default("completed"),
  score: integer("score").notNull(),
  grade: text("grade").notNull(),
  executiveSummary: text("executive_summary").notNull(),
  recommendation: text("recommendation").notNull(),
  strengths: jsonb("strengths").$type<string[]>().notNull(),
  categoryScores: jsonb("category_scores").$type<CategoryScore[]>().notNull(),
  findings: jsonb("findings").$type<Finding[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categoryScoreSchema = z.object({
  category: z.string(),
  score: z.number().int().min(0).max(100),
  note: z.string(),
});

export const findingSchema = z.object({
  id: z.number().int(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  category: z.string(),
  title: z.string(),
  summary: z.string(),
  evidence: z.string(),
  recommendation: z.string(),
  effort: z.enum(["quick-win", "focused", "involved"]),
  status: z.enum(["open", "accepted", "resolved"]),
  fileRef: z.string().nullable(),
});

export type CategoryScore = z.infer<typeof categoryScoreSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Analysis = typeof analysesTable.$inferSelect;

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;