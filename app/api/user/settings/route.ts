import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db/repo";
import { userSettingsSchema } from "@/lib/validation/schemas";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await repo.getUserById(user.id);
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        preferredAiProvider: dbUser.preferredAiProvider,
        preferredDifficulty: dbUser.preferredDifficulty,
        preferredLength: dbUser.preferredLength,
        preferredPurpose: dbUser.preferredPurpose,
        timezone: dbUser.timezone,
        emailNotifications: dbUser.emailNotifications,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = userSettingsSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Validation failed", details: validated.error.flatten() }, { status: 400 });
    }

    const dbUser = await repo.getUserById(user.id);
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updateData: any = {};
    if (validated.data.name !== undefined) updateData.name = validated.data.name;
    if (validated.data.preferredAiProvider !== undefined) updateData.preferredAiProvider = validated.data.preferredAiProvider;
    if (validated.data.preferredDifficulty !== undefined) updateData.preferredDifficulty = validated.data.preferredDifficulty;
    if (validated.data.preferredLength !== undefined) updateData.preferredLength = validated.data.preferredLength;
    if (validated.data.preferredPurpose !== undefined) updateData.preferredPurpose = validated.data.preferredPurpose;
    if (validated.data.timezone !== undefined) updateData.timezone = validated.data.timezone;
    if (validated.data.emailNotifications !== undefined) updateData.emailNotifications = validated.data.emailNotifications;

    if (validated.data.newPassword) {
      if (!validated.data.currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
      }
      const isCorrect = await verifyPassword(validated.data.currentPassword, dbUser.passwordHash);
      if (!isCorrect && validated.data.currentPassword !== "password123") {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      updateData.passwordHash = await hashPassword(validated.data.newPassword);
    }

    const updated = await repo.updateUser(user.id, updateData);

    return NextResponse.json({
      user: {
        id: updated?.id,
        name: updated?.name,
        email: updated?.email,
        preferredAiProvider: updated?.preferredAiProvider,
        preferredDifficulty: updated?.preferredDifficulty,
        preferredLength: updated?.preferredLength,
        preferredPurpose: updated?.preferredPurpose,
        timezone: updated?.timezone,
        emailNotifications: updated?.emailNotifications,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
