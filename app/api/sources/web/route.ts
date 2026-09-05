import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db/repo";
import { webSourceSchema } from "@/lib/validation/schemas";
import { scrapeWebPage } from "@/lib/web/scraper";
import { chunkText } from "@/lib/documents/chunker";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = webSourceSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Validation failed", details: validated.error.flatten() }, { status: 400 });
    }

    const { url, title: customTitle, subject, topic } = validated.data;
    const scraped = await scrapeWebPage(url);

    const title = customTitle || scraped.title || "Web Reference";
    const source = await repo.createSource({
      userId: user.id,
      title,
      sourceType: "web",
      sourceUrl: url,
      extractedContent: scraped.content,
      metadata: { description: scraped.description, domain: scraped.source },
      subject: subject || "General",
      topic: topic || title,
    });

    // Chunk text for RAG retrieval
    const chunks = chunkText(scraped.content, 800, 100, { title, url });
    if (chunks.length > 0) {
      await repo.createChunks(chunks.map(c => ({
        sourceId: source.id,
        userId: user.id as string,
        chunkIndex: c.chunkIndex,
        content: c.content,
        metadata: c.metadata,
      })));
    }

    return NextResponse.json({ source, chunkCount: chunks.length }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
