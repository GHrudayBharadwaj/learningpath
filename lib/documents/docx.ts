import mammoth from "mammoth";

export async function extractTextFromDocx(buffer: Buffer | ArrayBuffer): Promise<{ text: string; wordCount: number }> {
  try {
    const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const result = await mammoth.extractRawText({ buffer: nodeBuffer });
    const text = result.value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    return { text, wordCount };
  } catch (error: any) {
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}
