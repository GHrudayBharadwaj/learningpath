import { NextResponse } from "next/server";
import { testAiApiKey, AIProvider } from "@/lib/ai/client";

export async function POST(req: Request) {
 try {
 const body = await req.json();
 const { provider, apiKey } = body;

 if (!provider || !apiKey) {
 return NextResponse.json({ success: false, error: "Provider and API key are required" }, { status: 400 });
 }

 const result = await testAiApiKey(provider as AIProvider, apiKey);
 return NextResponse.json(result);
 } catch (err: any) {
 return NextResponse.json({ success: false, error: err.message }, { status: 500 });
 }
}
