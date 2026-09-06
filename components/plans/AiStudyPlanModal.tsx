"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Calendar,
  Layers,
  Clock,
  BookOpen,
  Check,
  RefreshCw,
  ArrowRight,
  Zap,
  Code2,
  Brain,
  GraduationCap,
} from "lucide-react";
import { AIProvider, AVAILABLE_MODELS } from "@/lib/ai/client";

export function AiStudyPlanModal({
  isOpen,
  onClose,
  onPlanCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: () => void;
}) {
  const [subject, setSubject] = useState("Java & Data Structures");
  const [goal, setGoal] = useState("Master core programming, OOP, Collections, and essential interview patterns");
  const [daysCount, setDaysCount] = useState(14);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [aiProvider, setAiProvider] = useState<AIProvider>("offline");
  const [apiKey, setApiKey] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);

  const presets = [
    {
      title: "☕ 30-Day Java & Spring Boot",
      subject: "Java & Spring Boot",
      goal: "Complete OOP, Collections, Lambdas, Streams, Multithreading, Spring Boot REST APIs and JPA",
      days: 30,
      hours: 2,
      difficulty: "intermediate" as const,
    },
    {
      title: "🚀 30-Day DSA & LeetCode Sprint",
      subject: "Data Structures & Algorithms",
      goal: "Master Two Pointers, Sliding Window, Trees, Graphs, Dynamic Programming & LeetCode patterns",
      days: 30,
      hours: 2.5,
      difficulty: "advanced" as const,
    },
    {
      title: "🐍 14-Day Python & Machine Learning",
      subject: "Python & Machine Learning",
      goal: "NumPy, Pandas, Scikit-Learn Supervised/Unsupervised models, Neural Networks and PyTorch",
      days: 14,
      hours: 2,
      difficulty: "intermediate" as const,
    },
    {
      title: "📖 7-Day University Exam Cram",
      subject: "Operating Systems & Computer Networks",
      goal: "Rapid revision of core syllabus, 2-mark definitions, 5-mark architecture diagrams & past exam questions",
      days: 7,
      hours: 3,
      difficulty: "intermediate" as const,
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setSubject(p.subject);
    setGoal(p.goal);
    setDaysCount(p.days);
    setHoursPerDay(p.hours);
    setDifficulty(p.difficulty);
    setGeneratedResult(null);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/plans/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          goal,
          daysCount: Number(daysCount),
          hoursPerDay: Number(hoursPerDay),
          difficulty,
          startDate,
          aiProvider,
          apiKey: apiKey || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate AI study plan");
      }

      const data = await res.json();
      setGeneratedResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDashboard = async () => {
    if (!generatedResult || !generatedResult.tasks || generatedResult.tasks.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      // 1. Create Study Plan
      const planRes = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedResult.plan),
      });

      if (!planRes.ok) {
        const errData = await planRes.json();
        throw new Error(errData.error || "Failed to create study plan container");
      }

      const planData = await planRes.json();
      const planId = planData.plan?.id || null;

      // 2. Insert Tasks linked to this plan
      const tasksRes = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          tasks: generatedResult.tasks,
        }),
      });

      if (!tasksRes.ok) {
        const errData = await tasksRes.json();
        throw new Error(errData.error || "Failed to insert day-wise tasks");
      }

      onPlanCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save plan to database");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="AI Study Plan Generator"
      description="Tell the AI what you want to learn, and get an organized day-by-day curriculum instantly."
    >
      <div className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl">
            {error}
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1.5 flex items-center space-x-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Popular Roadmap Presets:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 hover:border-blue-300 text-left transition-all group"
              >
                <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                  {p.title}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">{p.days} Days &bull; {p.hours}h/day &bull; {p.difficulty}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Plan Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Subject / Domain *</label>
            <Input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Java, Python, Operating Systems"
            />
          </div>

          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Start Date (Day 1) *</label>
            <Input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Specific Learning Goal / Target</label>
          <Textarea
            rows={2}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Master tree traversals, dynamic programming, and solve 50 LeetCode mediums for placement"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Duration (Days)</label>
            <select
              value={daysCount}
              onChange={(e) => setDaysCount(Number(e.target.value))}
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>7 Days (1 Week)</option>
              <option value={14}>14 Days (2 Weeks)</option>
              <option value={21}>21 Days (3 Weeks)</option>
              <option value={30}>30 Days (1 Month)</option>
              <option value={45}>45 Days (1.5 Months)</option>
              <option value={60}>60 Days (2 Months)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Daily Study Time</label>
            <select
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 Hour / Day</option>
              <option value={1.5}>1.5 Hours / Day</option>
              <option value={2}>2 Hours / Day</option>
              <option value={3}>3 Hours / Day</option>
              <option value={4}>4 Hours / Day</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* AI Provider selector */}
        <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
              <Brain className="h-3.5 w-3.5 text-purple-600" />
              <span>AI Engine / Knowledge Base</span>
            </span>
            <Badge variant="secondary" className="text-[10px]">Zero Key Required</Badge>
          </div>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as any)}
            className="w-full h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="offline">Offline Academic Knowledge Engine (Instant & Free)</option>
            <option value="gemini">Google Gemini 1.5 Flash</option>
            <option value="openai">OpenAI GPT-4o Mini</option>
            <option value="anthropic">Anthropic Claude 3.5</option>
            <option value="deepseek">DeepSeek R1 Reasoner</option>
            <option value="groq">Groq Llama 3.3</option>
          </select>
          {aiProvider !== "offline" && (
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Optional: Enter ${aiProvider} API key (or uses default env)`}
              className="text-xs h-8"
            />
          )}
        </div>

        {/* Generate Button */}
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !subject.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-md"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              <span>Generating Day-by-Day Curriculum with AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              <span>Generate {daysCount}-Day Day-Wise Study Plan</span>
            </>
          )}
        </Button>

        {/* PREVIEW OF GENERATED PLAN */}
        {generatedResult && (
          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Badge variant="purple" className="text-[10px] mb-1">{generatedResult.plan.subject}</Badge>
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{generatedResult.plan.title}</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {generatedResult.plan.totalDays} Days &bull; {generatedResult.plan.totalHours} Total Hours &bull; {generatedResult.tasks.length} Sessions
                </p>
              </div>

              <Button
                type="button"
                onClick={handleSaveToDashboard}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0 shadow-md"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    <span>Adding to Dashboard...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    <span>Accept & Add to Dashboard</span>
                  </>
                )}
              </Button>
            </div>

            {/* Day Groups List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {generatedResult.dayGroups.map((day: any) => (
                <div
                  key={day.date}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="h-5 px-2 rounded-md bg-blue-600 text-white text-[10px] font-bold flex items-center">
                        {day.dayLabel}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">{day.date}</span>
                    </div>
                    <span className="text-[11px] text-gray-500">{day.totalDurationMinutes} mins</span>
                  </div>

                  {day.tasks.map((task: any, tIdx: number) => (
                    <div key={tIdx} className="pl-2 border-l-2 border-blue-400 dark:border-blue-600 py-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{task.topic}</span>
                        <Badge variant={task.priority === "urgent" ? "destructive" : task.priority === "high" ? "warning" : "secondary"} className="text-[10px]">
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-gray-500">{task.subtopic}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
