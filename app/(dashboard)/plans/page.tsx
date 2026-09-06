"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Upload,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Sparkles,
  Download,
  LayoutGrid,
  Table as TableIcon,
  BookOpen,
  CalendarDays,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/dialog";
import { TaskModal } from "@/components/plans/TaskModal";
import { StudyPlanModal } from "@/components/plans/StudyPlanModal";
import { DeletePlanModal } from "@/components/plans/DeletePlanModal";
import { AiStudyPlanModal } from "@/components/plans/AiStudyPlanModal";
import { AiPlanCleanupModal } from "@/components/plans/AiPlanCleanupModal";

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"daywise" | "table">("daywise");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Study Plan modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<any>(null);
  const [isDeletePlanModalOpen, setIsDeletePlanModalOpen] = useState(false);
  const [selectedPlanForDelete, setSelectedPlanForDelete] = useState<any>(null);
  
  // AI Plan modals state
  const [isAiPlanModalOpen, setIsAiPlanModalOpen] = useState(false);
  const [isAiCleanupModalOpen, setIsAiCleanupModalOpen] = useState(false);
  const [selectedPlanForAiCleanup, setSelectedPlanForAiCleanup] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [plansRes, tasksRes] = await Promise.all([
        fetch("/api/plans"),
        fetch("/api/tasks"),
      ]);
      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
      }
      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        setTasks(tData.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (task: any) => {
    const newStatus = task.status === "completed" ? "not_started" : "completed";
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (tasks.length === 0) return;
    const headers = ["Date", "Subject", "Topic", "Subtopic", "Duration", "Priority", "Status", "Platform"];
    const rows = tasks.map(t => [
      t.scheduledDate,
      `"${t.subject}"`,
      `"${t.topic}"`,
      `"${t.subtopic || ""}"`,
      t.durationMinutes,
      t.priority,
      t.status,
      `"${t.practicePlatform || ""}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `study_plan_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (selectedPlanId !== "all" && t.planId !== selectedPlanId) return false;
    if (selectedStatus !== "all" && t.status !== selectedStatus) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.topic.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.subtopic && t.subtopic.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Group filtered tasks day-wise
  const dayGroupsMap = new Map<string, any[]>();
  const sortedTasks = [...filteredTasks].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  
  sortedTasks.forEach((t) => {
    const d = t.scheduledDate;
    if (!dayGroupsMap.has(d)) {
      dayGroupsMap.set(d, []);
    }
    dayGroupsMap.get(d)!.push(t);
  });

  const dayGroups = Array.from(dayGroupsMap.entries()).map(([date, dayTasks], idx) => {
    const completedCount = dayTasks.filter(t => t.status === "completed").length;
    const totalMinutes = dayTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
    return {
      dayIndex: idx + 1,
      date,
      dayLabel: `Day ${idx + 1}`,
      tasks: dayTasks,
      totalMinutes,
      completedCount,
      isAllDone: completedCount === dayTasks.length,
    };
  });

  const statusTabs = [
    { id: "all", label: "All Tasks", badge: tasks.length },
    { id: "not_started", label: "Pending", badge: tasks.filter(t => t.status === "not_started").length },
    { id: "in_progress", label: "In Progress", badge: tasks.filter(t => t.status === "in_progress").length },
    { id: "completed", label: "Completed", badge: tasks.filter(t => t.status === "completed").length },
  ];

  const totalCompleted = tasks.filter(t => t.status === "completed").length;
  const overallRate = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Layers className="h-6 w-6 text-blue-600" />
            <span>Study Plans & Day-Wise Breakdown</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Break down study schedules into daily milestones, track progress, and generate AI notes.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <Button
            size="sm"
            onClick={() => setIsAiPlanModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            <span>AI Plan Generator</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSelectedPlanForEdit(null); setIsPlanModalOpen(true); }}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span>New Plan</span>
          </Button>
          <Link href="/plans/import">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              <span>Import Plan (Excel/CSV)</span>
            </Button>
          </Link>
          <Button size="sm" onClick={() => { setSelectedTask(null); setIsTaskModalOpen(true); }} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span>Add Task</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Active Plans Overview Banner */}
      {plans.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Your Study Roadmaps & Plans ({plans.length})
            </h2>
            {selectedPlanId !== "all" && (
              <button
                onClick={() => setSelectedPlanId("all")}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Clear Plan Filter (Show All)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const planTasks = tasks.filter(t => t.planId === plan.id);
              const planCompleted = planTasks.filter(t => t.status === "completed").length;
              const planRate = planTasks.length > 0 ? Math.round((planCompleted / planTasks.length) * 100) : 0;
              const isSelected = selectedPlanId === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={`p-4 transition-all hover:border-blue-400 relative group ${
                    isSelected ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="cursor-pointer flex-1" onClick={() => setSelectedPlanId(isSelected ? "all" : plan.id)}>
                      <Badge variant="purple" className="text-[10px] mb-1">{plan.subject || "Multi-Subject"}</Badge>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{plan.title}</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {plan.startDate ? `${plan.startDate} → ${plan.targetDate || plan.endDate || "Ongoing"}` : "Active Plan"}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlanForAiCleanup(plan);
                          setIsAiCleanupModalOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                        title="AI Cleanup & Deletion Options"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlanForEdit(plan);
                          setIsPlanModalOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                        title="Edit Plan"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlanForDelete(plan);
                          setIsDeletePlanModalOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                        title="Delete Plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 cursor-pointer" onClick={() => setSelectedPlanId(isSelected ? "all" : plan.id)}>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>{planCompleted} / {planTasks.length || 0} tasks done</span>
                      <span className="font-semibold text-blue-600">{planRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${planRate}%` }} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter, Tabs & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        <Tabs tabs={statusTabs} activeTab={selectedStatus} onChange={setSelectedStatus} />
        
        <div className="flex items-center space-x-2">
          {/* View Mode Switcher */}
          <div className="flex items-center space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setViewMode("daywise")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-colors ${
                viewMode === "daywise"
                  ? "bg-white dark:bg-gray-900 text-blue-600 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Day-Wise ({dayGroups.length} Days)</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-colors ${
                viewMode === "table"
                  ? "bg-white dark:bg-gray-900 text-blue-600 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table List</span>
            </button>
          </div>

          <div className="w-48 sm:w-56">
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search topic/subject..."
              className="text-xs h-9"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: DAY-WISE BREAKDOWN VIEW */}
      {viewMode === "daywise" && (
        <div className="space-y-4">
          {dayGroups.length === 0 ? (
            <Card className="p-12 text-center text-gray-400 space-y-3">
              <CalendarDays className="h-10 w-10 mx-auto text-gray-300" />
              <p className="text-sm font-medium">No study tasks found matching the filter.</p>
              <Link href="/plans/import">
                <Button variant="outline" size="sm" className="text-xs">
                  <Upload className="h-3.5 w-3.5 mr-1" /> Import Excel Plan
                </Button>
              </Link>
            </Card>
          ) : (
            dayGroups.map((group) => {
              const hours = Math.round((group.totalMinutes / 60) * 10) / 10;
              return (
                <Card key={group.date} className="overflow-hidden">
                  <div className="p-3.5 bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="h-6 px-2.5 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center shadow-xs">
                        {group.dayLabel}
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                        {group.date}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        <BookOpen className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        {group.completedCount}/{group.tasks.length} done
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        {hours} hrs ({group.totalMinutes}m)
                      </span>
                      {group.isAllDone && (
                        <Badge variant="success" className="text-[10px]">
                          Day Completed ✓
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-800 p-2">
                    {group.tasks.map((task) => {
                      const isDone = task.status === "completed";
                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors ${
                            isDone ? "bg-gray-50/30 dark:bg-gray-900/20" : ""
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <button
                              onClick={() => handleToggleStatus(task)}
                              className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                                isDone ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-300 hover:border-blue-500"
                              }`}
                            >
                              {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </button>

                            <div>
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <Badge variant="purple" className="text-[10px]">{task.subject}</Badge>
                                <Badge
                                  variant={task.priority === "urgent" ? "destructive" : task.priority === "high" ? "warning" : "default"}
                                  className="text-[10px]"
                                >
                                  {task.priority}
                                </Badge>
                                <span className="text-[11px] text-gray-400 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {task.durationMinutes}m {task.startTime ? `(${task.startTime})` : ""}
                                </span>
                              </div>
                              <h4 className={`font-semibold text-xs sm:text-sm mt-1 text-gray-900 dark:text-gray-100 ${isDone ? "line-through text-gray-400" : ""}`}>
                                {task.topic}
                              </h4>
                              {task.subtopic && <p className="text-[11px] text-gray-500 mt-0.5">{task.subtopic}</p>}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 self-end sm:self-center">
                            <Link href={`/notes?topic=${encodeURIComponent(task.topic)}&subject=${encodeURIComponent(task.subject)}${task.subtopic ? `&subtopic=${encodeURIComponent(task.subtopic)}` : ""}&taskId=${task.id}&action=generate`}>
                              <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40" title="Generate AI Notes">
                                <Sparkles className="h-3.5 w-3.5 mr-1" />
                                <span>Notes</span>
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedTask(task); setIsTaskModalOpen(true); }}
                              className="h-7 px-2 text-xs"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-semibold">
                  <tr>
                    <th className="p-4 w-10">Done</th>
                    <th className="p-4">Study Date</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Topic & Key Concept</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-gray-400">
                        No study tasks found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((t) => {
                      const isDone = t.status === "completed";
                      return (
                        <tr key={t.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${isDone ? "bg-gray-50/30 dark:bg-gray-900/20" : ""}`}>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleStatus(t)}
                              className={`h-5 w-5 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                                isDone ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-300 hover:border-blue-500"
                              }`}
                            >
                              {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                          <td className="p-4 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {t.scheduledDate} {t.startTime ? `(${t.startTime})` : ""}
                          </td>
                          <td className="p-4">
                            <Badge variant="purple">{t.subject}</Badge>
                          </td>
                          <td className="p-4">
                            <p className={`font-semibold text-gray-900 dark:text-gray-100 ${isDone ? "line-through text-gray-400" : ""}`}>
                              {t.topic}
                            </p>
                            {t.subtopic && <p className="text-[11px] text-gray-500">{t.subtopic}</p>}
                          </td>
                          <td className="p-4 whitespace-nowrap">{t.durationMinutes} mins</td>
                          <td className="p-4">
                            <Badge variant={t.priority === "urgent" ? "destructive" : t.priority === "high" ? "warning" : "default"}>
                              {t.priority}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant={isDone ? "success" : t.status === "in_progress" ? "warning" : "secondary"} className="capitalize">
                              {t.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap space-x-1">
                            <Link href={`/notes?topic=${encodeURIComponent(t.topic)}&subject=${encodeURIComponent(t.subject)}${t.subtopic ? `&subtopic=${encodeURIComponent(t.subtopic)}` : ""}&taskId=${t.id}&action=generate`}>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40" title="Generate AI Notes">
                                <Sparkles className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedTask(t); setIsTaskModalOpen(true); }}
                              className="h-7 px-2 text-xs"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(t.id)}
                              className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        onSaved={fetchData}
      />

      <StudyPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        plan={selectedPlanForEdit}
        onSaved={fetchData}
      />

      <DeletePlanModal
        isOpen={isDeletePlanModalOpen}
        onClose={() => setIsDeletePlanModalOpen(false)}
        plan={selectedPlanForDelete}
        tasksCount={tasks.filter(t => t.planId === selectedPlanForDelete?.id).length}
        onDeleted={() => {
          if (selectedPlanId === selectedPlanForDelete?.id) {
            setSelectedPlanId("all");
          }
          fetchData();
        }}
      />

      <AiStudyPlanModal
        isOpen={isAiPlanModalOpen}
        onClose={() => setIsAiPlanModalOpen(false)}
        onPlanCreated={fetchData}
      />

      <AiPlanCleanupModal
        isOpen={isAiCleanupModalOpen}
        onClose={() => setIsAiCleanupModalOpen(false)}
        plan={selectedPlanForAiCleanup}
        tasks={tasks}
        onActionComplete={fetchData}
      />
    </div>
  );
}
