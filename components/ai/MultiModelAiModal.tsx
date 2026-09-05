"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Bot,
  Send,
  Copy,
  Check,
  Bookmark,
  Key,
  RefreshCw,
  X,
  BookOpen,
  Code2,
  GraduationCap,
  Zap,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Maximize2,
  Minimize2,
  Brain,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AVAILABLE_MODELS, AIProvider } from "@/lib/ai/client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinkingProcess?: string;
  thinkingTimeSeconds?: number;
  provider?: string;
  modelUsed?: string;
  timestamp: Date;
  sourcesUsed?: Array<{ title: string; type: string }>;
  savedAsNote?: boolean;
}

const PRESET_MODES = [
  { id: "chat", label: "General Assistant", icon: Bot, promptPrefix: "" },
  { id: "exam_prep", label: "2/5/10-Mark Exam Notes", icon: GraduationCap, promptPrefix: "Generate university exam answers (2-mark definition, 5-mark explanation, 10-mark essay) for: " },
  { id: "code_solution", label: "LeetCode & Code Solvers", icon: Code2, promptPrefix: "Provide optimal solution, time/space complexity analysis, and edge cases for: " },
  { id: "explainer", label: "Simple Concept Explainer", icon: Zap, promptPrefix: "Explain with simple analogies, diagrams, and memory aids: " },
  { id: "summarizer", label: "Textbook Summarizer", icon: FileText, promptPrefix: "Summarize key takeaways, formulas, and high-yield exam facts for: " },
  { id: "flashcards", label: "Flashcards & MCQs", icon: BookOpen, promptPrefix: "Create 5 high-yield flashcards and 3 multiple-choice practice questions for: " },
];

function ThinkingProcessBlock({
  thinkingProcess,
  thinkingTimeSeconds,
  modelName,
}: {
  thinkingProcess: string;
  thinkingTimeSeconds?: number;
  modelName?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!thinkingProcess) return null;

  return (
    <div className="mb-3 rounded-xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/25 overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-left text-[11px] font-medium text-purple-900 dark:text-purple-200 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-1.5">
          <Brain className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 animate-pulse shrink-0" />
          <span className="font-semibold">
            Thought Process {thinkingTimeSeconds ? `(Thought for ${thinkingTimeSeconds.toFixed(1)}s)` : ""}
          </span>
          <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300">
            {modelName || "Reasoning"}
          </Badge>
        </div>
        <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400 text-[10px]">
          <span>{isExpanded ? "Hide" : "Show reasoning"}</span>
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3.5 py-2.5 border-t border-purple-200/60 dark:border-purple-900/40 text-[11px] text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-900/70 font-mono leading-relaxed whitespace-pre-wrap animate-in fade-in duration-150">
          {thinkingProcess}
        </div>
      )}
    </div>
  );
}

