"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressCharts } from "@/components/progress/ProgressCharts";

export default function ProgressPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      const res = await fetch("/api/progress");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleExportProgressCSV = () => {
    if (!data?.dailyLogs) return;
    const headers = ["Date", "CompletedTasks", "TotalMinutesStudied", "Streak"];
    const rows = data.dailyLogs.map((l: any) => [l.date, l.completedTasks, l.totalMinutesStudied, l.streak]);
    const csv = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `learning_progress_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            <span>Learning Progress & Analytics</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track daily study hours, completion streaks, and subject mastery velocity over time.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportProgressCSV} className="text-xs">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          <span>Export Analytics CSV</span>
        </Button>
      </div>

      <ProgressCharts
        summary={data?.summary}
        subjectStats={data?.subjectStats}
        dailyLogs={data?.dailyLogs || []}
      />
    </div>
  );
}
