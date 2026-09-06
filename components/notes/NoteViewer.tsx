"use client";

import React, { useState } from "react";
import {
  Download,
  Copy,
  Printer,
  Check,
  History,
  Edit3,
  Save,
  Sparkles,
  BookOpen,
  Clock,
  Tag,
  Brain,
  ChevronDown,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { FormattedContent } from "@/components/ui/FormattedContent";

export function NoteViewer({
  note,
  versions = [],
  onUpdateContent,
}: {
  note: any;
  versions?: any[];
  onUpdateContent?: (content: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note?.content || "");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [showThinking, setShowThinking] = useState(false);

  // Sync content when note changes
  React.useEffect(() => {
    if (note?.content) {
      setContent(note.content);
    }
  }, [note?.id, note?.content]);

  if (!note) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <Sparkles className="h-10 w-10 mx-auto text-purple-400 mb-2 animate-pulse" />
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Select or generate a note to view details</p>
        <p className="text-xs text-gray-400 mt-1">Generate multi-model notes with Gemini, GPT-4o, Claude, DeepSeek, or Groq.</p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${note.topic.toLowerCase().replace(/\s+/g, "_")}_notes.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    if (!onUpdateContent) return;
    setIsSaving(true);
    try {
      await onUpdateContent(content);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const activeContent = selectedVersion
    ? versions.find((v) => v.versionNumber === selectedVersion)?.content || content
    : content;

  const thinkingProcess = note?.structuredData?.thinkingProcess;
  const thinkingTime = note?.structuredData?.thinkingTimeSeconds;

  const providerName =
    note.aiProvider === "gemini"
      ? "Google Gemini"
      : note.aiProvider === "openai"
      ? "OpenAI"
      : note.aiProvider === "anthropic"
      ? "Anthropic Claude"
      : note.aiProvider === "deepseek"
      ? "DeepSeek"
      : note.aiProvider === "groq"
      ? "Groq"
      : note.aiProvider === "offline"
      ? "Offline Academic Engine"
      : note.aiProvider || "AI Engine";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Note Header & Metadata */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
              <Badge variant="purple">{note.subject}</Badge>
              <Badge variant="secondary" className="capitalize">
                {note.difficulty} Level
              </Badge>
              <Badge variant="default" className="capitalize">
                {note.purpose}
              </Badge>
              <span className="text-[11px] text-gray-400 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(note.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{note.topic}</h1>
            <div className="flex items-center space-x-2 mt-1.5 flex-wrap text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <Cpu className="h-3.5 w-3.5 text-purple-600" />
                <span>Engine: <strong>{providerName}</strong></span>
              </span>
              <span>&bull;</span>
              <span className="font-mono text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-900/50">
                {note.modelUsed || "Standard Model"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (isEditing) handleSave();
                else setIsEditing(true);
              }}
              disabled={isSaving}
            >
              {isEditing ? (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  <span>{isSaving ? "Saving..." : "Save Edits"}</span>
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                  <span>Edit Note</span>
                </>
              )}
            </Button>

            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <span>Export .MD</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              <span>Print / PDF</span>
            </Button>
          </div>
        </div>

        {/* Version History Selector */}
        {versions && versions.length > 1 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center space-x-2 text-xs">
            <History className="h-4 w-4 text-gray-400" />
            <span className="font-semibold text-gray-600 dark:text-gray-300">Version History:</span>
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(v.versionNumber === selectedVersion ? null : v.versionNumber)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                    selectedVersion === v.versionNumber || (!selectedVersion && v.versionNumber === versions[0].versionNumber)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  v{v.versionNumber}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Deep Thinking & Academic Reasoning Breakdown */}
      {thinkingProcess && (
        <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/40">
          <button
            type="button"
            onClick={() => setShowThinking(!showThinking)}
            className="w-full flex items-center justify-between text-left text-xs font-semibold text-purple-900 dark:text-purple-200 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span>
                AI Deep Thinking &amp; Reasoning Process {thinkingTime ? `(Thought for ${thinkingTime.toFixed(1)}s)` : ""}
              </span>
              <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                {note.modelUsed || "Reasoning Engine"}
              </Badge>
            </div>
            <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400 text-xs">
              <span>{showThinking ? "Hide breakdown" : "Show breakdown"}</span>
              {showThinking ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </button>

          {showThinking && (
            <div className="mt-3 p-3.5 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-purple-200/70 dark:border-purple-900/50 text-[11px] font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap animate-in fade-in duration-150">
              {thinkingProcess}
            </div>
          )}
        </div>
      )}

      {/* Verified Sources Used Section */}
      {note.sourcesUsed && note.sourcesUsed.length > 0 && (
        <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">
            <BookOpen className="h-4 w-4" />
            <span>Verified Sources Cited in this Note ({note.sourcesUsed.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {note.sourcesUsed.map((src: any, idx: number) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-white dark:bg-gray-800/80 border border-blue-100 dark:border-blue-900/40 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                    {src.title}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase py-0">
                    {src.type}
                  </Badge>
                </div>
                {src.snippet && <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{src.snippet}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-6 sm:p-8">
        {isEditing ? (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-500 block">Note Content Editor</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[500px] font-mono text-xs leading-relaxed"
            />
          </div>
        ) : (
          <div className="max-w-none text-xs leading-relaxed">
            <FormattedContent content={activeContent} />
          </div>
        )}
      </div>
    </div>
  );
}
