"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function TaskModal({
  isOpen,
  onClose,
  task,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  task?: any;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    topic: "",
    subtopic: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    priority: "medium",
    status: "not_started",
    practicePlatform: "",
    practiceUrl: "",
    notesSummary: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        subject: task.subject || "",
        topic: task.topic || "",
        subtopic: task.subtopic || "",
        scheduledDate: task.scheduledDate || new Date().toISOString().split("T")[0],
        startTime: task.startTime || "09:00",
        endTime: task.endTime || "10:00",
        durationMinutes: task.durationMinutes || 60,
        priority: task.priority || "medium",
        status: task.status || "not_started",
        practicePlatform: task.practicePlatform || "",
        practiceUrl: task.practiceUrl || "",
        notesSummary: task.notesSummary || "",
      });
    } else {
      setFormData({
        title: "",
        subject: "",
        topic: "",
        subtopic: "",
        scheduledDate: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "10:00",
        durationMinutes: 60,
        priority: "medium",
        status: "not_started",
        practicePlatform: "",
        practiceUrl: "",
        notesSummary: "",
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = task ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = task ? "PATCH" : "POST";

      const payload = {
        ...formData,
        title: formData.title || `${formData.subject}: ${formData.topic}`,
        durationMinutes: Number(formData.durationMinutes),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save study task");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={task ? "Edit Study Task" : "Create New Study Task"}
      description="Configure subject, topic, schedule time, and practice resources."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Subject *</label>
            <Input
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Data Structures, Physics"
            />
          </div>
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Topic *</label>
            <Input
              required
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g. Binary Search Trees"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Subtopic / Key Concept</label>
          <Input
            value={formData.subtopic}
            onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
            placeholder="e.g. AVL rotations, Tree balancing"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Date *</label>
            <Input
              type="date"
              required
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            />
          </div>
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Start Time</label>
            <Input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Duration (mins)</label>
            <Input
              type="number"
              min={10}
              max={720}
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Practice Platform</label>
            <Input
              value={formData.practicePlatform}
              onChange={(e) => setFormData({ ...formData, practicePlatform: e.target.value })}
              placeholder="e.g. LeetCode, HackerRank"
            />
          </div>
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Practice URL</label>
            <Input
              type="url"
              value={formData.practiceUrl}
              onChange={(e) => setFormData({ ...formData, practiceUrl: e.target.value })}
              placeholder="https://leetcode.com/..."
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Notes / Target Overview</label>
          <Textarea
            rows={2}
            value={formData.notesSummary}
            onChange={(e) => setFormData({ ...formData, notesSummary: e.target.value })}
            placeholder="Key reminders for this session..."
          />
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : task ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
