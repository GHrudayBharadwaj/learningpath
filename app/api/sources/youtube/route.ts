import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db/repo";
import { youtubeSourceSchema } from "@/lib/validation/schemas";
import { fetchYouTubeInfo } from "@/lib/youtube/transcript";
import { chunkText } from "@/lib/documents/chunker";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = youtubeSourceSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Validation failed", details: validated.error.flatten() }, { status: 400 });
    }

    const { url, title: customTitle, subject, topic } = validated.data;
    const ytInfo = await fetchYouTubeInfo(url);

    const title = customTitle || ytInfo.title || "YouTube Resource";
    const source = await repo.createSource({
      userId: user.id,
      title,
      sourceType: "youtube",
      sourceUrl: url,
      extractedContent: ytInfo.transcriptText,
      metadata: {
        channel: ytInfo.channel,
        hasTranscript: ytInfo.hasTranscript,
        statusMessage: ytInfo.statusMessage,
      },
      subject: subject || "General",
      topic: topic || title,
    });

    const chunks = chunkText(ytInfo.transcriptText, 800, 100, { title, channel: ytInfo.channel, url });
    if (chunks.length > 0) {
      await repo.createChunks(chunks.map(c => ({
        sourceId: source.id,
        userId: user.id as string,
        chunkIndex: c.chunkIndex,
        content: c.content,
        metadata: c.metadata,
      })));
    }

    return NextResponse.json({
      source,
      hasTranscript: ytInfo.hasTranscript,
      statusMessage: ytInfo.statusMessage,
      chunkCount: chunks.length,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
