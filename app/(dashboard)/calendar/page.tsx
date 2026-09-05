"use client";

import React, { useState, useEffect } from "react";
import { CalendarDays, Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudyCalendar } from "@/components/calendar/StudyCalendar";
import { TaskModal } from "@/components/plans/TaskModal";

export default function CalendarPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = (dateStr: string) => {
    setSelectedTask({ scheduledDate: dateStr });
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleGenerateNotes = (task: any) => {
    window.location.href = `/notes?topic=${encodeURIComponent(task.topic)}&subject=${encodeURIComponent(task.subject)}&taskId=${task.id}&action=generate`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <CalendarDays className="h-6 w-6 text-blue-600" />
            <span>Study Calendar</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Visualize your scheduled study sessions, track task statuses, and click any date to add or edit tasks.
          </p>
        </div>

        <Button size="sm" onClick={() => { setSelectedTask(null); setIsTaskModalOpen(true); }} className="text-xs">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          <span>New Study Session</span>
        </Button>
      </div>

      {/* Interactive Calendar Component */}
      <StudyCalendar
        tasks={tasks}
        onTaskClick={handleEditTask}
        onAddTask={handleAddTask}
        onGenerateNotes={handleGenerateNotes}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        onSaved={fetchTasks}
      />
    </div>
  );
}
