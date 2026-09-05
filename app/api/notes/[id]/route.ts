import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db/repo";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const note = await repo.getNoteById(id, user.id);
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    const versions = await repo.getNoteVersions(id, user.id);
    return NextResponse.json({ note, versions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    if (!body.content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const updated = await repo.updateNote(id, user.id, body.content, body.changeSummary);
    if (!updated) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    const versions = await repo.getNoteVersions(id, user.id);
    return NextResponse.json({ note: updated, versions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await repo.deleteNote(id, user.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
