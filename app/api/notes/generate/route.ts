import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db/repo";
import { generateNotesSchema } from "@/lib/validation/schemas";
import { retrieveRelevantChunks } from "@/lib/rag";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompts";
import { executeAiPrompt } from "@/lib/ai/client";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = generateNotesSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Validation failed", details: validated.error.flatten() }, { status: 400 });
    }

    const {
      taskId,
      topic,
      subject,
      difficulty,
      length,
      purpose,
      noteType,
      language,
      aiProvider,
      includeSources,
      specificSourceIds,
    } = validated.data;

    // Step 1: Retrieve RAG Context Chunks if requested
    let contextChunks: Array<{ title: string; content: string; sourceType: string }> = [];
    let sourcesUsedList: Array<{ title: string; type: string; url?: string; snippet?: string }> = [];

    if (includeSources) {
      const retrieved = await retrieveRelevantChunks(user.id, `${subject} ${topic}`, 4, specificSourceIds);
      contextChunks = retrieved.map(r => ({
        title: r.sourceTitle,
        content: r.content,
        sourceType: r.sourceType,
      }));

      sourcesUsedList = retrieved.map(r => ({
        title: r.sourceTitle,
        type: r.sourceType,
        snippet: r.content.slice(0, 160) + "...",
      }));
    }

    // Step 2: Build Structured Prompts
    const promptParams = {
      topic,
      subject,
      difficulty,
      length,
      purpose,
      noteType,
      language,
      contextChunks,
    };

    const systemPrompt = buildSystemPrompt(promptParams);
    const userPrompt = buildUserPrompt(promptParams);

    // Step 3: Execute AI Generation
    const aiResult = await executeAiPrompt(userPrompt, systemPrompt, {
      provider: aiProvider,
      modelName: validated.data.modelName,
      apiKey: validated.data.apiKey,
    });

    // Step 4: Save Note in Database
    const note = await repo.createNote({
      userId: user.id,
      taskId: taskId || null,
      topic,
      subject,
      difficulty,
      length,
      purpose,
      noteType,
      content: aiResult.text,
      sourcesUsed: sourcesUsedList,
      aiProvider: aiResult.provider,
      modelUsed: aiResult.modelUsed,
      structuredData: {
        topic,
        subject,
        generatedAt: new Date().toISOString(),
        fallbackUsed: aiResult.fallbackUsed,
        thinkingProcess: aiResult.thinkingProcess,
        thinkingTimeSeconds: aiResult.thinkingTimeSeconds,
      },
    });

    return NextResponse.json({
      note,
      sourcesCount: sourcesUsedList.length,
      modelUsed: aiResult.modelUsed,
      fallbackUsed: aiResult.fallbackUsed,
      thinkingProcess: aiResult.thinkingProcess,
      thinkingTimeSeconds: aiResult.thinkingTimeSeconds,
    }, { status: 201 });
  } catch (err: any) {
    console.error("Notes generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
