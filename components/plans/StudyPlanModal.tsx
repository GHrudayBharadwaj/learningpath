"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function StudyPlanModal({
  isOpen,
  onClose,
  plan,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  plan?: any;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const defaultTarget = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    startDate: today,
    targetDate: defaultTarget,
    status: "active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setFormData({
        title: plan.title || "",
        subject: plan.subject || "",
        description: plan.description || "",
        startDate: plan.startDate || today,
        targetDate: plan.targetDate || plan.endDate || defaultTarget,
        status: plan.status || "active",
      });
    } else {
      setFormData({
        title: "",
        subject: "",
        description: "",
        startDate: today,
        targetDate: defaultTarget,
        status: "active",
      });
    }
    setError(null);
  }, [plan, isOpen, today, defaultTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = plan ? `/api/plans/${plan.id}` : "/api/plans";
      const method = plan ? "PATCH" : "POST";

      const payload = {
        title: formData.title.trim(),
        subject: formData.subject.trim() || undefined,
        description: formData.description.trim() || undefined,
        startDate: formData.startDate || undefined,
        targetDate: formData.targetDate || undefined,
        endDate: formData.targetDate || undefined,
        status: formData.status,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save study plan");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={plan ? "Edit Study Plan" : "Create New Study Plan"}
      description="Define a roadmap for your subject, timeline milestones, and learning objectives."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
            Plan Title *
          </label>
          <Input
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. 30-Day Java Full Stack Mastery, Operating Systems Midterm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Subject / Track
            </label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Computer Science, AI, Web Dev"
            />
          </div>
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Start Date (Day 1) *
            </label>
            <Input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Target / Exam Date
            </label>
            <Input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
            Description & Learning Goals
          </label>
          <Textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief notes on what you want to achieve with this study plan..."
          />
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSubmitting ? "Saving..." : plan ? "Update Plan" : "Create Plan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
