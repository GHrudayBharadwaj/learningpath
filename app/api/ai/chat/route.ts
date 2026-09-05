import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { executeAiPrompt, AIProvider } from '@/lib/ai/client';
import { retrieveRelevantChunks } from '@/lib/rag';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      prompt,
      messages = [],
      provider = 'gemini',
      modelName,
      apiKey,
      includeSources = true,
      mode = 'chat',
      subject = 'Computer Science',
      topic,
    } = body;

    const userPromptText = prompt || (messages.length > 0 ? messages[messages.length - 1].content : '');
    if (!userPromptText.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Step 1: Retrieve RAG Context if requested
    let contextText = '';
    let sourcesUsedList: Array<{ title: string; type: string }> = [];

    if (includeSources) {
      try {
        const queryText = `${subject} ${topic || userPromptText}`;
        const retrieved = await retrieveRelevantChunks(user.id, queryText, 3);
        if (retrieved.length > 0) {
          contextText = "\n\n### Context from Student Uploaded Sources and Notes:\n" +
            retrieved.map((r, i) => `[Doc ${i + 1}: ${r.sourceTitle} (${r.sourceType})]\n${r.content}`).join("\n\n");
          sourcesUsedList = retrieved.map(r => ({ title: r.sourceTitle, type: r.sourceType }));
        }
      } catch (err) {
        console.warn("RAG retrieval skipped:", err);
      }
    }

    // Step 2: Formulate System Prompt based on Mode
    let systemInstruction = "You are Antigravity AI, an ultra-intelligent Academic Tutor, CS Professor, and Technical Interview Coach.";

    if (mode === "exam_prep") {
      systemInstruction += " Provide strict University Examination style answers with 2-mark definitions, 5-mark structured workflows with diagrams, and 10-mark in-depth architectural breakdowns.";
    } else if (mode === "code_solution") {
      systemInstruction += " Provide optimal LeetCode/production solutions with step-by-step intuition, clean code in TypeScript/Python/Java, Time and Space complexity in LaTeX, and common corner cases.";
    } else if (mode === "explainer") {
      systemInstruction += " Explain concepts with intuitive real-world analogies, beginner-friendly explanations, ASCII architecture diagrams, and quick memory aids.";
    } else if (mode === "summarizer") {
      systemInstruction += " Generate a high-yield executive summary, key takeaways, formula list, and top exam tips.";
    } else if (mode === "flashcards") {
      systemInstruction += " Create 5 high-yield flashcard Q and As and 3 multiple choice practice questions with full explanations.";
    }

    systemInstruction += " Output formatted, student-ready GitHub Markdown with bold concepts, tables, KaTeX LaTeX math ($...$ or $$...$$), and syntax-highlighted code blocks.";

    const fullPrompt = `${userPromptText}${contextText}`;

    // Step 3: Execute AI model
    const aiResult = await executeAiPrompt(fullPrompt, systemInstruction, {
      provider: provider as AIProvider,
      modelName,
      apiKey: apiKey || undefined,
    });

    return NextResponse.json({
      reply: aiResult.text,
      thinkingProcess: aiResult.thinkingProcess,
      thinkingTimeSeconds: aiResult.thinkingTimeSeconds,
      provider: aiResult.provider,
      modelUsed: aiResult.modelUsed,
      fallbackUsed: aiResult.fallbackUsed,
      sourcesUsed: sourcesUsedList,
    });
  } catch (err: any) {
    console.error('AI Chat Route Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
