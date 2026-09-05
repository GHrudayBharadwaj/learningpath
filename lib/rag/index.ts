import { repo } from "@/lib/db/repo";

export interface RetrievedChunk {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  content: string;
  similarity: number;
}

function calculateSimilarity(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  if (queryWords.length === 0) return 0;

  const target = text.toLowerCase();
  let matches = 0;

  for (const word of queryWords) {
    if (target.includes(word)) {
      matches += 1;
      const count = (target.match(new RegExp(`\\b${word}\\b`, "g")) || []).length;
      matches += Math.min(count - 1, 3) * 0.5;
    }
  }

  return matches / (queryWords.length + 1);
}

export async function retrieveRelevantChunks(
  userId: string,
  query: string,
  topK = 4,
  specificSourceIds?: string[]
): Promise<RetrievedChunk[]> {
  const sources = await repo.getSources(userId);
  if (sources.length === 0) return [];

  const sourceMap = new Map(sources.map(s => [s.id, s]));
  const allChunks = await repo.getAllChunksForUser(userId);

  const filteredChunks = specificSourceIds && specificSourceIds.length > 0
    ? allChunks.filter(c => specificSourceIds.includes(c.sourceId))
    : allChunks;

  if (filteredChunks.length === 0) {
    return sources
      .filter(s => specificSourceIds ? specificSourceIds.includes(s.id) : true)
      .slice(0, topK)
      .map(s => ({
        chunkId: s.id,
        sourceId: s.id,
        sourceTitle: s.title,
        sourceType: s.sourceType,
        content: (s.extractedContent || "").slice(0, 1000),
        similarity: 1.0,
      }));
  }

  const scored = filteredChunks.map(chunk => {
    const src = sourceMap.get(chunk.sourceId);
    const score = calculateSimilarity(query, chunk.content);
    return {
      chunkId: chunk.id,
      sourceId: chunk.sourceId,
      sourceTitle: src?.title || "Document Source",
      sourceType: src?.sourceType || "document",
      content: chunk.content,
      similarity: score,
    };
  });

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}
