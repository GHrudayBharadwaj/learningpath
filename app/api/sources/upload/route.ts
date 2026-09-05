import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db/repo";
import { uploadFileToBlob } from "@/lib/storage/blob";
import { extractTextFromPdf } from "@/lib/documents/pdf";
import { extractTextFromDocx } from "@/lib/documents/docx";
import { chunkText } from "@/lib/documents/chunker";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subject = (formData.get("subject") as string) || "General";
    const topic = (formData.get("topic") as string) || "";
    const customTitle = (formData.get("title") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Size limit: 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds maximum permitted size of 20MB" }, { status: 400 });
    }

    const fileName = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = fileName.split(".").pop()?.toLowerCase();

    let extractedText = "";
    let fileType = "txt";

    if (ext === "pdf") {
      fileType = "pdf";
      const { text } = await extractTextFromPdf(buffer);
      extractedText = text;
    } else if (ext === "docx" || ext === "doc") {
      fileType = "docx";
      const { text } = await extractTextFromDocx(buffer);
      extractedText = text;
    } else if (ext === "txt" || ext === "md") {
      fileType = "txt";
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload PDF, DOCX, or TXT." }, { status: 400 });
    }

    // Store in Vercel Blob
    const blobResult = await uploadFileToBlob(buffer, fileName, file.type || "application/octet-stream");

    const title = customTitle || fileName;
    const source = await repo.createSource({
      userId: user.id,
      title,
      sourceType: fileType,
      fileSize: file.size,
      sourceUrl: blobResult.url,
      extractedContent: extractedText,
      metadata: { originalName: fileName, blobUrl: blobResult.url },
      subject,
      topic: topic || title,
    });

    // Chunk text for RAG retrieval
    const chunks = chunkText(extractedText, 800, 100, { title, fileName, fileType });
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
      blobUrl: blobResult.url,
      chunkCount: chunks.length,
      extractedLength: extractedText.length,
    }, { status: 201 });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
