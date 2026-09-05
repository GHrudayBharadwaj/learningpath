export interface TargetField {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
}

export const TARGET_FIELDS: TargetField[] = [
  { key: "topic", label: "Topic", required: true, aliases: ["topic", "topic name", "chapter", "lesson", "module", "concept"] },
  { key: "subject", label: "Subject", required: true, aliases: ["subject", "course", "course name", "category", "domain", "track"] },
  { key: "scheduledDate", label: "Study Date", required: true, aliases: ["date", "study date", "scheduled date", "day", "target date"] },
  { key: "title", label: "Task Title", required: false, aliases: ["title", "task", "task title", "name", "activity", "assignment"] },
  { key: "subtopic", label: "Subtopic", required: false, aliases: ["subtopic", "sub topic", "details", "sub-concept", "section"] },
  { key: "startTime", label: "Start Time", required: false, aliases: ["start time", "start", "from", "time slot start"] },
  { key: "endTime", label: "End Time", required: false, aliases: ["end time", "end", "to", "time slot end"] },
  { key: "durationMinutes", label: "Duration (mins)", required: false, aliases: ["duration", "duration (mins)", "duration minutes", "mins", "estimated time", "hours"] },
  { key: "priority", label: "Priority", required: false, aliases: ["priority", "urgency", "importance", "level"] },
  { key: "status", label: "Status", required: false, aliases: ["status", "progress", "state", "completion"] },
  { key: "practicePlatform", label: "Practice Platform", required: false, aliases: ["platform", "practice platform", "practice", "resource site", "coding platform"] },
  { key: "practiceUrl", label: "Resource / URL", required: false, aliases: ["url", "link", "resource", "resource url", "practice url", "reference"] },
  { key: "notesSummary", label: "Notes / Summary", required: false, aliases: ["notes", "summary", "description", "remarks", "comments"] },
];

export function autoDetectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const cleanedHeaders = headers.map(h => ({ raw: h, normalized: h.toLowerCase().trim().replace(/[^a-z0-9]/g, "") }));

  for (const field of TARGET_FIELDS) {
    for (const header of cleanedHeaders) {
      const isDirectMatch = field.aliases.some(alias => {
        const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
        return normAlias === header.normalized || header.normalized.includes(normAlias);
      });

      if (isDirectMatch && !Object.values(mapping).includes(header.raw)) {
        mapping[field.key] = header.raw;
        break;
      }
    }
  }

  return mapping;
}
