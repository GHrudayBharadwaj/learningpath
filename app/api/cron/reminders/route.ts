import { NextResponse } from "next/server";
import { repo } from "@/lib/db/repo";
import { sendStudyReminderEmail } from "@/lib/reminders/email";

export async function GET(req: Request) {
  try {
    // Verify Cron authorization secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-cron-secret";

    if (authHeader !== `Bearer ${cronSecret}` && req.headers.get("x-cron-secret") !== cronSecret) {
      // In development mode, allow if no strict cron secret or development query param
      const url = new URL(req.url);
      if (url.searchParams.get("key") !== cronSecret && process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized cron execution request" }, { status: 401 });
      }
    }

    const pendingReminders = await repo.getPendingReminders();
    const results = [];

    for (const rem of pendingReminders) {
      const user = await repo.getUserById(rem.userId);
      const task = rem.taskId ? await repo.getTaskById(rem.taskId, rem.userId) : null;

      if (user && user.emailNotifications && user.email) {
        const emailResult = await sendStudyReminderEmail({
          to: user.email,
          userName: user.name,
          taskTitle: task?.title || "Upcoming Study Target",
          subject: task?.subject || "General Study",
          topic: task?.topic || "Study Session",
          scheduledTime: task?.startTime || undefined,
          type: (rem.notificationType as any) || "upcoming_session",
        });

        await repo.markReminderSent(rem.id);
        results.push({ reminderId: rem.id, userId: user.id, email: user.email, sent: emailResult.success });
      } else {
        // Mark sent/skipped so it is not processed repeatedly
        await repo.markReminderSent(rem.id);
        results.push({ reminderId: rem.id, skipped: true, reason: "Notifications disabled or no email" });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      results,
      executedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Cron reminders error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
