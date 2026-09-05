"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExcelImportWizard } from "@/components/plans/ExcelImportWizard";

export default function ImportPlanPage() {
  const handleDownloadSample = () => {
    const csvContent = `Date,Subject,Topic,Subtopic,Duration,Priority,Platform,Status
2026-09-06,Computer Science,Graph Algorithms,Dijkstra & Bellman-Ford,90,high,LeetCode,not_started
2026-09-07,Mathematics,Probability Distributions,Poisson & Gaussian Normal,60,medium,YouTube,not_started
2026-09-08,System Design,Database Sharding,Consistent Hashing & Partitions,60,urgent,GeeksforGeeks,not_started
2026-09-09,Operating Systems,Virtual Memory,Page Replacement & TLB,60,medium,Textbook,not_started
2026-09-10,Web Architecture,REST vs GraphQL,Payload efficiency & schema,45,low,Article,not_started`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample_study_plan.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/plans">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <span>Import Excel / CSV Study Plan</span>
            </h1>
            <p className="text-xs text-gray-500">
              Upload spreadsheets, auto-map headers, preview validation, and insert tasks.
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleDownloadSample} className="text-xs">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          <span>Download Sample CSV</span>
        </Button>
      </div>

      {/* Importer Component */}
      <ExcelImportWizard />
    </div>
  );
}
