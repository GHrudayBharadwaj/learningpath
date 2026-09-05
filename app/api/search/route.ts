import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db/repo";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").toLowerCase().trim();

    if (!query) {
      return NextResponse.json({ results: { plans: [], tasks: [], notes: [], sources: [] } });
    }

    const [plans, tasks, notes, sources] = await Promise.all([
      repo.getStudyPlans(user.id),
      repo.getTasks(user.id),
      repo.getNotes(user.id),
      repo.getSources(user.id),
    ]);

    const matchedPlans = plans.filter(p =>
      p.title.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query)) || (p.subject && p.subject.toLowerCase().includes(query))
    );

    const matchedTasks = tasks.filter(t =>
      t.title.toLowerCase().includes(query) || t.topic.toLowerCase().includes(query) || t.subject.toLowerCase().includes(query) || (t.subtopic && t.subtopic.toLowerCase().includes(query))
    );

    const matchedNotes = notes.filter(n =>
      n.topic.toLowerCase().includes(query) || n.subject.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)
    );

    const matchedSources = sources.filter(s =>
      s.title.toLowerCase().includes(query) || (s.subject && s.subject.toLowerCase().includes(query)) || (s.topic && s.topic.toLowerCase().includes(query))
    );

    return NextResponse.json({
      query,
      results: {
        plans: matchedPlans.slice(0, 5),
        tasks: matchedTasks.slice(0, 10),
        notes: matchedNotes.slice(0, 5),
        sources: matchedSources.slice(0, 5),
      },
      totalMatches: matchedPlans.length + matchedTasks.length + matchedNotes.length + matchedSources.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
