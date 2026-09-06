"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react";

export function DeletePlanModal({
  isOpen,
  onClose,
  plan,
  tasksCount = 0,
  onDeleted,
}: {
  isOpen: boolean;
  onClose: () => void;
  plan: any;
  tasksCount?: number;
  onDeleted: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plan) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete study plan");
      }

      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Study Plan"
      description="Are you sure you want to delete this study plan?"
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <div className="p-4 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-red-900 dark:text-red-200">
              Warning: This action cannot be undone
            </p>
            <p className="text-red-700 dark:text-red-300 leading-relaxed">
              Deleting <strong>"{plan.title}"</strong> will permanently remove this study plan
              {tasksCount > 0 ? ` and all ${tasksCount} associated study tasks and sessions.` : "."}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
          <p className="text-gray-500 font-medium">Plan Details:</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{plan.title}</p>
          {plan.subject && <p className="text-gray-500">Subject: {plan.subject}</p>}
          {plan.startDate && (
            <p className="text-gray-500">
              Timeline: {plan.startDate} {plan.targetDate || plan.endDate ? `→ ${plan.targetDate || plan.endDate}` : ""}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                <span>Deleting Plan...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                <span>Delete Plan</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
