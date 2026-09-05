import * as XLSX from "xlsx";
import { format, parse, isValid } from "date-fns";

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  mapped: {
    title?: string;
    subject: string;
    topic: string;
    subtopic?: string;
    scheduledDate: string;
    startTime?: string;
    endTime?: string;
    durationMinutes: number;
    priority: "low" | "medium" | "high" | "urgent";
    status: "not_started" | "in_progress" | "completed" | "missed" | "rescheduled";
    practicePlatform?: string;
    practiceUrl?: string;
    notesSummary?: string;
  };
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
}

export interface ParseResult {
  headers: string[];
  rawRowsCount: number;
  validRowsCount: number;
  invalidRowsCount: number;
  rows: ParsedRow[];
}

export function parseExcelBuffer(buffer: ArrayBuffer | Buffer): { headers: string[]; rawData: any[][] } {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Excel file does not contain any sheets.");

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];

  if (!rawData || rawData.length === 0) {
    throw new Error("The uploaded sheet is empty.");
  }

  let headerIndex = 0;
  while (headerIndex < rawData.length && (!rawData[headerIndex] || rawData[headerIndex].filter(Boolean).length === 0)) {
    headerIndex++;
  }

  if (headerIndex >= rawData.length) {
    throw new Error("No header columns found in Excel file.");
  }

  const headers = rawData[headerIndex].map(h => String(h || "").trim());
  const rows = rawData.slice(headerIndex + 1);

  return { headers, rawData: rows };
}

function normalizeDate(rawVal: any): string | null {
  if (!rawVal) return null;

  if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
    return format(rawVal, "yyyy-MM-dd");
  }

  const str = String(rawVal).trim();
  if (!str) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const formats = [
    "dd/MM/yyyy", "MM/dd/yyyy", "yyyy/MM/dd",
    "dd-MM-yyyy", "MM-dd-yyyy", "dd.MM.yyyy",
    "d/M/yyyy", "M/d/yyyy", "yyyy-M-d",
    "MMM d, yyyy", "MMMM d, yyyy", "d MMM yyyy"
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(str, fmt, new Date());
      if (isValid(parsed) && parsed.getFullYear() > 2000 && parsed.getFullYear() < 2100) {
        return format(parsed, "yyyy-MM-dd");
      }
    } catch {
      // Continue
    }
  }

  return format(new Date(), "yyyy-MM-dd");
}

function normalizePriority(val: any): "low" | "medium" | "high" | "urgent" {
  const s = String(val || "").toLowerCase().trim();
  if (s.includes("urg") || s.includes("crit") || s === "p1") return "urgent";
  if (s.includes("high") || s.includes("imp") || s === "p2") return "high";
  if (s.includes("low") || s.includes("minor") || s === "p4") return "low";
  return "medium";
}

function normalizeStatus(val: any): "not_started" | "in_progress" | "completed" | "missed" | "rescheduled" {
  const s = String(val || "").toLowerCase().trim();
  if (s.includes("done") || s.includes("comp") || s.includes("finished")) return "completed";
  if (s.includes("prog") || s.includes("start") || s.includes("doing")) return "in_progress";
  if (s.includes("miss") || s.includes("delay")) return "missed";
  if (s.includes("resched") || s.includes("postponed")) return "rescheduled";
  return "not_started";
}

function normalizeDuration(val: any): number {
  if (!val) return 60;
  const num = parseInt(String(val).replace(/[^0-9]/g, ""), 10);
  if (isNaN(num) || num <= 0) return 60;
  if (num <= 10 && String(val).toLowerCase().includes("h")) {
    return num * 60;
  }
  return Math.min(num, 720);
}

export function processMappedRows(
  headers: string[],
  rows: any[][],
  mapping: Record<string, string>,
  existingTaskSignatures: Set<string> = new Set()
): ParseResult {
  const headerIndexMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    headerIndexMap[h] = idx;
  });

  const parsedRows: ParsedRow[] = [];
  const seenSignatures = new Set<string>();

  rows.forEach((row, rowIndex) => {
    if (!row || row.filter(Boolean).length === 0) return;

    const getVal = (fieldKey: string) => {
      const headerName = mapping[fieldKey];
      if (!headerName) return "";
      const colIdx = headerIndexMap[headerName];
      if (colIdx === undefined) return "";
      return row[colIdx] !== undefined ? row[colIdx] : "";
    };

    const errors: string[] = [];
    const rawTopic = String(getVal("topic") || "").trim();
    const rawSubject = String(getVal("subject") || "").trim();
    const rawDate = getVal("scheduledDate");
    const formattedDate = normalizeDate(rawDate);

    if (!rawTopic) errors.push("Topic is required");
    if (!rawSubject) errors.push("Subject is required");
    if (!formattedDate) errors.push("Valid study date is required");

    const topic = rawTopic || "Untitled Topic";
    const subject = rawSubject || "General";
    const scheduledDate = formattedDate || format(new Date(), "yyyy-MM-dd");
    const subtopic = String(getVal("subtopic") || "").trim() || undefined;
    const title = String(getVal("title") || "").trim() || `${subject}: ${topic}`;
    const startTime = String(getVal("startTime") || "").trim() || undefined;
    const endTime = String(getVal("endTime") || "").trim() || undefined;
    const durationMinutes = normalizeDuration(getVal("durationMinutes"));
    const priority = normalizePriority(getVal("priority"));
    const status = normalizeStatus(getVal("status"));
    const practicePlatform = String(getVal("practicePlatform") || "").trim() || undefined;
    const practiceUrl = String(getVal("practiceUrl") || "").trim() || undefined;
    const notesSummary = String(getVal("notesSummary") || "").trim() || undefined;

    const signature = `${scheduledDate}|${subject.toLowerCase()}|${topic.toLowerCase()}`;
    const isDuplicate = seenSignatures.has(signature) || existingTaskSignatures.has(signature);
    seenSignatures.add(signature);

    parsedRows.push({
      rowNumber: rowIndex + 1,
      data: Object.fromEntries(headers.map((h, i) => [h, row[i]])),
      mapped: {
        title,
        subject,
        topic,
        subtopic,
        scheduledDate,
        startTime,
        endTime,
        durationMinutes,
        priority,
        status,
        practicePlatform,
        practiceUrl,
        notesSummary,
      },
      isValid: errors.length === 0,
      errors,
      isDuplicate,
    });
  });

  const validRowsCount = parsedRows.filter(r => r.isValid).length;
  const invalidRowsCount = parsedRows.filter(r => !r.isValid).length;

  return {
    headers,
    rawRowsCount: parsedRows.length,
    validRowsCount,
    invalidRowsCount,
    rows: parsedRows,
  };
}
