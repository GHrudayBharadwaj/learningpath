import { Resend } from "resend";

export interface EmailReminderPayload {
  to: string;
  userName: string;
  taskTitle: string;
  subject: string;
  topic: string;
  scheduledTime?: string;
  type: "upcoming_session" | "daily_summary" | "missed_task" | "revision";
}

export async function sendStudyReminderEmail(payload: EmailReminderPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Study Planner <notifications@resend.dev>";

  if (!apiKey) {
    console.log(`[Simulated Email Dispatch] To: ${payload.to} | Subject: ${payload.subject} - ${payload.topic}`);
    return { success: true, id: `sim_${Date.now()}` };
  }

  try {
    const resend = new Resend(apiKey);
    const subjectLine = payload.type === "daily_summary" 
      ? `Daily Study Plan Summary - ${new Date().toLocaleDateString()}`
      : payload.type === "missed_task"
      ? `Reminder: Incomplete Study Session: ${payload.topic}`
      : `Upcoming Study Session: ${payload.subject} (${payload.topic})`;

    const timeBlock = payload.scheduledTime ? `<p><strong>Scheduled Time:</strong> ${payload.scheduledTime}</p>` : "";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">AI Study Planner Reminder</h2>
        <p>Hello <strong>${payload.userName}</strong>,</p>
        <p>This is your scheduled reminder for your study target:</p>
        <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #2563eb; margin: 16px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #0f172a;">${payload.taskTitle}</h3>
          <p style="margin: 4px 0; color: #475569;"><strong>Subject:</strong> ${payload.subject}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Topic:</strong> ${payload.topic}</p>
          ${timeBlock}
        </div>
        <p>Log in to your AI Study Planner to view AI-generated notes, track your practice problems, and mark this task complete.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 12px;">Open Study Planner</a>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 12px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">AI Study Planner - Powered by Vercel Serverless</p>
      </div>
    `;

    const result = await resend.emails.send({
      from,
      to: payload.to,
      subject: subjectLine,
      html: htmlContent,
    });

    return { success: true, id: result.data?.id };
  } catch (error: any) {
    console.error("Resend delivery failed:", error);
    return { success: false, error: error.message };
  }
}
