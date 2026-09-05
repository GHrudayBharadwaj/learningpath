import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db/repo";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId") || undefined;

    const notes = await repo.getNotes(user.id, taskId);
    return NextResponse.json({ notes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      topic,
      subject = "Computer Science",
      difficulty = "intermediate",
      length = "medium",
      purpose = "exam",
      noteType = "standard",
      content,
      sourcesUsed = [],
      aiProvider = "gemini",
      modelUsed = "AI Assistant",
      taskId,
    } = body;

    if (!topic || !content) {
      return NextResponse.json({ error: "Topic and content are required" }, { status: 400 });
    }

    const note = await repo.createNote({
      userId: user.id,
      taskId: taskId || null,
      topic,
      subject,
      difficulty,
      length,
      purpose,
      noteType,
      content,
      sourcesUsed,
      aiProvider,
      modelUsed,
      structuredData: {
        topic,
        subject,
        createdFrom: "AI Multi-Model Hub",
        generatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
