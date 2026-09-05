import { NextResponse } from "next/server";
import { repo } from "@/lib/db/repo";
import { sendStudyReminderEmail } from "@/lib/reminders/email";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-cron-secret";

    if (authHeader !== `Bearer ${cronSecret}` && req.headers.get("x-cron-secret") !== cronSecret) {
      const url = new URL(req.url);
      if (url.searchParams.get("key") !== cronSecret && process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized cron execution request" }, { status: 401 });
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const results = [];

    // Process summary for active demo and registered users
    for (const user of repo ? [await repo.getUserByEmail("demo@studyplanner.ai")].filter(Boolean) : []) {
      if (!user) continue;
      const tasks = await repo.getTasks(user.id, { date: today });
      if (tasks.length > 0 && user.emailNotifications && user.email) {
        const topicsList = tasks.map(t => `${t.subject}: ${t.topic}`).join(", ");
        const emailResult = await sendStudyReminderEmail({
          to: user.email,
          userName: user.name,
          taskTitle: `Today's Agenda (${tasks.length} tasks scheduled)`,
          subject: "Daily Plan",
          topic: topicsList,
          type: "daily_summary",
        });
        results.push({ userId: user.id, email: user.email, tasksCount: tasks.length, sent: emailResult.success });
      }
    }

    return NextResponse.json({
      success: true,
      summariesSent: results.length,
      results,
      executedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Cron daily summary error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
