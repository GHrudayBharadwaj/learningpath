import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db/repo";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const logs = await repo.getProgressLogs(user.id);
    const tasks = await repo.getTasks(user.id);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const pendingTasks = tasks.filter(t => t.status === "not_started" || t.status === "in_progress").length;
    const missedTasks = tasks.filter(t => t.status === "missed").length;
    const totalMinutes = tasks.filter(t => t.status === "completed").reduce((acc, t) => acc + (t.durationMinutes || 60), 0);

    // Subject breakdown
    const subjectStats: Record<string, { total: number; completed: number; minutes: number }> = {};
    for (const t of tasks) {
      if (!subjectStats[t.subject]) {
        subjectStats[t.subject] = { total: 0, completed: 0, minutes: 0 };
      }
      subjectStats[t.subject].total += 1;
      if (t.status === "completed") {
        subjectStats[t.subject].completed += 1;
        subjectStats[t.subject].minutes += t.durationMinutes || 60;
      }
    }

    return NextResponse.json({
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        missedTasks,
        totalStudyHours: Math.round((totalMinutes / 60) * 10) / 10,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        streakDays: logs.length > 0 ? logs[0].streak : (completedTasks > 0 ? 1 : 0),
      },
      subjectStats,
      dailyLogs: logs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { date, minutes, completedCount, subject } = body;

    const logged = await repo.logProgress(
      user.id,
      date || new Date().toISOString().split("T")[0],
      minutes || 60,
      completedCount || 1,
      subject || "General"
    );

    return NextResponse.json({ progress: logged }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
