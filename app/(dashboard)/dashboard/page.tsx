"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
  Upload,
  Plus,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Code2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskModal } from "@/components/plans/TaskModal";
import { StudyPlanModal } from "@/components/plans/StudyPlanModal";

export default function DashboardPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    try {
      const [tasksRes, progressRes, plansRes] = await Promise.all([
        fetch(`/api/tasks`),
        fetch(`/api/progress`),
        fetch(`/api/plans`),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }

      if (progressRes.ok) {
        const pData = await progressRes.json();
        setSummary(pData.summary);
      }

      if (plansRes.ok) {
        const plData = await plansRes.json();
        setPlans(plData.plans || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleTaskStatus = async (task: any) => {
    const newStatus = task.status === "completed" ? "in_progress" : "completed";
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const todayTasks = tasks.filter(t => t.scheduledDate === todayStr);
  const upcomingTasks = tasks.filter(t => t.scheduledDate > todayStr).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Academic Hub Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Today's Study Plan</h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} &bull; Keep up your streak and master today's targets!
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPlanModalOpen(true)}
            className="h-9 text-xs font-semibold bg-white text-gray-900 hover:bg-gray-100 shadow-md"
          >
            <Layers className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
            <span>New Plan</span>
          </Button>
          <Link href="/plans/import">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold bg-white/10 hover:bg-white/20 border-white/20 text-white"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              <span>Import Excel</span>
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => { setSelectedTask(null); setIsTaskModalOpen(true); }}
            className="h-9 text-xs font-semibold bg-blue-900/40 hover:bg-blue-900/60 border border-white/20 text-white"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Learning Streak</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{summary?.streakDays || 1} Days</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Total Hours</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{summary?.totalStudyHours || 0} hrs</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Completed Tasks</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {summary?.completedTasks || 0} / {summary?.totalTasks || tasks.length}
            </h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Completion Rate</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{summary?.completionRate || 0}%</h3>
          </div>
        </Card>
      </div>

      {/* Main Study Agenda vs Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks Table / Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <span>Today's Sessions ({todayTasks.length})</span>
            </h2>
            <Link href="/calendar" className="text-xs text-blue-600 hover:underline font-semibold flex items-center">
              <span>View Full Calendar</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>

          {todayTasks.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <CalendarDays className="h-10 w-10 text-gray-300 mx-auto" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">No study tasks scheduled for today</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Import an Excel plan or click "Add Task" to schedule today's learning objectives.
              </p>
              <div className="flex justify-center space-x-2 pt-1">
                <Button size="sm" onClick={() => { setSelectedTask(null); setIsTaskModalOpen(true); }} className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
                </Button>
                <Link href="/plans/import">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Upload className="h-3.5 w-3.5 mr-1" /> Import Plan
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((t) => {
                const isDone = t.status === "completed";
                return (
                  <Card
                    key={t.id}
                    className={`p-4 transition-all hover:border-blue-400 ${isDone ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50" : ""}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => handleToggleTaskStatus(t)}
                          className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                            isDone ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-300 hover:border-blue-500"
                          }`}
                        >
                          {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <Badge variant="purple">{t.subject}</Badge>
                            <Badge variant={t.priority === "urgent" ? "destructive" : t.priority === "high" ? "warning" : "secondary"}>
                              {t.priority}
                            </Badge>
                            {t.startTime && (
                              <span className="text-[11px] text-gray-400 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {t.startTime} ({t.durationMinutes}m)
                              </span>
                            )}
                          </div>
                          <h3 className={`font-semibold text-sm mt-1 text-gray-900 dark:text-gray-100 ${isDone ? "line-through text-gray-400" : ""}`}>
                            {t.topic}
                          </h3>
                          {t.subtopic && <p className="text-xs text-gray-500 mt-0.5">{t.subtopic}</p>}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <Link href={`/notes?topic=${encodeURIComponent(t.topic)}&subject=${encodeURIComponent(t.subject)}&taskId=${t.id}&action=generate`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            <span>Notes</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedTask(t); setIsTaskModalOpen(true); }}
                          className="h-8 text-xs"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Quick Academic Toolkit */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>AI Academic Toolkit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Link
                href="/notes"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-gray-100 dark:border-gray-800 transition-colors group"
              >
                <div className="flex items-center space-x-2.5">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">AI Notes Generator</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/practice"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-gray-100 dark:border-gray-800 transition-colors group"
              >
                <div className="flex items-center space-x-2.5">
                  <Code2 className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Coding Practice & QA</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/sources"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-gray-100 dark:border-gray-800 transition-colors group"
              >
                <div className="flex items-center space-x-2.5">
                  <Upload className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Upload PDF & Web RAG</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Schedule Sneak Peek */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Upcoming Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingTasks.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">No upcoming tasks scheduled.</p>
              ) : (
                upcomingTasks.map(t => (
                  <div key={t.id} className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[160px]">{t.topic}</p>
                      <span className="text-[10px] text-gray-500">{t.scheduledDate} &bull; {t.subject}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{t.priority}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        onSaved={fetchData}
      />

      <StudyPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSaved={fetchData}
      />
    </div>
  );
}
