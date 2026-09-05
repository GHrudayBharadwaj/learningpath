import { pgTable, text, timestamp, integer, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  image: text("image"),
  preferredAiProvider: text("preferred_ai_provider").default("openai").notNull(),
  preferredDifficulty: text("preferred_difficulty").default("intermediate").notNull(),
  preferredLength: text("preferred_length").default("medium").notNull(),
  preferredPurpose: text("preferred_purpose").default("exam").notNull(),
  timezone: text("timezone").default("UTC").notNull(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("users_email_idx").on(table.email),
]);

export const studyPlans = pgTable("study_plans", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject"),
  targetDate: text("target_date"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("study_plans_user_idx").on(table.userId),
]);

export const studyTasks = pgTable("study_tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  planId: text("plan_id").references(() => studyPlans.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  subtopic: text("subtopic"),
  scheduledDate: text("scheduled_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  durationMinutes: integer("duration_minutes").default(60).notNull(),
  priority: text("priority").default("medium").notNull(),
  status: text("status").default("not_started").notNull(),
  practicePlatform: text("practice_platform"),
  practiceUrl: text("practice_url"),
  notesSummary: text("notes_summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("study_tasks_user_date_idx").on(table.userId, table.scheduledDate),
  index("study_tasks_plan_idx").on(table.planId),
]);

export const sources = pgTable("sources", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sourceType: text("source_type").notNull(),
  sourceUrl: text("source_url"),
  fileId: text("file_id"),
  fileSize: integer("file_size"),
  extractedContent: text("extracted_content"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  subject: text("subject"),
  topic: text("topic"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("sources_user_idx").on(table.userId),
  index("sources_type_idx").on(table.sourceType),
]);

export const sourceChunks = pgTable("source_chunks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceId: text("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("source_chunks_source_idx").on(table.sourceId),
  index("source_chunks_user_idx").on(table.userId),
]);

export const embeddings = pgTable("embeddings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  chunkId: text("chunk_id").notNull().references(() => sourceChunks.id, { onDelete: "cascade" }),
  sourceId: text("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  embedding: text("embedding").notNull(),
  model: text("model").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("embeddings_user_idx").on(table.userId),
  index("embeddings_chunk_idx").on(table.chunkId),
]);

export const notes = pgTable("notes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id").references(() => studyTasks.id, { onDelete: "set null" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  subject: text("subject").notNull(),
  difficulty: text("difficulty").default("intermediate").notNull(),
  length: text("length").default("medium").notNull(),
  purpose: text("purpose").default("exam").notNull(),
  noteType: text("note_type").default("standard").notNull(),
  content: text("content").notNull(),
  structuredData: jsonb("structured_data").$type<Record<string, any>>(),
  sourcesUsed: jsonb("sources_used").$type<Array<{ title: string; type: string; url?: string; snippet?: string }>>(),
  aiProvider: text("ai_provider").default("openai").notNull(),
  modelUsed: text("model_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("notes_user_idx").on(table.userId),
  index("notes_task_idx").on(table.taskId),
]);

export const noteVersions = pgTable("note_versions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  noteId: text("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  content: text("content").notNull(),
  changeSummary: text("change_summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("note_versions_note_idx").on(table.noteId),
]);

export const reminders = pgTable("reminders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: text("task_id").references(() => studyTasks.id, { onDelete: "cascade" }),
  reminderTime: timestamp("reminder_time").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  notificationType: text("notification_type").default("upcoming_session").notNull(),
  lastSentAt: timestamp("last_sent_at"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("reminders_user_time_idx").on(table.userId, table.reminderTime),
]);

export const progress = pgTable("progress", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  completedTasks: integer("completed_tasks").default(0).notNull(),
  totalMinutesStudied: integer("total_minutes_studied").default(0).notNull(),
  subjectBreakdown: jsonb("subject_breakdown").$type<Record<string, number>>(),
  streak: integer("streak").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("progress_user_date_idx").on(table.userId, table.date),
]);

export const aiGenerationHistory = pgTable("ai_generation_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  promptType: text("prompt_type").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  tokensUsed: integer("tokens_used").default(0).notNull(),
  status: text("status").default("success").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ai_history_user_idx").on(table.userId),
]);

export const files = pgTable("files", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  blobUrl: text("blob_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("files_user_idx").on(table.userId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  studyPlans: many(studyPlans),
  studyTasks: many(studyTasks),
  sources: many(sources),
  notes: many(notes),
  reminders: many(reminders),
  progress: many(progress),
  files: many(files),
}));

export const studyPlansRelations = relations(studyPlans, ({ one, many }) => ({
  user: one(users, { fields: [studyPlans.userId], references: [users.id] }),
  tasks: many(studyTasks),
}));

export const studyTasksRelations = relations(studyTasks, ({ one, many }) => ({
  plan: one(studyPlans, { fields: [studyTasks.planId], references: [studyPlans.id] }),
  user: one(users, { fields: [studyTasks.userId], references: [users.id] }),
  notes: many(notes),
  reminders: many(reminders),
}));

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  user: one(users, { fields: [sources.userId], references: [users.id] }),
  chunks: many(sourceChunks),
}));

export const sourceChunksRelations = relations(sourceChunks, ({ one, many }) => ({
  source: one(sources, { fields: [sourceChunks.sourceId], references: [sources.id] }),
  embeddings: many(embeddings),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  task: one(studyTasks, { fields: [notes.taskId], references: [studyTasks.id] }),
  versions: many(noteVersions),
}));
