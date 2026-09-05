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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/dialog";
import { TaskModal } from "@/components/plans/TaskModal";

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
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

  const filteredTasks = tasks.filter(t => {
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

  const statusTabs = [
    { id: "all", label: "All Tasks", badge: tasks.length },
    { id: "not_started", label: "Pending", badge: tasks.filter(t => t.status === "not_started").length },
    { id: "in_progress", label: "In Progress", badge: tasks.filter(t => t.status === "in_progress").length },
    { id: "completed", label: "Completed", badge: tasks.filter(t => t.status === "completed").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Layers className="h-6 w-6 text-blue-600" />
            <span>Study Plans & Task Management</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Organize, import spreadsheets, reschedule, and track your study milestones.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>
          <Link href="/plans/import">
            <Button variant="outline" size="sm" className="text-xs">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              <span>Import Excel</span>
            </Button>
          </Link>
          <Button size="sm" onClick={() => { setSelectedTask(null); setIsTaskModalOpen(true); }} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Filter and Tabs Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        <Tabs tabs={statusTabs} activeTab={selectedStatus} onChange={setSelectedStatus} />
        <div className="w-full sm:w-64">
          <Input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter subject or topic..."
            className="text-xs h-9"
          />
        </div>
      </div>

      {/* Tasks Table / Cards */}
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
                          <Link href={`/notes?topic=${encodeURIComponent(t.topic)}&subject=${encodeURIComponent(t.subject)}&taskId=${t.id}&action=generate`}>
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

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        onSaved={fetchData}
      />
    </div>
  );
}
