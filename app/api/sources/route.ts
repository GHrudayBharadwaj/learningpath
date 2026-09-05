import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db/repo";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sources = await repo.getSources(user.id);
    return NextResponse.json({ sources });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
