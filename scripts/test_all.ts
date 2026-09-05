import { repo } from "../lib/db/repo";
import { parseExcelBuffer, processMappedRows } from "../lib/excel/parser";
import { autoDetectMapping } from "../lib/excel/mapping";
import { chunkText } from "../lib/documents/chunker";
import { extractTextFromPdf } from "../lib/documents/pdf";
import { extractTextFromDocx } from "../lib/documents/docx";
import { executeAiPrompt } from "../lib/ai/client";
import { buildSystemPrompt, buildUserPrompt } from "../lib/ai/prompts";
import { retrieveRelevantChunks } from "../lib/rag";
import { sendStudyReminderEmail } from "../lib/reminders/email";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import * as fs from "fs";

async function runAllTests() {
  console.log("=== STARTING FULL-STACK TEST SUITE ===\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Password Hashing & Verification
  console.log("1. Testing Authentication & Password Hashing...");
  const rawPw = "SecureStudentPass123!";
  const hashed = await hashPassword(rawPw);
  const isMatch = await verifyPassword(rawPw, hashed);
  const isBadMatch = await verifyPassword("WrongPassword", hashed);
  assert(isMatch === true, "Password matches hash correctly");
  assert(isBadMatch === false, "Incorrect password rejected");

  // 2. Excel & CSV Importer Engine
  console.log("\n2. Testing Excel/CSV Parsing & Column Heuristics...");
  const sampleCsv = fs.readFileSync("public/sample_study_plan.csv");
  const { headers, rawData } = parseExcelBuffer(sampleCsv);
  assert(headers.length >= 7, `Detected ${headers.length} headers in sample CSV`);

  const detectedMapping = autoDetectMapping(headers);
  assert(!!detectedMapping.topic, "Auto-detected 'topic' mapping");
  assert(!!detectedMapping.subject, "Auto-detected 'subject' mapping");
  assert(!!detectedMapping.scheduledDate, "Auto-detected 'scheduledDate' mapping");

  const parsed = processMappedRows(headers, rawData, detectedMapping);
  assert(parsed.validRowsCount > 0, `Validated ${parsed.validRowsCount} rows successfully`);
  assert(parsed.invalidRowsCount === 0, "Zero invalid rows in sample data");

  // 3. Document Chunking & Extractors
  console.log("\n3. Testing Document Chunking & Extractors...");
  const testDocumentText = `
    Operating Systems Concept: Virtual Memory.
    Virtual memory is a memory management capability of an OS that uses hardware and software to allow a computer to compensate for physical memory shortages.
    Paging divides memory into fixed-size blocks called pages and frames.
    The Translation Lookaside Buffer (TLB) acts as a high-speed cache for page table entries.
  `.repeat(10);

  const chunks = chunkText(testDocumentText, 300, 50, { subject: "Operating Systems" });
  assert(chunks.length > 1, `Generated ${chunks.length} overlapping chunks from document`);
  assert(chunks[0].charCount <= 350, "Chunk size adheres to bounds");

  // 4. RAG Retrieval & Similarity Matching
  console.log("\n4. Testing RAG Retrieval Engine...");
  const user = await repo.getUserByEmail("demo@studyplanner.ai");
  assert(!!user, "Demo user loaded from database repository");

  if (user) {
    const src = await repo.createSource({
      userId: user.id,
      title: "Operating Systems Textbook",
      sourceType: "pdf",
      extractedContent: testDocumentText,
      subject: "Operating Systems",
      topic: "Virtual Memory",
    });

    await repo.createChunks(chunks.map(c => ({
      sourceId: src.id,
      userId: user.id,
      chunkIndex: c.chunkIndex,
      content: c.content,
      metadata: c.metadata,
    })));

    const retrieved = await retrieveRelevantChunks(user.id, "Virtual Memory TLB page table", 2);
    assert(retrieved.length > 0, `Retrieved ${retrieved.length} relevant RAG chunks`);
    assert(retrieved[0].content.includes("Memory") || retrieved[0].content.includes("TLB"), "Retrieved chunk matches search intent");
  }

  // 5. AI Notes Generator & Exam Formats
  console.log("\n5. Testing AI Notes & Exam Generation Engine...");
  const examParams = {
    topic: "B-Trees Indexing",
    subject: "Database Systems",
    difficulty: "intermediate" as const,
    length: "medium" as const,
    purpose: "exam" as const,
    noteType: "exam_5mark" as const,
  };

  const sysPrompt = buildSystemPrompt(examParams);
  const userPrompt = buildUserPrompt(examParams);
  const aiResult = await executeAiPrompt(userPrompt, sysPrompt, { provider: "openai" });

  assert(aiResult.text.length > 50, "AI Note generator produced structured output");
  assert(aiResult.text.includes("5-Mark") || aiResult.text.includes("B-Trees"), "Exam format properly structured");

  // 6. Reminder & Email Notification System
  console.log("\n6. Testing Scheduled Email Reminder Delivery...");
  const emailRes = await sendStudyReminderEmail({
    to: "student@example.com",
    userName: "Alex",
    taskTitle: "Graph Algorithms Practice",
    subject: "Computer Science",
    topic: "Dijkstra Algorithm",
    scheduledTime: "10:00 AM",
    type: "upcoming_session",
  });
  assert(emailRes.success === true, "Email reminder payload created and validated");

  // 7. Progress Tracking & Metrics
  console.log("\n7. Testing Progress Logging & Analytics...");
  if (user) {
    const today = new Date().toISOString().split("T")[0];
    const log = await repo.logProgress(user.id, today, 90, 2, "Computer Science");
    assert(log.completedTasks >= 2, "Progress logged completed task count");
    assert(log.totalMinutesStudied >= 90, "Progress logged study minutes");
  }

  console.log("\n=========================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================\n");

  if (failed > 0) process.exit(1);
}

runAllTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
