"use client";

import React, { useState } from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TARGET_FIELDS, autoDetectMapping } from "@/lib/excel/mapping";
import { parseExcelBuffer, processMappedRows, ParseResult } from "@/lib/excel/parser";

export function ExcelImportWizard({ onImportComplete }: { onImportComplete?: (count: number) => void }) {
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setImportError(null);

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
    const result = processMappedRows(rawHeaders, rawRows, columnMapping);
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

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: validTasks }),
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className={`flex items-center space-x-2 text-xs font-semibold ${step === "upload" ? "text-blue-600" : "text-gray-400"}`}>
          <span className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-950/60 text-blue-600">1</span>
          <span>Upload File</span>
        </div>
        <div className="h-px w-12 bg-gray-200 dark:bg-gray-800" />
        <div className={`flex items-center space-x-2 text-xs font-semibold ${step === "map" ? "text-blue-600" : "text-gray-400"}`}>
          <span className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-950/60 text-blue-600">2</span>
          <span>Map Columns</span>
        </div>
        <div className="h-px w-12 bg-gray-200 dark:bg-gray-800" />
        <div className={`flex items-center space-x-2 text-xs font-semibold ${step === "preview" ? "text-blue-600" : "text-gray-400"}`}>
          <span className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-950/60 text-blue-600">3</span>
          <span>Validate & Preview</span>
        </div>
        <div className="h-px w-12 bg-gray-200 dark:bg-gray-800" />
        <div className={`flex items-center space-x-2 text-xs font-semibold ${step === "done" ? "text-emerald-600" : "text-gray-400"}`}>
          <span className="h-6 w-6 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">4</span>
          <span>Imported</span>
        </div>
      </div>

      {importError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center space-x-3 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <span>Upload Study Plan Spreadsheet</span>
            </CardTitle>
            <CardDescription>
              Upload your study schedule in <code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code> format.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-10 hover:border-blue-500 dark:hover:border-blue-500 bg-gray-50/50 dark:bg-gray-900/50 cursor-pointer transition-all">
              <Upload className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Click or drag & drop your Excel / CSV file
              </p>
              <p className="text-xs text-gray-500 mt-1">Supports Date, Subject, Topic, Duration, Platform, Priority</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </CardContent>
        </Card>
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
                <span>Continue to Preview</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: PREVIEW & VALIDATION */}
      {step === "preview" && parseResult && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base">Data Validation & Import Preview</CardTitle>
                <CardDescription>Review the detected study tasks before importing to your plan.</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="success">{parseResult.validRowsCount} Valid</Badge>
                {parseResult.invalidRowsCount > 0 && <Badge variant="destructive">{parseResult.invalidRowsCount} Invalid</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-semibold">
                  <tr>
                    <th className="p-3">#</th>
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
                  {parseResult.rows.slice(0, 15).map((row) => (
                    <tr key={row.rowNumber} className={row.isValid ? "" : "bg-red-50/30 dark:bg-red-950/20"}>
                      <td className="p-3 font-mono text-gray-400">{row.rowNumber}</td>
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

            {parseResult.rows.length > 15 && (
              <p className="text-center text-xs text-gray-500">
                Showing first 15 of {parseResult.rows.length} rows...
              </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setStep("map")}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Mapping
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteImport}
                disabled={isImporting || parseResult.validRowsCount === 0}
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                    <span>Importing to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    <span>Confirm Import ({parseResult.validRowsCount} Tasks)</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: COMPLETED */}
      {step === "done" && (
        <Card className="text-center py-8">
          <CardContent className="space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Study Plan Imported Successfully!</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Successfully parsed and inserted <strong>{importedCount} study tasks</strong> into your database. You can now view them on your dashboard, calendar, and generate AI notes.
            </p>
            <div className="flex justify-center space-x-3 pt-2">
              <Button size="sm" onClick={() => window.location.href = "/dashboard"}>
                Go to Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setStep("upload"); setFile(null); }}>
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
