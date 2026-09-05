import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db/repo";
import { reminderSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const remindersList = await repo.getReminders(user.id);
    return NextResponse.json({ reminders: remindersList });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = reminderSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Validation failed", details: validated.error.flatten() }, { status: 400 });
    }

    const reminderTime = new Date(validated.data.reminderTime);
    if (isNaN(reminderTime.getTime())) {
      return NextResponse.json({ error: "Invalid reminder date/time" }, { status: 400 });
    }

    const reminder = await repo.createReminder({
      userId: user.id,
      taskId: validated.data.taskId || null,
      reminderTime,
      notificationType: validated.data.notificationType,
      enabled: true,
      status: "pending",
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
