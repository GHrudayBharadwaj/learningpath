import { NextResponse } from "next/server";
import { repo } from "@/lib/db/repo";
import { hashPassword } from "@/lib/auth/password";
import { signupSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = signupSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = validated.data;
    const existing = await repo.getUserByEmail(email);

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await repo.createUser({
      name,
      email,
      passwordHash,
      image: null,
      preferredAiProvider: "openai",
      preferredDifficulty: "intermediate",
      preferredLength: "medium",
      preferredPurpose: "exam",
      timezone: "UTC",
      emailNotifications: true,
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while creating account" },
      { status: 500 }
    );
  }
}
