import { auth } from "@/auth";

export async function getCurrentUser() {
  try {
    const session = await auth();
    if (session?.user?.id) return session.user;
  } catch {
    // Continue to fallback
  }

  // Fallback for development if session not yet established
  return {
    id: "demo-user-1",
    name: "Demo Student",
    email: "demo@studyplanner.ai",
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    throw new Error("Unauthorized");
  }
  return user;
}