export function MultiModelAiModal({
  isOpen,
  onClose,
  initialTopic = "",
  initialSubject = "Computer Science",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  initialSubject?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `# Welcome to Multi-Model AI Study Assistant! 🚀\n\nI can generate notes, explain complex concepts, solve algorithmic problems, and build exam sheets using **Google Gemini**, **OpenAI GPT-4o**, **Anthropic Claude**, **DeepSeek**, or **Groq Llama 3.3**.\n\n### Choose an AI Model & Quick Preset below to get started:`,
      timestamp: new Date(),
      modelUsed: "Multi-Model Hub",
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState(initialTopic);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("gemini");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-1.5-flash");
  const [selectedMode, setSelectedMode] = useState<string>("chat");
  const [includeSources, setIncludeSources] = useState(true);
  const [subject, setSubject] = useState(initialSubject);

  const [apiKey, setApiKey] = useState("");
  const [showApiKeyDrawer, setShowApiKeyDrawer] = useState(false);
  const [isKeyTesting, setIsKeyTesting] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load API key for selected provider from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem(`ai_study_planner_${selectedProvider}_key`) || "";
      setApiKey(storedKey);
      setKeyTestStatus(null);
    }
  }, [selectedProvider]);

  // Set default model when provider changes
  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
    const models = AVAILABLE_MODELS[provider] || [];
    if (models.length > 0) {
      setSelectedModel(models[0].id);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleTestKey = async () => {
    if (!apiKey.trim()) return;
    setIsKeyTesting(true);
    setKeyTestStatus(null);
    try {
      const res = await fetch("/api/ai/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      setKeyTestStatus({ success: data.success, message: data.message || data.error });
      if (data.success && typeof window !== "undefined") {
        localStorage.setItem(`ai_study_planner_${selectedProvider}_key`, apiKey.trim());
      }
    } catch (err: any) {
      setKeyTestStatus({ success: false, message: err.message });
    } finally {
      setIsKeyTesting(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = (customText || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          provider: selectedProvider,
          modelName: selectedModel,
          apiKey: apiKey.trim() || undefined,
          includeSources,
          mode: selectedMode,
          subject,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate response");
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        thinkingProcess: data.thinkingProcess,
        thinkingTimeSeconds: data.thinkingTimeSeconds,
        provider: data.provider,
        modelUsed: data.modelUsed,
        sourcesUsed: data.sourcesUsed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `⚠️ **Generation Error**: ${err.message}\n\nPlease verify your API key or select the **Offline Academic Engine** to generate instant notes.`,
          timestamp: new Date(),
          modelUsed: "Error Handler",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveAsStudyNote = async (message: ChatMessage) => {
    setSavingNoteId(message.id);
    try {
      const firstLineMatch = message.content.match(/^#+\s*(.+)/m);
      const noteTopic = firstLineMatch ? firstLineMatch[1].replace(/[*_#]/g, "").trim() : inputPrompt || "AI Study Guide";

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: noteTopic,
          subject,
          difficulty: "intermediate",
          length: "medium",
          purpose: selectedMode === "exam_prep" ? "exam" : selectedMode === "code_solution" ? "coding" : "exam",
          noteType: selectedMode === "exam_prep" ? "exam_5mark" : selectedMode === "code_solution" ? "coding_practice" : "standard",
          content: message.content,
          sourcesUsed: message.sourcesUsed || [],
          aiProvider: message.provider || selectedProvider,
          modelUsed: message.modelUsed || selectedModel,
        }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, savedAsNote: true } : m))
        );
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSavingNoteId(null);
    }
  };

  if (!isOpen) return null;

  const currentModels = AVAILABLE_MODELS[selectedProvider] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 w-full overflow-hidden ${
          isExpanded ? "h-[96vh] max-w-6xl" : "h-[85vh] max-w-4xl"
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  AI Multi-Model Hub
                </h2>
                <Badge variant="purple" className="text-[10px] py-0 px-1.5">
                  {AVAILABLE_MODELS[selectedProvider]?.find((m) => m.id === selectedModel)?.name || selectedModel}
                </Badge>
              </div>
              <p className="text-[11px] text-gray-500">
                Switch models dynamically: Gemini, GPT-4o, Claude 3.5, DeepSeek, Groq &amp; Offline Engine.
              </p>
            </div>
          </div>

          {/* Model Selection Controls & Top Actions */}
          <div className="flex items-center space-x-2">
            {/* Provider Selector */}
            <select
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              className="h-8 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="deepseek">DeepSeek</option>
              <option value="groq">Groq (Llama 3.3)</option>
              <option value="offline">Offline Engine (Free)</option>
            </select>

            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="h-8 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 max-w-[150px] truncate"
            >
              {currentModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Key Drawer Toggle Button */}
            <button
              onClick={() => setShowApiKeyDrawer(!showApiKeyDrawer)}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                apiKey
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800"
                  : "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:border-gray-700"
              }`}
              title="Configure API Key for this Provider"
            >
              <Key className="h-4 w-4" />
            </button>

            {/* Expand / Minimize */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden sm:block cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* API Key Drawer */}
        {showApiKeyDrawer && (
          <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-900/50 space-y-2 shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-purple-950 dark:text-purple-200 flex items-center">
                <Key className="h-3.5 w-3.5 mr-1 text-purple-600" />
                Configure API Key for {selectedProvider.toUpperCase()}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestKey}
                  disabled={isKeyTesting || !apiKey}
                  className="h-7 text-[11px] px-3"
                >
                  {isKeyTesting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : "Test Connection"}
                </Button>
                <button
                  onClick={() => setShowApiKeyDrawer(false)}
                  className="text-xs text-purple-700 hover:underline"
                >
                  Done
                </button>
              </div>
            </div>

            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter ${selectedProvider} API key (e.g. AIzaSy... or sk-proj-...)`}
              className="h-8 text-xs bg-white dark:bg-gray-900 font-mono"
            />

            {keyTestStatus && (
              <div
                className={`text-[11px] p-2 rounded-lg flex items-center space-x-1.5 ${
                  keyTestStatus.success
                    ? "bg-emerald-100/70 text-emerald-800 border border-emerald-300"
                    : "bg-red-100/70 text-red-800 border border-red-300"
                }`}
              >
                {keyTestStatus.success ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />}
                <span>{keyTestStatus.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Preset Modes Row */}
        <div className="px-4 py-2 bg-gray-100/60 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 flex items-center space-x-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {PRESET_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id);
                  if (mode.promptPrefix && !inputPrompt.startsWith(mode.promptPrefix)) {
                    setInputPrompt(mode.promptPrefix + (inputPrompt || initialTopic));
                  }
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-xs font-semibold"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
              >
                <div className="flex items-center space-x-2 text-[10px] text-gray-400 px-1">
                  <span className="font-semibold">{isUser ? "You" : m.modelUsed || "AI Assistant"}</span>
                  <span>&bull;</span>
                  <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                <div
                  className={`p-4 rounded-2xl max-w-[90%] leading-relaxed ${
                    isUser
                      ? "bg-blue-600 text-white rounded-tr-xs shadow-md"
                      : "bg-gray-100/90 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 rounded-tl-xs border border-gray-200 dark:border-gray-700/60 shadow-xs"
                  }`}
                >
                  {/* Thinking / Reasoning Breakdown */}
                  {!isUser && m.thinkingProcess && (
                    <ThinkingProcessBlock
                      thinkingProcess={m.thinkingProcess}
                      thinkingTimeSeconds={m.thinkingTimeSeconds}
                      modelName={m.modelUsed}
                    />
                  )}

                  <div className="prose dark:prose-invert prose-xs max-w-none whitespace-pre-wrap font-sans space-y-2">
                    {m.content}
                  </div>

                  {/* Sources Used Badge */}
                  {m.sourcesUsed && m.sourcesUsed.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-gray-700/60 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Sources Synthesized:</span>
                      {m.sourcesUsed.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-medium"
                        >
                          {s.title} ({s.type})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions for Assistant replies */}
                  {!isUser && m.id !== "welcome" && (
                    <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-gray-700/50 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopyText(m.id, m.content)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-white dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 text-[11px] text-gray-700 dark:text-gray-300 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                          title="Copy Markdown"
                        >
                          {copiedId === m.id ? (
                            <><Check className="h-3 w-3 text-emerald-600" /><span className="text-emerald-600 font-semibold">Copied!</span></>
                          ) : (
                            <><Copy className="h-3 w-3" /><span>Copy</span></>
                          )}
                        </button>

                        <button
                          onClick={() => handleSaveAsStudyNote(m)}
                          disabled={savingNoteId === m.id || m.savedAsNote}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                            m.savedAsNote
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800"
                              : "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                          }`}
                        >
                          {m.savedAsNote ? (
                            <><Check className="h-3 w-3 text-emerald-600" /><span>Saved as Note ✓</span></>
                          ) : savingNoteId === m.id ? (
                            <><Loader2 className="h-3 w-3 animate-spin" /><span>Saving...</span></>
                          ) : (
                            <><Bookmark className="h-3 w-3" /><span>Save as Note</span></>
                          )}
                        </button>
                      </div>

                      <span className="text-[10px] text-gray-400 font-mono">
                        {m.modelUsed}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 max-w-sm border border-purple-200 dark:border-purple-900/50 animate-pulse">
              <Brain className="h-4 w-4 text-purple-600 animate-spin" />
              <div className="flex flex-col">
                <span className="text-xs text-purple-900 dark:text-purple-200 font-semibold">
                  Deep Thinking &amp; Reasoning...
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400">
                  {AVAILABLE_MODELS[selectedProvider]?.find((m) => m.id === selectedModel)?.name || selectedModel}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form & Footer Controls */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 space-y-2">
          {/* Quick RAG & Context Toggles */}
          <div className="flex items-center justify-between text-[11px] px-1 text-gray-500">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSources}
                onChange={(e) => setIncludeSources(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-purple-600 focus:ring-purple-500"
              />
              <span>Attach Student Library &amp; Uploaded Sources (RAG)</span>
            </label>

            <span className="hidden sm:inline text-gray-400">
              Press <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border text-[10px]">Enter</kbd> to send &bull; <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border text-[10px]">Shift+Enter</kbd> for new line
            </span>
          </div>

          <form onSubmit={(e) => handleSendMessage(e)} className="flex items-end space-x-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask any question, generate 10-mark notes, solve algorithms, or analyze study matter..."
              className="flex-1 p-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-900 resize-none outline-none transition-all"
            />

            <Button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="h-12 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shrink-0 font-semibold shadow-md shadow-purple-500/20"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
