export interface TextChunk {
  chunkIndex: number;
  content: string;
  charCount: number;
  metadata?: Record<string, any>;
}

export function chunkText(text: string, chunkSize = 800, overlap = 100, metadata: Record<string, any> = {}): TextChunk[] {
  if (!text || text.trim().length === 0) return [];

  const cleaned = text.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();
  const paragraphs = cleaned.split(/\n\s*\n/);
  const chunks: TextChunk[] = [];
  
  let currentChunk = "";
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (currentChunk.length + trimmedPara.length + 2 <= chunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmedPara;
    } else {
      if (currentChunk) {
        chunks.push({
          chunkIndex,
          content: currentChunk.trim(),
          charCount: currentChunk.length,
          metadata: { ...metadata, chunkIndex },
        });
        chunkIndex++;
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + "\n\n" + trimmedPara;
      } else {
        let remaining = trimmedPara;
        while (remaining.length > chunkSize) {
          const splitPoint = remaining.lastIndexOf(". ", chunkSize);
          const cutAt = splitPoint > 100 ? splitPoint + 1 : chunkSize;
          chunks.push({
            chunkIndex,
            content: remaining.slice(0, cutAt).trim(),
            charCount: cutAt,
            metadata: { ...metadata, chunkIndex },
          });
          chunkIndex++;
          remaining = remaining.slice(Math.max(0, cutAt - overlap));
        }
        currentChunk = remaining;
      }
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      chunkIndex,
      content: currentChunk.trim(),
      charCount: currentChunk.length,
      metadata: { ...metadata, chunkIndex },
    });
  }

  return chunks;
}
