"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Layers,
  Clock,
  BookOpen,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TARGET_FIELDS, autoDetectMapping } from "@/lib/excel/mapping";
import { parseExcelBuffer, processMappedRows, ParseResult } from "@/lib/excel/parser";

export function ExcelImportWizard({ onImportComplete }: { onImportComplete?: (count: number) => void }) {
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [planTitle, setPlanTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [previewTab, setPreviewTab] = useState<"daywise" | "table">("daywise");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [createdPlanId, setCreatedPlanId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setImportError(null);

    // Extract default plan title from filename
    const cleanName = uploadedFile.name
      .replace(/\.(xlsx|xls|csv)$/i, "")
      .replace(/[_-]+/g, " ")
      .trim();
    if (!planTitle) {
      setPlanTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1) || "My Study Plan");
    }

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const { headers, rawData } = parseExcelBuffer(buffer);

      if (headers.length === 0) {
        throw new Error("Could not detect any column headers in this spreadsheet.");
      }

      setRawHeaders(headers);
      setRawRows(rawData);

      // Auto-detect mappings
      const detected = autoDetectMapping(headers);
      setColumnMapping(detected);
      setStep("map");
    } catch (err: any) {
      setImportError(err.message || "Failed to parse Excel file.");
    }
  };

  const handleMappingChange = (targetKey: string, excelCol: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [targetKey]: excelCol,
    }));
  };

  const handleProceedToPreview = () => {
    // Validate required fields
    const missingRequired = TARGET_FIELDS.filter(f => f.required && !columnMapping[f.key]);
    if (missingRequired.length > 0) {
      setImportError(`Please map required fields: ${missingRequired.map(m => m.label).join(", ")}`);
      return;
    }

    setImportError(null);
    const result = processMappedRows(rawHeaders, rawRows, columnMapping, {
      baseStartDate: startDate,
    });
    setParseResult(result);
    setStep("preview");
  };

  const handleExecuteImport = async () => {
    if (!parseResult || parseResult.validRowsCount === 0) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const validTasks = parseResult.rows
        .filter(r => r.isValid)
        .map(r => r.mapped);

      // 1. Create Study Plan container in database
      const dominantSubject = validTasks[0]?.subject || "General";
      const planEndDate = validTasks[validTasks.length - 1]?.scheduledDate || startDate;

      const planRes = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: planTitle || "Imported Study Plan",
          description: `Imported from ${file?.name || "spreadsheet"} with ${parseResult.totalDays} days of scheduled sessions.`,
          subject: dominantSubject,
          startDate: startDate,
          targetDate: planEndDate,
          endDate: planEndDate,
          status: "active",
        }),
      });

      let planId: string | null = null;
      if (planRes.ok) {
        const planData = await planRes.json();
        planId = planData.plan?.id || null;
        setCreatedPlanId(planId);
      }

      // 2. Insert all day-wise tasks attached to this plan
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: planId,
          tasks: validTasks,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Import failed on the server.");
      }

      const data = await res.json();
      setImportedCount(data.createdCount || validTasks.length);
      setStep("done");
      if (onImportComplete) onImportComplete(data.createdCount || validTasks.length);
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className={`flex items-center space-x-2 text-xs font-semibold ${step === "upload" ? "text-blue-600" : "text-gray-400"}`}>
          <span className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-950/60 text-blue-600">1</span>
          <span>Upload & Details</span>
        </div>
        <div className="h-px w-8 sm:w-16 bg-gray-200 dark:bg-gray-800" />
        <div className={`flex items-center space-x-2 text-xs font-semibold ${step === "map" ? "text-blue-600" : "text-gray-400"}`}>
          <span className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-950/60 text-blue-600">2</span>
          <span>Map Columns</span>
        </div>
        <div className="h-px w-8 sm:w-16 bg-gray-200 dark:bg-gray-800" />
        <div className={`flex items-center space-x-2 text-xs font-semibold ${step === "preview" ? "text-blue-600" : "text-gray-400"}`}>
          <span className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-950/60 text-blue-600">3</span>
          <span>Day-Wise Breakdown</span>
        </div>
        <div className="h-px w-8 sm:w-16 bg-gray-200 dark:bg-gray-800" />
        <div className={`flex items-center space-x-2 text-xs font-semibold ${step === "done" ? "text-emerald-600" : "text-gray-400"}`}>
          <span className="h-6 w-6 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">4</span>
          <span>Added to Dashboard</span>
        </div>
      </div>

      {importError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center space-x-3 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD & PLAN METADATA */}
      {step === "upload" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <span>Upload Study Plan Spreadsheet</span>
              </CardTitle>
              <CardDescription>
                Upload your study schedule in <code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code> format. It will be automatically broken down day-wise.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Plan Name (Optional)
                  </label>
                  <Input
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    placeholder="e.g. 30-Day Java & DSA Roadmap"
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Start Date (Day 1)
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-10 hover:border-blue-500 dark:hover:border-blue-500 bg-gray-50/50 dark:bg-gray-900/50 cursor-pointer transition-all">
                <Upload className="h-10 w-10 text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Click or drag & drop your Excel / CSV file
                </p>
                <p className="text-xs text-gray-500 mt-1">Supports Day 1..N, Dates, Subject, Topic, Duration, Platform</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {step === "map" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Match Excel Columns to Application Fields</CardTitle>
            <CardDescription>
              We automatically detected column matches from <strong>{file?.name}</strong>. Adjust any mappings if needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TARGET_FIELDS.map((field) => (
                <div key={field.key} className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{field.label}</span>
                      {field.required && <Badge variant="destructive" className="text-[10px] py-0">Required</Badge>}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Aliases: {field.aliases.slice(0, 3).join(", ")}</p>
                  </div>
                  <select
                    value={columnMapping[field.key] || ""}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Do Not Map --</option>
                    {rawHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setStep("upload")}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
              </Button>
              <Button size="sm" onClick={handleProceedToPreview}>
                <span>Continue to Day-Wise Breakdown</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: DAY-WISE BREAKDOWN PREVIEW */}
      {step === "preview" && parseResult && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  <span>Day-Wise Breakdown Preview</span>
                </CardTitle>
                <CardDescription>
                  Your spreadsheet has been broken down into <strong>{parseResult.totalDays} scheduled days</strong> ({parseResult.validRowsCount} study tasks).
                </CardDescription>
              </div>

              {/* View Switcher */}
              <div className="flex items-center space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                  onClick={() => setPreviewTab("daywise")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-colors ${
                    previewTab === "daywise"
                      ? "bg-white dark:bg-gray-900 text-blue-600 shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Day-Wise View</span>
                </button>
                <button
                  onClick={() => setPreviewTab("table")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-colors ${
                    previewTab === "table"
                      ? "bg-white dark:bg-gray-900 text-blue-600 shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  <span>Full Table</span>
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400">Total Duration</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{parseResult.totalDays} Days</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <p className="text-[11px] font-medium text-purple-600 dark:text-purple-400">Total Study Tasks</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{parseResult.validRowsCount} Sessions</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Total Study Hours</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{parseResult.totalHours} hrs</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Status</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {parseResult.invalidRowsCount === 0 ? "Ready to Import" : `${parseResult.invalidRowsCount} Errors`}
                </p>
              </div>
            </div>

            {/* DAY-WISE ACCORDION VIEW */}
            {previewTab === "daywise" && (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {parseResult.dayGroups.map((day) => {
                  const dayHours = Math.round((day.totalDurationMinutes / 60) * 10) / 10;
                  return (
                    <div
                      key={day.date}
                      className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
                    >
                      {/* Day Header */}
                      <div className="p-3.5 bg-gray-50/80 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center space-x-2.5">
                          <span className="h-6 px-2 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center">
                            {day.dayLabel}
                          </span>
                          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            {day.date}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <BookOpen className="h-3.5 w-3.5 mr-1 text-gray-400" />
                            {day.tasksCount} {day.tasksCount === 1 ? "task" : "tasks"}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                            {dayHours} hrs ({day.totalDurationMinutes}m)
                          </span>
                        </div>
                      </div>

                      {/* Day Task Items */}
                      <div className="divide-y divide-gray-100 dark:divide-gray-800 p-2">
                        {day.tasks.map((task) => (
                          <div
                            key={task.rowNumber}
                            className="p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <Badge variant="purple" className="text-[10px]">{task.mapped.subject}</Badge>
                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                  {task.mapped.topic}
                                </span>
                                {task.mapped.subtopic && (
                                  <span className="text-[11px] text-gray-500">
                                    - {task.mapped.subtopic}
                                  </span>
                                )}
                              </div>
                              {task.mapped.notesSummary && (
                                <p className="text-[11px] text-gray-500 line-clamp-1">{task.mapped.notesSummary}</p>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                              <span className="text-[11px] text-gray-400">{task.mapped.durationMinutes}m</span>
                              <Badge
                                variant={task.mapped.priority === "urgent" ? "destructive" : task.mapped.priority === "high" ? "warning" : "secondary"}
                                className="text-[10px]"
                              >
                                {task.mapped.priority}
                              </Badge>
                              {task.mapped.practicePlatform && (
                                <Badge variant="outline" className="text-[10px]">{task.mapped.practicePlatform}</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* RAW TABLE VIEW */}
            {previewTab === "table" && (
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-semibold">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Day</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Topic</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Platform</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {parseResult.rows.slice(0, 25).map((row) => (
                      <tr key={row.rowNumber} className={row.isValid ? "" : "bg-red-50/30 dark:bg-red-950/20"}>
                        <td className="p-3 font-mono text-gray-400">{row.rowNumber}</td>
                        <td className="p-3 font-bold text-blue-600">{row.mapped.dayLabel}</td>
                        <td className="p-3 font-medium">{row.mapped.scheduledDate}</td>
                        <td className="p-3"><Badge variant="secondary">{row.mapped.subject}</Badge></td>
                        <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{row.mapped.topic}</td>
                        <td className="p-3">{row.mapped.durationMinutes} mins</td>
                        <td className="p-3">
                          <Badge variant={row.mapped.priority === "urgent" ? "destructive" : row.mapped.priority === "high" ? "warning" : "default"}>
                            {row.mapped.priority}
                          </Badge>
                        </td>
                        <td className="p-3 text-gray-500">{row.mapped.practicePlatform || "-"}</td>
                        <td className="p-3">
                          {row.isValid ? (
                            <span className="text-emerald-600 font-medium flex items-center"><Check className="h-3.5 w-3.5 mr-1" /> Ready</span>
                          ) : (
                            <span className="text-red-500 font-medium">{row.errors.join(", ")}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setStep("map")}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Mapping
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteImport}
                disabled={isImporting || parseResult.validRowsCount === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                    <span>Adding Day-Wise Plan to Dashboard...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    <span>Add Plan to Dashboard ({parseResult.validRowsCount} Tasks &bull; {parseResult.totalDays} Days)</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: COMPLETED */}
      {step === "done" && (
        <Card className="text-center py-10">
          <CardContent className="space-y-5">
            <div className="h-16 w-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <Check className="h-9 w-9" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Day-Wise Study Plan Added Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
                Successfully organized and inserted <strong>{importedCount} study tasks</strong> across <strong>{parseResult?.totalDays || 1} scheduled days</strong> into your Study Plan Dashboard.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/dashboard">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                  <span>Go to Study Plan Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
              <Link href="/plans">
                <Button variant="outline" size="sm" className="text-xs">
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  <span>View Day-by-Day Schedule</span>
                </Button>
              </Link>
              <Link href="/calendar">
                <Button variant="ghost" size="sm" className="text-xs">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  <span>Calendar View</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
