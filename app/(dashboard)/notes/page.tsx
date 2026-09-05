"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Plus,
  BookOpen,
  FileText,
  Search,
  Filter,
  Layers,
  CheckCircle2,
  Cpu,
  GraduationCap,
  History,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { NoteViewer } from "@/components/notes/NoteViewer";
import { AVAILABLE_MODELS, AIProvider } from "@/lib/ai/client";

function NotesContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || "";
  const initialSubject = searchParams.get("subject") || "";
  const initialTaskId = searchParams.get("taskId") || "";
  const initialAction = searchParams.get("action") || "";

  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [noteVersions, setNoteVersions] = useState<any[]>([]);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(initialAction === "generate");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sources, setSources] = useState<any[]>([]);

  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isKeyTesting, setIsKeyTesting] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  const [genForm, setGenForm] = useState<{
    topic: string;
    subject: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    length: "short" | "medium" | "detailed";
    purpose: "exam" | "interview" | "coding" | "revision";
    noteType: "standard" | "exam_2mark" | "exam_5mark" | "exam_10mark" | "coding_practice";
    language: string;
    aiProvider: AIProvider;
    modelName: string;
    includeSources: boolean;
  }>({
    topic: initialTopic || "Dynamic Programming & Optimization",
    subject: initialSubject || "Data Structures & Algorithms",
    difficulty: "intermediate",
    length: "detailed",
    purpose: "exam",
    noteType: "standard",
    language: "English",
    aiProvider: "gemini",
    modelName: "gemini-1.5-flash",
    includeSources: true,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem(`ai_study_planner_${genForm.aiProvider}_key`) || "";
      setApiKey(storedKey);
      setKeyTestStatus(null);
    }
  }, [genForm.aiProvider]);

  const handleProviderChange = (provider: AIProvider) => {
    const models = AVAILABLE_MODELS[provider] || [];
    setGenForm(prev => ({
      ...prev,
      aiProvider: provider,
      modelName: models.length > 0 ? models[0].id : prev.modelName,
    }));
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem(`ai_study_planner_${provider}_key`) || "";
      setApiKey(storedKey);
      setKeyTestStatus(null);
    }
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) return;
    setIsKeyTesting(true);
    setKeyTestStatus(null);
    try {
      const res = await fetch("/api/ai/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: genForm.aiProvider, apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      setKeyTestStatus({ success: data.success, message: data.message || data.error });
      if (data.success && typeof window !== "undefined") {
        localStorage.setItem(`ai_study_planner_${genForm.aiProvider}_key`, apiKey.trim());
      }
    } catch (err: any) {
      setKeyTestStatus({ success: false, message: err.message });
    } finally {
      setIsKeyTesting(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const [notesRes, sourcesRes] = await Promise.all([
        fetch("/api/notes"),
        fetch("/api/sources"),
      ]);

      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotes(data.notes || []);
        if (data.notes?.length > 0 && !selectedNote) {
          loadNoteDetail(data.notes[0].id);
        }
      }

      if (sourcesRes.ok) {
        const sData = await sourcesRes.json();
        setSources(sData.sources || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadNoteDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedNote(data.note);
        setNoteVersions(data.versions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    if (apiKey && typeof window !== "undefined") {
      localStorage.setItem(`ai_study_planner_${genForm.aiProvider}_key`, apiKey.trim());
    }

    try {
      const res = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...genForm,
          modelName: genForm.modelName,
          apiKey: apiKey.trim() || undefined,
          taskId: initialTaskId || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsGenerateModalOpen(false);
        await fetchNotes();
        if (data.note) {
          loadNoteDetail(data.note.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateContent = async (newContent: string) => {
    if (!selectedNote) return;
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedNote(data.note);
        setNoteVersions(data.versions || []);
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study note?")) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedNote(null);
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotes = notes.filter(n =>
    n.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <span>AI Study Notes & Exam Sheets</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Multi-source RAG synthesis, 2/5/10-mark exam sheets, and structured note management.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsGenerateModalOpen(true)} className="text-xs font-semibold shadow-md shadow-purple-500/10">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          <span>Generate New Notes</span>
        </Button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved notes..."
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <Card className="p-6 text-center text-xs text-gray-400">
                No study notes found. Click "Generate New Notes" to create one.
              </Card>
            ) : (
              filteredNotes.map((n) => {
                const isSelected = selectedNote?.id === n.id;
                return (
                  <div
                    key={n.id}
                    onClick={() => loadNoteDetail(n.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-xs"
                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="purple" className="text-[10px] py-0">{n.subject}</Badge>
                      <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{n.topic}</h3>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <span className="capitalize">{n.difficulty} &bull; {n.purpose}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(n.id);
                        }}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <NoteViewer
            note={selectedNote}
            versions={noteVersions}
            onUpdateContent={handleUpdateContent}
          />
        </div>
      </div>

      {/* Generation Dialog Modal */}
      <Dialog
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="AI Study Notes & Exam Preparation Generator"
        description="Configure difficulty, length, exam note format, and multi-source RAG context."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleGenerate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Subject *</label>
              <Input
                required
                value={genForm.subject}
                onChange={(e) => setGenForm({ ...genForm, subject: e.target.value })}
                placeholder="e.g. Operating Systems, Chemistry"
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Topic *</label>
              <Input
                required
                value={genForm.topic}
                onChange={(e) => setGenForm({ ...genForm, topic: e.target.value })}
                placeholder="e.g. Deadlock Detection & Prevention"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Format / Note Type</label>
              <select
                value={genForm.noteType}
                onChange={(e) => setGenForm({ ...genForm, noteType: e.target.value as any })}
                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="standard">Comprehensive Study Notes</option>
                <option value="exam_2mark">2-Mark Exam Sheet (Short & Key Point)</option>
                <option value="exam_5mark">5-Mark Exam Sheet (Structured + Diagram)</option>
                <option value="exam_10mark">10-Mark Essay (Deep Dive & Applications)</option>
                <option value="coding_practice">Coding & Interview Practice Guide</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Primary Purpose</label>
              <select
                value={genForm.purpose}
                onChange={(e) => setGenForm({ ...genForm, purpose: e.target.value as any })}
                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="exam">University / College Exam</option>
                <option value="interview">Technical Job Interview</option>
                <option value="coding">Coding & Algorithm Practice</option>
                <option value="revision">Fast Revision</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">AI Provider Engine</label>
              <select
                value={genForm.aiProvider}
                onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="deepseek">DeepSeek</option>
                <option value="groq">Groq (Llama 3.3)</option>
                <option value="offline">Offline Academic Engine (Free / No Key)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Specific Model</label>
              <select
                value={genForm.modelName}
                onChange={(e) => setGenForm({ ...genForm, modelName: e.target.value })}
                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 font-medium"
              >
                {(AVAILABLE_MODELS[genForm.aiProvider] || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.badge ? `(${m.badge})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Difficulty</label>
              <select
                value={genForm.difficulty}
                onChange={(e) => setGenForm({ ...genForm, difficulty: e.target.value as any })}
                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Note Length</label>
              <select
                value={genForm.length}
                onChange={(e) => setGenForm({ ...genForm, length: e.target.value as any })}
                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="short">Quick / Concise</option>
                <option value="medium">Standard</option>
                <option value="detailed">In-Depth Comprehensive</option>
              </select>
            </div>
          </div>

          {/* AI Model API Key input */}
          {genForm.aiProvider !== "offline" && (
            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  <span className="font-semibold text-purple-900 dark:text-purple-200">
                    {genForm.aiProvider.toUpperCase()} API Key
                  </span>
                  <span className="text-[10px] text-purple-500 font-normal">(Optional if env set)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="text-[11px] text-purple-600 hover:text-purple-800 font-medium underline cursor-pointer"
                >
                  {showApiKeyInput ? "Hide" : apiKey ? "Configured ✓ (Change / Test)" : "Enter API Key"}
                </button>
              </div>
              
              {showApiKeyInput && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`Enter ${genForm.aiProvider} API key (e.g. AIzaSy... or sk-proj-...)`}
                      className="text-xs h-8 bg-white dark:bg-gray-900 font-mono flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestKey}
                      disabled={isKeyTesting || !apiKey}
                      className="h-8 text-[11px] px-3 shrink-0"
                    >
                      {isKeyTesting ? "Testing..." : "Test Key"}
                    </Button>
                  </div>
                  {keyTestStatus && (
                    <div className={`text-[11px] p-2 rounded-lg ${
                      keyTestStatus.success ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}>
                      {keyTestStatus.message}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500">
                    Your key is stored locally in your browser and used directly for note generation.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-blue-900 dark:text-blue-200 block">RAG Multi-Source Synthesis</span>
              <p className="text-[11px] text-gray-500">Automatically retrieve relevant chunks from your {sources.length} uploaded sources</p>
            </div>
            <input
              type="checkbox"
              checked={genForm.includeSources}
              onChange={(e) => setGenForm({ ...genForm, includeSources: e.target.checked })}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isGenerating}>
              {isGenerating ? "Generating Study Notes with AI..." : "Generate Notes"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-gray-400">Loading AI Study Notes...</div>}>
      <NotesContent />
    </Suspense>
  );
}
