export interface TargetField {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
}

export const TARGET_FIELDS: TargetField[] = [
  { key: "scheduledDate", label: "Day / Study Date", required: true, aliases: ["day", "day #", "day number", "daywise", "day wise", "date", "study date", "scheduled date", "target date", "timeline", "when", "schedule day"] },
  { key: "subject", label: "Subject", required: true, aliases: ["subject", "course", "course name", "subject name", "category", "domain", "track", "tech stack", "language", "module name"] },
  { key: "topic", label: "Topic", required: true, aliases: ["topic", "topic name", "chapter", "lesson", "module", "concept", "key concept", "syllabus", "content", "learning target"] },
  { key: "title", label: "Task Title", required: false, aliases: ["title", "task", "task title", "name", "activity", "assignment", "session name", "task name"] },
  { key: "subtopic", label: "Subtopic", required: false, aliases: ["subtopic", "sub topic", "details", "sub-concept", "section", "description", "concepts covered"] },
  { key: "startTime", label: "Start Time", required: false, aliases: ["start time", "start", "from", "time slot start", "session start"] },
  { key: "endTime", label: "End Time", required: false, aliases: ["end time", "end", "to", "time slot end", "session end"] },
  { key: "durationMinutes", label: "Duration (mins)", required: false, aliases: ["duration", "duration (mins)", "duration minutes", "mins", "minutes", "estimated time", "hours", "time", "duration (hours)", "allocated time"] },
  { key: "priority", label: "Priority", required: false, aliases: ["priority", "urgency", "importance", "level", "difficulty"] },
  { key: "status", label: "Status", required: false, aliases: ["status", "progress", "state", "completion"] },
  { key: "practicePlatform", label: "Practice Platform", required: false, aliases: ["platform", "practice platform", "practice", "resource site", "coding platform", "portal"] },
  { key: "practiceUrl", label: "Resource / URL", required: false, aliases: ["url", "link", "resource", "resource url", "practice url", "reference", "video url", "website"] },
  { key: "notesSummary", label: "Notes / Summary", required: false, aliases: ["notes", "summary", "remarks", "comments", "takeaways"] },
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
