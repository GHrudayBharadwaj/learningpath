import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./index";
import * as schema from "./schema";

class MemoryStore {
  users: Array<typeof schema.users.$inferSelect> = [];
  studyPlans: Array<typeof schema.studyPlans.$inferSelect> = [];
  studyTasks: Array<typeof schema.studyTasks.$inferSelect> = [];
  sources: Array<typeof schema.sources.$inferSelect> = [];
  sourceChunks: Array<typeof schema.sourceChunks.$inferSelect> = [];
  embeddings: Array<typeof schema.embeddings.$inferSelect> = [];
  notes: Array<typeof schema.notes.$inferSelect> = [];
  noteVersions: Array<typeof schema.noteVersions.$inferSelect> = [];
  reminders: Array<typeof schema.reminders.$inferSelect> = [];
  progress: Array<typeof schema.progress.$inferSelect> = [];
  aiHistory: Array<typeof schema.aiGenerationHistory.$inferSelect> = [];
  files: Array<typeof schema.files.$inferSelect> = [];

  constructor() {
    const defaultHash = "$2a$10$wNqH8VvYwXf8s3Q/WvA4q.kXjQjG0iUfJq0Uj8r8c6fT6Yp0ZkX3y";
    const demoUser = {
      id: "demo-user-1",
      name: "Demo Student",
      email: "demo@studyplanner.ai",
      passwordHash: defaultHash,
      image: null,
      preferredAiProvider: "openai",
      preferredDifficulty: "intermediate",
      preferredLength: "medium",
      preferredPurpose: "exam",
      timezone: "UTC",
      emailNotifications: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(demoUser);

    const today = new Date().toISOString().split("T")[0];
    const plan = {
      id: "demo-plan-1",
      userId: demoUser.id,
      title: "Data Structures & Algorithms Mastery",
      description: "Comprehensive preparation for technical interviews and exams",
      subject: "Computer Science",
      targetDate: "2026-10-31",
      startDate: today,
      endDate: "2026-10-31",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.studyPlans.push(plan);

    const tasks = [
      {
        id: "task-1",
        planId: plan.id,
        userId: demoUser.id,
        title: "Binary Search Trees & Traversals",
        subject: "DSA",
        topic: "Binary Search Trees",
        subtopic: "Inorder, Preorder, Postorder & Level Order",
        scheduledDate: today,
        startTime: "09:00",
        endTime: "10:30",
        durationMinutes: 90,
        priority: "high",
        status: "in_progress",
        practicePlatform: "LeetCode",
        practiceUrl: "https://leetcode.com/tag/binary-search-tree/",
        notesSummary: "Tree traversals and BST validation logic",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "task-2",
        planId: plan.id,
        userId: demoUser.id,
        title: "Dynamic Programming - 0/1 Knapsack",
        subject: "DSA",
        topic: "Dynamic Programming",
        subtopic: "Knapsack patterns & memoization",
        scheduledDate: today,
        startTime: "14:00",
        endTime: "15:30",
        durationMinutes: 90,
        priority: "urgent",
        status: "not_started",
        practicePlatform: "GeeksforGeeks",
        practiceUrl: "https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/",
        notesSummary: "State transitions and table filling",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    this.studyTasks.push(...tasks);
  }
}

export const memoryStore = new MemoryStore();

function sanitizeTaskData(data: typeof schema.studyTasks.$inferInsert): typeof schema.studyTasks.$inferInsert {
  return {
    ...data,
    planId: data.planId && String(data.planId).trim() !== "" ? String(data.planId).trim() : null,
    startTime: data.startTime && String(data.startTime).trim() !== "" ? String(data.startTime).trim() : null,
    endTime: data.endTime && String(data.endTime).trim() !== "" ? String(data.endTime).trim() : null,
    subtopic: data.subtopic && String(data.subtopic).trim() !== "" ? String(data.subtopic).trim() : null,
    practicePlatform: data.practicePlatform && String(data.practicePlatform).trim() !== "" ? String(data.practicePlatform).trim() : null,
    practiceUrl: data.practiceUrl && String(data.practiceUrl).trim() !== "" ? String(data.practiceUrl).trim() : null,
    notesSummary: data.notesSummary && String(data.notesSummary).trim() !== "" ? String(data.notesSummary).trim() : null,
  };
}

async function ensureUserExistsInDb(db: NonNullable<ReturnType<typeof getDb>>, userId: string) {
  try {
    const existing = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (existing.length === 0) {
      // Find from memory store or create default demo user
      const memUser = memoryStore.users.find(u => u.id === userId) || {
        id: userId,
        name: "Demo Student",
        email: "demo@studyplanner.ai",
        passwordHash: "$2a$10$wNqH8VvYwXf8s3Q/WvA4q.kXjQjG0iUfJq0Uj8r8c6fT6Yp0ZkX3y",
        image: null,
        preferredAiProvider: "openai",
        preferredDifficulty: "intermediate",
        preferredLength: "medium",
        preferredPurpose: "exam",
        timezone: "UTC",
        emailNotifications: true,
      };

      await db.insert(schema.users).values({
        id: memUser.id,
        name: memUser.name,
        email: memUser.email,
        passwordHash: memUser.passwordHash,
        image: memUser.image,
        preferredAiProvider: memUser.preferredAiProvider,
        preferredDifficulty: memUser.preferredDifficulty,
        preferredLength: memUser.preferredLength,
        preferredPurpose: memUser.preferredPurpose,
        timezone: memUser.timezone,
        emailNotifications: memUser.emailNotifications,
      }).onConflictDoNothing();
    }
  } catch (err) {
    console.warn("User record sync check:", err);
  }
}

export const repo = {
  // --- USERS ---
  async getUserByEmail(email: string) {
    const db = getDb();
    if (db) {
      try {
        const results = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1);
        return results[0] || null;
      } catch (err) {
        console.warn("Postgres query fallback:", err);
      }
    }
    return memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async getUserById(id: string) {
    const db = getDb();
    if (db) {
      try {
        const results = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
        return results[0] || null;
      } catch (err) {
        console.warn("Postgres query fallback:", err);
      }
    }
    return memoryStore.users.find(u => u.id === id) || null;
  },

  async createUser(data: Omit<typeof schema.users.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const db = getDb();
    if (db) {
      try {
        const [user] = await db.insert(schema.users).values({
          ...data,
          email: data.email.toLowerCase(),
        }).returning();
        return user;
      } catch (err) {
        console.warn("Postgres insert fallback:", err);
      }
    }
    const newUser: typeof schema.users.$inferSelect = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      image: data.image || null,
      preferredAiProvider: data.preferredAiProvider || "openai",
      preferredDifficulty: data.preferredDifficulty || "intermediate",
      preferredLength: data.preferredLength || "medium",
      preferredPurpose: data.preferredPurpose || "exam",
      timezone: data.timezone || "UTC",
      emailNotifications: data.emailNotifications ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.users.push(newUser);
    return newUser;
  },

  async updateUser(id: string, data: Partial<typeof schema.users.$inferInsert>) {
    const db = getDb();
    if (db) {
      try {
        const [updated] = await db.update(schema.users).set({ ...data, updatedAt: new Date() }).where(eq(schema.users.id, id)).returning();
        return updated;
      } catch (err) {
        console.warn("Postgres update fallback:", err);
      }
    }
    const user = memoryStore.users.find(u => u.id === id);
    if (!user) return null;
    Object.assign(user, { ...data, updatedAt: new Date() });
    return user;
  },

  // --- STUDY PLANS ---
  async getStudyPlans(userId: string) {
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, userId);
        return await db.select().from(schema.studyPlans).where(eq(schema.studyPlans.userId, userId)).orderBy(desc(schema.studyPlans.createdAt));
      } catch (err) {
        console.warn("Postgres query fallback:", err);
      }
    }
    return memoryStore.studyPlans.filter(p => p.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getStudyPlanById(id: string, userId: string) {
    const db = getDb();
    if (db) {
      try {
        const [plan] = await db.select().from(schema.studyPlans).where(and(eq(schema.studyPlans.id, id), eq(schema.studyPlans.userId, userId))).limit(1);
        return plan || null;
      } catch (err) {
        console.warn("Postgres query fallback:", err);
      }
    }
    return memoryStore.studyPlans.find(p => p.id === id && p.userId === userId) || null;
  },

  async createStudyPlan(data: typeof schema.studyPlans.$inferInsert) {
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, data.userId);
        const [plan] = await db.insert(schema.studyPlans).values(data).returning();
        return plan;
      } catch (err) {
        console.warn("Postgres insert fallback:", err);
      }
    }
    const plan: typeof schema.studyPlans.$inferSelect = {
      id: data.id || crypto.randomUUID(),
      userId: data.userId,
      title: data.title,
      description: data.description || null,
      subject: data.subject || null,
      targetDate: data.targetDate || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      status: data.status || "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.studyPlans.push(plan);
    return plan;
  },

  async updateStudyPlan(id: string, userId: string, data: Partial<typeof schema.studyPlans.$inferInsert>) {
    const db = getDb();
    if (db) {
      try {
        const [plan] = await db.update(schema.studyPlans).set({ ...data, updatedAt: new Date() }).where(and(eq(schema.studyPlans.id, id), eq(schema.studyPlans.userId, userId))).returning();
        return plan;
      } catch (err) {
        console.warn("Postgres update fallback:", err);
      }
    }
    const plan = memoryStore.studyPlans.find(p => p.id === id && p.userId === userId);
    if (!plan) return null;
    Object.assign(plan, { ...data, updatedAt: new Date() });
    return plan;
  },

  async deleteStudyPlan(id: string, userId: string) {
    const db = getDb();
    if (db) {
      try {
        await db.delete(schema.studyPlans).where(and(eq(schema.studyPlans.id, id), eq(schema.studyPlans.userId, userId)));
        return true;
      } catch (err) {
        console.warn("Postgres delete fallback:", err);
      }
    }
    memoryStore.studyPlans = memoryStore.studyPlans.filter(p => !(p.id === id && p.userId === userId));
    memoryStore.studyTasks = memoryStore.studyTasks.filter(t => t.planId !== id);
    return true;
  },

  // --- STUDY TASKS ---
  async getTasks(userId: string, filters?: { date?: string; planId?: string; status?: string; subject?: string }) {
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, userId);
        const conditions = [eq(schema.studyTasks.userId, userId)];
        if (filters?.date) conditions.push(eq(schema.studyTasks.scheduledDate, filters.date));
        if (filters?.planId) conditions.push(eq(schema.studyTasks.planId, filters.planId));
        if (filters?.status) conditions.push(eq(schema.studyTasks.status, filters.status));
        if (filters?.subject) conditions.push(eq(schema.studyTasks.subject, filters.subject));
        return await db.select().from(schema.studyTasks).where(and(...conditions)).orderBy(schema.studyTasks.scheduledDate, schema.studyTasks.startTime);
      } catch (err) {
        console.warn("Postgres query fallback:", err);
      }
    }
    return memoryStore.studyTasks.filter(t => {
      if (t.userId !== userId) return false;
      if (filters?.date && t.scheduledDate !== filters.date) return false;
      if (filters?.planId && t.planId !== filters.planId) return false;
      if (filters?.status && t.status !== filters.status) return false;
      if (filters?.subject && t.subject.toLowerCase() !== filters.subject.toLowerCase()) return false;
      return true;
    }).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || (a.startTime || "").localeCompare(b.startTime || ""));
  },

  async getTaskById(id: string, userId: string) {
    const db = getDb();
    if (db) {
      try {
        const [task] = await db.select().from(schema.studyTasks).where(and(eq(schema.studyTasks.id, id), eq(schema.studyTasks.userId, userId))).limit(1);
        return task || null;
      } catch (err) {
        console.warn("Postgres query fallback:", err);
      }
    }
    return memoryStore.studyTasks.find(t => t.id === id && t.userId === userId) || null;
  },

  async createTask(data: typeof schema.studyTasks.$inferInsert) {
    const sanitized = sanitizeTaskData(data);
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, sanitized.userId);
        // Verify plan exists if planId is provided
        if (sanitized.planId) {
          const planExists = await db.select().from(schema.studyPlans).where(eq(schema.studyPlans.id, sanitized.planId)).limit(1);
          if (planExists.length === 0) sanitized.planId = null;
        }
        const [task] = await db.insert(schema.studyTasks).values(sanitized).returning();
        return task;
      } catch (err) {
        console.warn("Postgres insert task fallback:", err);
      }
    }
    const task: typeof schema.studyTasks.$inferSelect = {
      id: sanitized.id || crypto.randomUUID(),
      planId: sanitized.planId || null,
      userId: sanitized.userId,
      title: sanitized.title,
      subject: sanitized.subject,
      topic: sanitized.topic,
      subtopic: sanitized.subtopic || null,
      scheduledDate: sanitized.scheduledDate,
      startTime: sanitized.startTime || null,
      endTime: sanitized.endTime || null,
      durationMinutes: sanitized.durationMinutes ?? 60,
      priority: sanitized.priority || "medium",
      status: sanitized.status || "not_started",
      practicePlatform: sanitized.practicePlatform || null,
      practiceUrl: sanitized.practiceUrl || null,
      notesSummary: sanitized.notesSummary || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.studyTasks.push(task);
    return task;
  },

  async createTasksBatch(tasksData: Array<typeof schema.studyTasks.$inferInsert>) {
    if (!tasksData || tasksData.length === 0) return [];
    const sanitizedList = tasksData.map(sanitizeTaskData);
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, sanitizedList[0].userId);
        // Clean any invalid foreign keys across batch
        for (const item of sanitizedList) {
          if (item.planId) {
            const planExists = await db.select().from(schema.studyPlans).where(eq(schema.studyPlans.id, item.planId)).limit(1);
            if (planExists.length === 0) item.planId = null;
          }
        }
        return await db.insert(schema.studyTasks).values(sanitizedList).returning();
      } catch (err) {
        console.warn("Postgres insert batch fallback:", err);
      }
    }
    const created: Array<typeof schema.studyTasks.$inferSelect> = [];
    for (const data of sanitizedList) {
      const task: typeof schema.studyTasks.$inferSelect = {
        id: data.id || crypto.randomUUID(),
        planId: data.planId || null,
        userId: data.userId,
        title: data.title,
        subject: data.subject,
        topic: data.topic,
        subtopic: data.subtopic || null,
        scheduledDate: data.scheduledDate,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        durationMinutes: data.durationMinutes ?? 60,
        priority: data.priority || "medium",
        status: data.status || "not_started",
        practicePlatform: data.practicePlatform || null,
        practiceUrl: data.practiceUrl || null,
        notesSummary: data.notesSummary || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.studyTasks.push(task);
      created.push(task);
    }
    return created;
  },

  async updateTask(id: string, userId: string, data: Partial<typeof schema.studyTasks.$inferInsert>) {
    const sanitized = sanitizeTaskData({ ...data, userId } as any);
    const db = getDb();
    if (db) {
      try {
        const [task] = await db.update(schema.studyTasks).set({ ...sanitized, updatedAt: new Date() }).where(and(eq(schema.studyTasks.id, id), eq(schema.studyTasks.userId, userId))).returning();
        return task;
      } catch (err) {
        console.warn("Postgres update task fallback:", err);
      }
    }
    const task = memoryStore.studyTasks.find(t => t.id === id && t.userId === userId);
    if (!task) return null;
    Object.assign(task, { ...sanitized, updatedAt: new Date() });
    return task;
  },

  async deleteTask(id: string, userId: string) {
    const db = getDb();
    if (db) {
      try {
        await db.delete(schema.studyTasks).where(and(eq(schema.studyTasks.id, id), eq(schema.studyTasks.userId, userId)));
        return true;
      } catch (err) {
        console.warn("Postgres delete task fallback:", err);
      }
    }
    memoryStore.studyTasks = memoryStore.studyTasks.filter(t => !(t.id === id && t.userId === userId));
    return true;
  },

  // --- SOURCES & CHUNKS ---
  async getSources(userId: string) {
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, userId);
        return await db.select().from(schema.sources).where(eq(schema.sources.userId, userId)).orderBy(desc(schema.sources.createdAt));
      } catch (err) {
        console.warn("Postgres query sources fallback:", err);
      }
    }
    return memoryStore.sources.filter(s => s.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getSourceById(id: string, userId: string) {
    const db = getDb();
    if (db) {
      try {
        const [src] = await db.select().from(schema.sources).where(and(eq(schema.sources.id, id), eq(schema.sources.userId, userId))).limit(1);
        return src || null;
      } catch (err) {
        console.warn("Postgres query source fallback:", err);
      }
    }
    return memoryStore.sources.find(s => s.id === id && s.userId === userId) || null;
  },

  async createSource(data: typeof schema.sources.$inferInsert) {
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, data.userId);
        const [src] = await db.insert(schema.sources).values(data).returning();
        return src;
      } catch (err) {
        console.warn("Postgres insert source fallback:", err);
      }
    }
    const src: typeof schema.sources.$inferSelect = {
      id: data.id || crypto.randomUUID(),
      userId: data.userId,
      title: data.title,
      sourceType: data.sourceType,
      sourceUrl: data.sourceUrl || null,
      fileId: data.fileId || null,
      fileSize: data.fileSize || null,
      extractedContent: data.extractedContent || null,
      metadata: data.metadata || null,
      subject: data.subject || null,
      topic: data.topic || null,
      createdAt: new Date(),
    };
    memoryStore.sources.push(src);
    return src;
  },

  async deleteSource(id: string, userId: string) {
    const db = getDb();
    if (db) {
      try {
        await db.delete(schema.sources).where(and(eq(schema.sources.id, id), eq(schema.sources.userId, userId)));
        return true;
      } catch (err) {
        console.warn("Postgres delete source fallback:", err);
      }
    }
    memoryStore.sources = memoryStore.sources.filter(s => !(s.id === id && s.userId === userId));
    memoryStore.sourceChunks = memoryStore.sourceChunks.filter(c => c.sourceId !== id);
    memoryStore.embeddings = memoryStore.embeddings.filter(e => e.sourceId !== id);
    return true;
  },

  async createChunks(chunks: Array<typeof schema.sourceChunks.$inferInsert>) {
    const db = getDb();
    if (db) {
      try {
        return await db.insert(schema.sourceChunks).values(chunks).returning();
      } catch (err) {
        console.warn("Postgres insert chunks fallback:", err);
      }
    }
    const created: Array<typeof schema.sourceChunks.$inferSelect> = [];
    for (const c of chunks) {
      const chunk: typeof schema.sourceChunks.$inferSelect = {
        id: c.id || crypto.randomUUID(),
        sourceId: c.sourceId,
        userId: c.userId,
        chunkIndex: c.chunkIndex,
        content: c.content,
        metadata: c.metadata || null,
        createdAt: new Date(),
      };
      memoryStore.sourceChunks.push(chunk);
      created.push(chunk);
    }
    return created;
  },

  async getChunksBySourceId(sourceId: string, userId: string) {
    const db = getDb();
    if (db) {
      try {
        return await db.select().from(schema.sourceChunks).where(and(eq(schema.sourceChunks.sourceId, sourceId), eq(schema.sourceChunks.userId, userId))).orderBy(schema.sourceChunks.chunkIndex);
      } catch (err) {
        console.warn("Postgres query chunks fallback:", err);
      }
    }
    return memoryStore.sourceChunks.filter(c => c.sourceId === sourceId && c.userId === userId).sort((a, b) => a.chunkIndex - b.chunkIndex);
  },

  async getAllChunksForUser(userId: string) {
    const db = getDb();
    if (db) {
      try {
        return await db.select().from(schema.sourceChunks).where(eq(schema.sourceChunks.userId, userId));
      } catch (err) {
        console.warn("Postgres query chunks fallback:", err);
      }
    }
    return memoryStore.sourceChunks.filter(c => c.userId === userId);
  },

  // --- NOTES ---
  async getNotes(userId: string, taskId?: string) {
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, userId);
        const conditions = [eq(schema.notes.userId, userId)];
        if (taskId) conditions.push(eq(schema.notes.taskId, taskId));
        return await db.select().from(schema.notes).where(and(...conditions)).orderBy(desc(schema.notes.createdAt));
      } catch (err) {
        console.warn("Postgres query notes fallback:", err);
      }
    }
    return memoryStore.notes.filter(n => {
      if (n.userId !== userId) return false;
      if (taskId && n.taskId !== taskId) return false;
      return true;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getNoteById(id: string, userId: string) {
    const db = getDb();
    if (db) {
      try {
        const [note] = await db.select().from(schema.notes).where(and(eq(schema.notes.id, id), eq(schema.notes.userId, userId))).limit(1);
        return note || null;
      } catch (err) {
        console.warn("Postgres query note fallback:", err);
      }
    }
    return memoryStore.notes.find(n => n.id === id && n.userId === userId) || null;
  },

  async createNote(data: typeof schema.notes.$inferInsert) {
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, data.userId);
        const [note] = await db.insert(schema.notes).values(data).returning();
        if (note) {
          await db.insert(schema.noteVersions).values({
            noteId: note.id,
            userId: note.userId,
            versionNumber: 1,
            content: note.content,
            changeSummary: "Initial AI Generation",
          });
        }
        return note;
      } catch (err) {
        console.warn("Postgres insert note fallback:", err);
      }
    }
    const note: typeof schema.notes.$inferSelect = {
      id: data.id || crypto.randomUUID(),
      taskId: data.taskId || null,
      userId: data.userId,
      topic: data.topic,
      subject: data.subject,
      difficulty: data.difficulty || "intermediate",
      length: data.length || "medium",
      purpose: data.purpose || "exam",
      noteType: data.noteType || "standard",
      content: data.content,
      structuredData: data.structuredData || null,
      sourcesUsed: data.sourcesUsed || null,
      aiProvider: data.aiProvider || "openai",
      modelUsed: data.modelUsed || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.notes.push(note);
    memoryStore.noteVersions.push({
      id: crypto.randomUUID(),
      noteId: note.id,
      userId: note.userId,
      versionNumber: 1,
      content: note.content,
      changeSummary: "Initial AI Generation",
      createdAt: new Date(),
    });
    return note;
  },

  async updateNote(id: string, userId: string, content: string, changeSummary?: string) {
    const db = getDb();
    if (db) {
      try {
        const [existing] = await db.select().from(schema.notes).where(and(eq(schema.notes.id, id), eq(schema.notes.userId, userId))).limit(1);
        if (existing) {
          const versions = await db.select().from(schema.noteVersions).where(eq(schema.noteVersions.noteId, id));
          const nextVersion = (versions.length || 0) + 1;

          const [updated] = await db.update(schema.notes).set({ content, updatedAt: new Date() }).where(eq(schema.notes.id, id)).returning();
          await db.insert(schema.noteVersions).values({
            noteId: id,
            userId,
            versionNumber: nextVersion,
            content,
            changeSummary: changeSummary || `Update version ${nextVersion}`,
          });
          return updated;
        }
      } catch (err) {
        console.warn("Postgres update note fallback:", err);
      }
    }
    const note = memoryStore.notes.find(n => n.id === id && n.userId === userId);
    if (!note) return null;
    note.content = content;
    note.updatedAt = new Date();
    const existingVersions = memoryStore.noteVersions.filter(v => v.noteId === id);
    const nextVer = existingVersions.length + 1;
    memoryStore.noteVersions.push({
      id: crypto.randomUUID(),
      noteId: id,
      userId,
      versionNumber: nextVer,
      content,
      changeSummary: changeSummary || `Update version ${nextVer}`,
      createdAt: new Date(),
    });
    return note;
  },

  async getNoteVersions(noteId: string, userId: string) {
    const db = getDb();
    if (db) {
      try {
        return await db.select().from(schema.noteVersions).where(and(eq(schema.noteVersions.noteId, noteId), eq(schema.noteVersions.userId, userId))).orderBy(desc(schema.noteVersions.versionNumber));
      } catch (err) {
        console.warn("Postgres query versions fallback:", err);
      }
    }
    return memoryStore.noteVersions.filter(v => v.noteId === noteId && v.userId === userId).sort((a, b) => b.versionNumber - a.versionNumber);
  },

  async deleteNote(id: string, userId: string) {
    const db = getDb();
    if (db) {
      try {
        await db.delete(schema.notes).where(and(eq(schema.notes.id, id), eq(schema.notes.userId, userId)));
        return true;
      } catch (err) {
        console.warn("Postgres delete note fallback:", err);
      }
    }
    memoryStore.notes = memoryStore.notes.filter(n => !(n.id === id && n.userId === userId));
    memoryStore.noteVersions = memoryStore.noteVersions.filter(v => v.noteId !== id);
    return true;
  },

  // --- REMINDERS ---
  async getReminders(userId: string) {
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, userId);
        return await db.select().from(schema.reminders).where(eq(schema.reminders.userId, userId)).orderBy(schema.reminders.reminderTime);
      } catch (err) {
        console.warn("Postgres query reminders fallback:", err);
      }
    }
    return memoryStore.reminders.filter(r => r.userId === userId).sort((a, b) => a.reminderTime.getTime() - b.reminderTime.getTime());
  },

  async createReminder(data: typeof schema.reminders.$inferInsert) {
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, data.userId);
        const [reminder] = await db.insert(schema.reminders).values(data).returning();
        return reminder;
      } catch (err) {
        console.warn("Postgres insert reminder fallback:", err);
      }
    }
    const rem: typeof schema.reminders.$inferSelect = {
      id: data.id || crypto.randomUUID(),
      userId: data.userId,
      taskId: data.taskId || null,
      reminderTime: data.reminderTime,
      enabled: data.enabled ?? true,
      notificationType: data.notificationType || "upcoming_session",
      lastSentAt: data.lastSentAt || null,
      status: data.status || "pending",
      createdAt: new Date(),
    };
    memoryStore.reminders.push(rem);
    return rem;
  },

  async getPendingReminders() {
    const db = getDb();
    const now = new Date();
    if (db) {
      try {
        return await db.select().from(schema.reminders).where(and(eq(schema.reminders.enabled, true), eq(schema.reminders.status, "pending"), sql`${schema.reminders.reminderTime} <= ${now}`));
      } catch (err) {
        console.warn("Postgres query pending reminders fallback:", err);
      }
    }
    return memoryStore.reminders.filter(r => r.enabled && r.status === "pending" && r.reminderTime <= now);
  },

  async markReminderSent(id: string) {
    const db = getDb();
    if (db) {
      try {
        await db.update(schema.reminders).set({ status: "sent", lastSentAt: new Date() }).where(eq(schema.reminders.id, id));
        return;
      } catch (err) {
        console.warn("Postgres mark reminder fallback:", err);
      }
    }
    const rem = memoryStore.reminders.find(r => r.id === id);
    if (rem) {
      rem.status = "sent";
      rem.lastSentAt = new Date();
    }
  },

  // --- PROGRESS ---
  async getProgressLogs(userId: string) {
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, userId);
        return await db.select().from(schema.progress).where(eq(schema.progress.userId, userId)).orderBy(desc(schema.progress.date));
      } catch (err) {
        console.warn("Postgres query progress fallback:", err);
      }
    }
    return memoryStore.progress.filter(p => p.userId === userId).sort((a, b) => b.date.localeCompare(a.date));
  },

  async logProgress(userId: string, date: string, minutes: number, completedCount: number, subject: string) {
    const db = getDb();
    if (db) {
      try {
        await ensureUserExistsInDb(db, userId);
        const [existing] = await db.select().from(schema.progress).where(and(eq(schema.progress.userId, userId), eq(schema.progress.date, date))).limit(1);
        if (existing) {
          const breakdown = (existing.subjectBreakdown as Record<string, number>) || {};
          breakdown[subject] = (breakdown[subject] || 0) + minutes;
          const [updated] = await db.update(schema.progress).set({
            completedTasks: existing.completedTasks + completedCount,
            totalMinutesStudied: existing.totalMinutesStudied + minutes,
            subjectBreakdown: breakdown,
            updatedAt: new Date(),
          }).where(eq(schema.progress.id, existing.id)).returning();
          return updated;
        } else {
          const [created] = await db.insert(schema.progress).values({
            userId,
            date,
            completedTasks: completedCount,
            totalMinutesStudied: minutes,
            subjectBreakdown: { [subject]: minutes },
            streak: 1,
          }).returning();
          return created;
        }
      } catch (err) {
        console.warn("Postgres log progress fallback:", err);
      }
    }

    let p = memoryStore.progress.find(item => item.userId === userId && item.date === date);
    if (p) {
      p.completedTasks += completedCount;
      p.totalMinutesStudied += minutes;
      const breakdown = (p.subjectBreakdown as Record<string, number>) || {};
      breakdown[subject] = (breakdown[subject] || 0) + minutes;
      p.subjectBreakdown = breakdown;
      p.updatedAt = new Date();
      return p;
    } else {
      const newP: typeof schema.progress.$inferSelect = {
        id: crypto.randomUUID(),
        userId,
        date,
        completedTasks: completedCount,
        totalMinutesStudied: minutes,
        subjectBreakdown: { [subject]: minutes },
        streak: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.progress.push(newP);
      return newP;
    }
  },
};
