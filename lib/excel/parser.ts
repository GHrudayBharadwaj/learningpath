import * as XLSX from "xlsx";
import { format, parse, isValid } from "date-fns";

import { addDays, parseISO } from "date-fns";

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  mapped: {
    title?: string;
    subject: string;
    topic: string;
    subtopic?: string;
    scheduledDate: string;
    dayNumber?: number;
    dayLabel?: string;
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
  totalDays: number;
  totalHours: number;
  dayGroups: Array<{
    dayNumber: number;
    date: string;
    dayLabel: string;
    tasksCount: number;
    totalDurationMinutes: number;
    tasks: ParsedRow[];
  }>;
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

export function normalizeDate(rawVal: any, baseDate: Date = new Date(), rowIndex: number = 0): { date: string; dayNumber?: number } {
  if (!rawVal && rawVal !== 0) {
    const calculatedDate = addDays(baseDate, rowIndex);
    return { date: format(calculatedDate, "yyyy-MM-dd"), dayNumber: rowIndex + 1 };
  }

  if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
    return { date: format(rawVal, "yyyy-MM-dd") };
  }

  // Check if rawVal is an Excel numeric date (e.g. 45000)
  if (typeof rawVal === "number" && rawVal > 1000 && rawVal < 100000) {
    try {
      const parsedDate = new Date((rawVal - (25567 + 2)) * 86400 * 1000);
      if (isValid(parsedDate)) {
        return { date: format(parsedDate, "yyyy-MM-dd") };
      }
    } catch {
      // Continue
    }
  }

  const str = String(rawVal).trim();
  if (!str) {
    const calculatedDate = addDays(baseDate, rowIndex);
    return { date: format(calculatedDate, "yyyy-MM-dd"), dayNumber: rowIndex + 1 };
  }

  // Case: "Day 1", "Day 01", "Day-2", "D1", "Day 1 - Intro", "Week 1 Day 2"
  const dayMatch = str.match(/^(?:week\s*(\d+)\s*)?day\s*[-_:]?\s*(\d+)/i) ||
                   str.match(/^d(\d+)$/i);

  if (dayMatch) {
    let dayNum = 1;
    if (dayMatch[2]) {
      const weekNum = dayMatch[1] ? parseInt(dayMatch[1], 10) : 1;
      const dayInWeek = parseInt(dayMatch[2], 10);
      dayNum = (weekNum - 1) * 7 + dayInWeek;
    } else if (dayMatch[1]) {
      dayNum = parseInt(dayMatch[1], 10);
    }
    if (dayNum > 0 && dayNum < 10000) {
      const calculatedDate = addDays(baseDate, dayNum - 1);
      return { date: format(calculatedDate, "yyyy-MM-dd"), dayNumber: dayNum };
    }
  }

  // Pure day number (1 to 999) when user provides just day index
  if (/^\d{1,3}$/.test(str)) {
    const dayNum = parseInt(str, 10);
    if (dayNum > 0 && dayNum < 1000) {
      const calculatedDate = addDays(baseDate, dayNum - 1);
      return { date: format(calculatedDate, "yyyy-MM-dd"), dayNumber: dayNum };
    }
  }

  // Standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return { date: str };
  }

  const formats = [
    "dd/MM/yyyy", "MM/dd/yyyy", "yyyy/MM/dd",
    "dd-MM-yyyy", "MM-dd-yyyy", "dd.MM.yyyy",
    "d/M/yyyy", "M/d/yyyy", "yyyy-M-d",
    "MMM d, yyyy", "MMMM d, yyyy", "d MMM yyyy",
    "yyyy.MM.dd", "d-MMM-yyyy", "d-MMM-yy",
    "dd-MMM-yyyy", "dd-MMM-yy"
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(str, fmt, new Date());
      if (isValid(parsed) && parsed.getFullYear() > 2000 && parsed.getFullYear() < 2100) {
        return { date: format(parsed, "yyyy-MM-dd") };
      }
    } catch {
      // Continue
    }
  }

  const calculatedDate = addDays(baseDate, rowIndex);
  return { date: format(calculatedDate, "yyyy-MM-dd"), dayNumber: rowIndex + 1 };
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
  options?: { baseStartDate?: string; existingTaskSignatures?: Set<string> } | Set<string>
): ParseResult {
  const existingTaskSignatures = options instanceof Set 
    ? options 
    : (options?.existingTaskSignatures || new Set<string>());

  const baseDateStr = (!(options instanceof Set) && options?.baseStartDate) 
    ? options.baseStartDate 
    : format(new Date(), "yyyy-MM-dd");

  const baseDate = new Date(baseDateStr);
  const validBaseDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;

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
    const dateResult = normalizeDate(rawDate, validBaseDate, rowIndex);
    const scheduledDate = dateResult.date;
    const dayNumber = dateResult.dayNumber;

    if (!rawTopic) errors.push("Topic is required");
    if (!rawSubject) errors.push("Subject is required");
    if (!scheduledDate) errors.push("Valid study date is required");

    const topic = rawTopic || "Untitled Topic";
    const subject = rawSubject || "General";
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
    const dayLabel = `Day ${dayNumber}`;

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
        dayNumber,
        dayLabel,
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

  // Group by Date / DayNumber
  const dayGroupMap = new Map<string, {
    dayNumber: number;
    date: string;
    dayLabel: string;
    tasksCount: number;
    totalDurationMinutes: number;
    tasks: ParsedRow[];
  }>();

  // Sort rows chronologically
  parsedRows.sort((a, b) => a.mapped.scheduledDate.localeCompare(b.mapped.scheduledDate));

  // Determine earliest date
  const earliestDateStr = parsedRows[0]?.mapped.scheduledDate || baseDateStr;
  let earliestDate: Date;
  try {
    earliestDate = parseISO(earliestDateStr);
  } catch {
    earliestDate = validBaseDate;
  }

  let computedDayIndex = 1;
  const dateToDayIndex = new Map<string, number>();

  parsedRows.forEach((row) => {
    const d = row.mapped.scheduledDate;
    if (!dateToDayIndex.has(d)) {
      dateToDayIndex.set(d, computedDayIndex++);
    }

    // Determine actual day number
    let actualDayNumber = row.mapped.dayNumber;
    if (!actualDayNumber || actualDayNumber <= 0) {
      try {
        const rowDate = parseISO(d);
        if (isValid(rowDate) && isValid(earliestDate)) {
          const dayOffset = Math.round((rowDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
          actualDayNumber = dayOffset >= 0 ? dayOffset + 1 : dateToDayIndex.get(d)!;
        } else {
          actualDayNumber = dateToDayIndex.get(d)!;
        }
      } catch {
        actualDayNumber = dateToDayIndex.get(d)!;
      }
    }

    const label = `Day ${actualDayNumber}`;
    row.mapped.dayNumber = actualDayNumber;
    row.mapped.dayLabel = label;

    if (!dayGroupMap.has(d)) {
      dayGroupMap.set(d, {
        dayNumber: actualDayNumber,
        date: d,
        dayLabel: label,
        tasksCount: 0,
        totalDurationMinutes: 0,
        tasks: [],
      });
    }

    const group = dayGroupMap.get(d)!;
    group.tasksCount += 1;
    group.totalDurationMinutes += row.mapped.durationMinutes;
    group.tasks.push(row);
  });

  const dayGroups = Array.from(dayGroupMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const totalMinutes = parsedRows.reduce((acc, r) => acc + (r.mapped.durationMinutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return {
    headers,
    rawRowsCount: parsedRows.length,
    validRowsCount,
    invalidRowsCount,
    totalDays: dayGroups.length,
    totalHours,
    dayGroups,
    rows: parsedRows,
  };
}
