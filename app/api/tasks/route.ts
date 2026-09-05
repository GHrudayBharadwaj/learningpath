import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db/repo";
import { studyTaskSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || undefined;
    const planId = searchParams.get("planId") || undefined;
    const status = searchParams.get("status") || undefined;
    const subject = searchParams.get("subject") || undefined;

    const tasks = await repo.getTasks(user.id, { date, planId, status, subject });
    return NextResponse.json({ tasks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Check if batch import from Excel
    if (Array.isArray(body.tasks)) {
      const batchSchema = z.array(studyTaskSchema);
      const validated = batchSchema.safeParse(body.tasks);
      if (!validated.success) {
        return NextResponse.json({ error: "Validation failed on some tasks", details: validated.error.flatten() }, { status: 400 });
      }

      const cleanPlanId = body.planId && String(body.planId).trim() !== "" ? String(body.planId).trim() : null;

      const tasksToInsert = validated.data.map(t => ({
        ...t,
        userId: user.id as string,
        planId: cleanPlanId || (t.planId && String(t.planId).trim() !== "" ? String(t.planId).trim() : null),
        startTime: t.startTime && String(t.startTime).trim() !== "" ? String(t.startTime).trim() : null,
        endTime: t.endTime && String(t.endTime).trim() !== "" ? String(t.endTime).trim() : null,
        subtopic: t.subtopic && String(t.subtopic).trim() !== "" ? String(t.subtopic).trim() : null,
        practicePlatform: t.practicePlatform && String(t.practicePlatform).trim() !== "" ? String(t.practicePlatform).trim() : null,
        practiceUrl: t.practiceUrl && String(t.practiceUrl).trim() !== "" ? String(t.practiceUrl).trim() : null,
        notesSummary: t.notesSummary && String(t.notesSummary).trim() !== "" ? String(t.notesSummary).trim() : null,
      }));

      const created = await repo.createTasksBatch(tasksToInsert);
      return NextResponse.json({ createdCount: created.length, tasks: created }, { status: 201 });
    }

    const validated = studyTaskSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Validation failed", details: validated.error.flatten() }, { status: 400 });
    }

    const cleanPlanId = validated.data.planId && String(validated.data.planId).trim() !== "" ? String(validated.data.planId).trim() : null;

    const task = await repo.createTask({
      ...validated.data,
      userId: user.id,
      planId: cleanPlanId,
      startTime: validated.data.startTime && String(validated.data.startTime).trim() !== "" ? String(validated.data.startTime).trim() : null,
      endTime: validated.data.endTime && String(validated.data.endTime).trim() !== "" ? String(validated.data.endTime).trim() : null,
      subtopic: validated.data.subtopic && String(validated.data.subtopic).trim() !== "" ? String(validated.data.subtopic).trim() : null,
      practicePlatform: validated.data.practicePlatform && String(validated.data.practicePlatform).trim() !== "" ? String(validated.data.practicePlatform).trim() : null,
      practiceUrl: validated.data.practiceUrl && String(validated.data.practiceUrl).trim() !== "" ? String(validated.data.practiceUrl).trim() : null,
      notesSummary: validated.data.notesSummary && String(validated.data.notesSummary).trim() !== "" ? String(validated.data.notesSummary).trim() : null,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
