import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const testSessions = pgTable("test_sessions", {
  id: serial("id").primaryKey(),
  testName: text("test_name").notNull(),
  userId: integer("user_id"),
  extractedFrames: jsonb("extracted_frames").$type<string[]>().notNull(),
  hotspotData: jsonb("hotspot_data").$type<HotspotData[][]>().notNull(),
  totalSteps: integer("total_steps").notNull(),
  currentStep: integer("current_step").notNull().default(1),
  isCompleted: boolean("is_completed").notNull().default(false),
  startTime: timestamp("start_time").notNull().defaultNow(),
  completedTime: timestamp("completed_time"),
});

export const testAttempts = pgTable("test_attempts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  stepNumber: integer("step_number").notNull(),
  hotspotId: text("hotspot_id").notNull(),
  clickX: integer("click_x").notNull(),
  clickY: integer("click_y").notNull(),
  expectedX: integer("expected_x").notNull(),
  expectedY: integer("expected_y").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeSpent: integer("time_spent").notNull(), // milliseconds
  attemptTime: timestamp("attempt_time").notNull().defaultNow(),
});

export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  totalCorrect: integer("total_correct").notNull(),
  totalIncorrect: integer("total_incorrect").notNull(),
  totalTime: integer("total_time").notNull(), // milliseconds
  averageStepTime: integer("average_step_time").notNull(), // milliseconds
  accuracy: integer("accuracy").notNull(), // percentage
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export type HotspotData = {
  id: string;
  x: number;
  y: number;
  label: string;
};

export type StepHistory = {
  stepNumber: number;
  label: string;
  isCorrect: boolean;
  timeSpent: number;
  attempts: number;
};

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTestSessionSchema = createInsertSchema(testSessions).omit({
  id: true,
  currentStep: true,
  isCompleted: true,
  startTime: true,
  completedTime: true,
});

export const insertTestAttemptSchema = createInsertSchema(testAttempts).omit({
  id: true,
  attemptTime: true,
});

export const insertTestResultSchema = createInsertSchema(testResults).omit({
  id: true,
  completedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TestSession = typeof testSessions.$inferSelect;
export type InsertTestSession = z.infer<typeof insertTestSessionSchema>;
export type TestAttempt = typeof testAttempts.$inferSelect;
export type InsertTestAttempt = z.infer<typeof insertTestAttemptSchema>;
export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
