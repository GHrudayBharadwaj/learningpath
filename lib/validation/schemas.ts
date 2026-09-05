import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const studyPlanSchema = z.object({
  title: z.string().min(1, "Plan title is required"),
  description: z.string().optional(),
  subject: z.string().optional(),
  targetDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["active", "completed", "archived"]).default("active"),
});

export const studyTaskSchema = z.object({
  planId: z.string().optional(),
  title: z.string().min(1, "Task title is required"),
  subject: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic is required"),
  subtopic: z.string().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  durationMinutes: z.number().min(5).max(1440).default(60),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["not_started", "in_progress", "completed", "missed", "rescheduled"]).default("not_started"),
  practicePlatform: z.string().optional(),
  practiceUrl: z.string().url().optional().or(z.literal("")),
  notesSummary: z.string().optional(),
});

export const generateNotesSchema = z.object({
  taskId: z.string().optional(),
  topic: z.string().min(1, "Topic is required"),
  subject: z.string().min(1, "Subject is required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  length: z.enum(["short", "medium", "detailed"]).default("medium"),
  purpose: z.enum(["exam", "interview", "coding", "competitive_programming", "revision"]).default("exam"),
  noteType: z.enum(["standard", "exam_2mark", "exam_5mark", "exam_10mark", "coding_practice"]).default("standard"),
  language: z.string().default("English"),
  aiProvider: z.enum(["gemini", "openai", "anthropic", "deepseek", "groq", "offline"]).default("gemini"),
  modelName: z.string().optional(),
  apiKey: z.string().optional(),
  includeSources: z.boolean().default(true),
  specificSourceIds: z.array(z.string()).optional(),
});

export const webSourceSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  title: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
});

export const youtubeSourceSchema = z.object({
  url: z.string().url("Must be a valid YouTube URL"),
  title: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
});

export const reminderSchema = z.object({
  taskId: z.string().optional(),
  reminderTime: z.string().or(z.date()),
  notificationType: z.enum(["upcoming_session", "daily_summary", "missed_task", "revision"]).default("upcoming_session"),
});

export const userSettingsSchema = z.object({
  name: z.string().min(2).optional(),
  preferredAiProvider: z.enum(["openai", "gemini"]).optional(),
  preferredDifficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  preferredLength: z.enum(["short", "medium", "detailed"]).optional(),
  preferredPurpose: z.enum(["exam", "interview", "coding", "revision"]).optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});
