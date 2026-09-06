"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Layers,
  Archive,
  Scissors,
} from "lucide-react";

export function AiPlanCleanupModal({
  isOpen,
  onClose,
  plan,
  tasks = [],
  onActionComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  plan: any;
  tasks: any[];
  onActionComplete: () => void;
}) {
  const [cleanupMode, setCleanupMode] = useState<"full_delete" | "clean_completed" | "prune_past">("full_delete");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plan) return null;

  const planTasks = tasks.filter((t) => t.planId === plan.id);
  const completedTasks = planTasks.filter((t) => t.status === "completed");
  const todayStr = new Date().toISOString().split("T")[0];
  const pastPendingTasks = planTasks.filter((t) => t.status !== "completed" && t.scheduledDate < todayStr);

  const handleExecute = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (cleanupMode === "full_delete") {
        // Complete deletion of study plan and all its tasks
        const res = await fetch(`/api/plans/${plan.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to delete plan");
        }
      } else if (cleanupMode === "clean_completed") {
        // Delete only completed tasks
        for (const t of completedTasks) {
          await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
        }
      } else if (cleanupMode === "prune_past") {
        // Delete past overdue tasks
        for (const t of pastPendingTasks) {
          await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
        }
      }

      onActionComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during plan cleanup");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="AI Plan Deletion & Smart Cleanup"
      description="Choose how you would like to delete or prune tasks from this study plan."
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl">
            {error}
          </div>
        )}

        {/* Plan Summary Card */}
        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{plan.title}</span>
            <Badge variant="purple" className="text-[10px]">{plan.subject || "General"}</Badge>
          </div>
          <p className="text-gray-500 text-[11px]">
            {planTasks.length} Total Tasks &bull; {completedTasks.length} Completed &bull; {planTasks.length - completedTasks.length} Pending
          </p>
        </div>

        {/* Action Selection Options */}
        <div className="space-y-2">
          <label className="font-semibold text-gray-700 dark:text-gray-300 block">
            Select Deletion / Cleanup Action:
          </label>

          {/* Option 1: Full Delete */}
          <div
            onClick={() => setCleanupMode("full_delete")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              cleanupMode === "full_delete"
                ? "border-red-500 bg-red-50/30 dark:bg-red-950/20 ring-1 ring-red-500"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start space-x-2.5">
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  Permanent Full Deletion
                </p>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  Permanently deletes the entire study plan and all {planTasks.length} associated daily tasks from the dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Option 2: Clean Completed Tasks Only */}
          <div
            onClick={() => setCleanupMode("clean_completed")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              cleanupMode === "clean_completed"
                ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-blue-500"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  AI Smart Prune: Remove Completed Sessions ({completedTasks.length} tasks)
                </p>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  Keeps the plan and remaining targets, but cleans finished tasks to reduce dashboard clutter.
                </p>
              </div>
            </div>
          </div>

          {/* Option 3: Prune Past Missed Overdue Tasks */}
          {pastPendingTasks.length > 0 && (
            <div
              onClick={() => setCleanupMode("prune_past")}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                cleanupMode === "prune_past"
                  ? "border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 ring-1 ring-amber-500"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start space-x-2.5">
                <Scissors className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    Prune Missed Past Tasks ({pastPendingTasks.length} overdue)
                  </p>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    Removes outdated sessions from past dates that you skipped.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Warning if full delete */}
        {cleanupMode === "full_delete" && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-red-700 dark:text-red-300 text-[11px]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>This will delete all sessions and cannot be undone.</span>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={cleanupMode === "full_delete" ? "destructive" : "default"}
            size="sm"
            onClick={handleExecute}
            disabled={isProcessing}
            className={cleanupMode === "full_delete" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : cleanupMode === "full_delete" ? (
              <>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                <span>Confirm Full Delete</span>
              </>
            ) : cleanupMode === "clean_completed" ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                <span>Prune Completed Tasks</span>
              </>
            ) : (
              <>
                <Scissors className="h-3.5 w-3.5 mr-1.5" />
                <span>Prune Missed Tasks</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
