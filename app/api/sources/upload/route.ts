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

    const contentType = req.headers.get("content-type") || "";

    // CASE 1: Direct JSON Upload (Client-extracted text for large documents > 4.5MB)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { fileName, fileSize, fileType, extractedText, subject, topic, customTitle } = body;

      if (!fileName || !extractedText) {
        return NextResponse.json({ error: "Missing required document data (fileName, extractedText)" }, { status: 400 });
      }

      const cleanDocTitle = customTitle || fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
      const source = await repo.createSource({
        userId: user.id,
        title: cleanDocTitle || fileName,
        sourceType: fileType || "pdf",
        fileSize: fileSize || extractedText.length,
        sourceUrl: `/uploads/${Date.now()}-${encodeURIComponent(fileName)}`,
        extractedContent: extractedText,
        metadata: { originalName: fileName, directExtracted: true },
        subject: subject || "General",
        topic: topic || cleanDocTitle,
      });

      const chunks = chunkText(extractedText, 800, 100, { title: cleanDocTitle, fileName, fileType: fileType || "pdf" });
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
        success: true,
        createdCount: 1,
        source,
        sources: [source],
        chunkCount: chunks.length,
        extractedLength: extractedText.length,
      }, { status: 201 });
    }

    // CASE 2: Multi-Part Form Data (Standard file uploads)
    const formData = await req.formData();
    
    // Support both single ("file") and multiple ("files") file uploads
    const files: File[] = [];
    const filesList = formData.getAll("files") as File[];
    if (filesList.length > 0) {
      files.push(...filesList);
    }
    const singleFile = formData.get("file") as File | null;
    if (singleFile && !files.includes(singleFile)) {
      files.push(singleFile);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided for upload." }, { status: 400 });
    }

    const defaultSubject = (formData.get("subject") as string) || "General";
    const defaultTopic = (formData.get("topic") as string) || "";
    const customTitle = (formData.get("title") as string) || "";

    const uploadedSources: any[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        if (!file || typeof file.size !== "number") continue;

        // Size limit: 25MB per file
        if (file.size > 25 * 1024 * 1024) {
          errors.push(`"${file.name}" exceeds 25MB limit.`);
          continue;
        }

        const fileName = file.name;
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = fileName.split(".").pop()?.toLowerCase() || "";

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
          errors.push(`"${file.name}": Unsupported format (${ext}). Please upload PDF, DOCX, TXT, or MD.`);
          continue;
        }

        // Upload file to Vercel Blob
        const blobResult = await uploadFileToBlob(buffer, fileName, file.type || "application/octet-stream");

        // Clean document name as title
        const cleanDocTitle = customTitle && files.length === 1
          ? customTitle
          : fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();

        const source = await repo.createSource({
          userId: user.id,
          title: cleanDocTitle || fileName,
          sourceType: fileType,
          fileSize: file.size,
          sourceUrl: blobResult.url,
          extractedContent: extractedText,
          metadata: { originalName: fileName, blobUrl: blobResult.url },
          subject: defaultSubject,
          topic: defaultTopic || cleanDocTitle,
        });

        // Chunk text for RAG retrieval
        const chunks = chunkText(extractedText, 800, 100, { title: cleanDocTitle, fileName, fileType });
        if (chunks.length > 0) {
          await repo.createChunks(chunks.map(c => ({
            sourceId: source.id,
            userId: user.id as string,
            chunkIndex: c.chunkIndex,
            content: c.content,
            metadata: c.metadata,
          })));
        }

        uploadedSources.push({
          source,
          fileName,
          chunkCount: chunks.length,
          extractedLength: extractedText.length,
        });
      } catch (err: any) {
        errors.push(`Failed to process "${file.name}": ${err.message}`);
      }
    }

    if (uploadedSources.length === 0 && errors.length > 0) {
      return NextResponse.json({ error: errors.join(" | ") }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      createdCount: uploadedSources.length,
      sources: uploadedSources.map(u => u.source),
      details: uploadedSources,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 201 });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
