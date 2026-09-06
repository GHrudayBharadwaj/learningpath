"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Upload,
  Globe,
  Video,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  X,
  Files,
  File as FileIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Dialog, Tabs } from "@/components/ui/dialog";
import { extractTextFromPdfArrayBuffer } from "@/lib/documents/pdf";

export default function SourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isWebModalOpen, setIsWebModalOpen] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);

  // Form states
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileSubject, setFileSubject] = useState("");
  const [fileTopic, setFileTopic] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Per-file upload progress tracking
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentFileName: string;
    completedFiles: string[];
    failedFiles: { name: string; error: string }[];
  } | null>(null);

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/sources");
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFilesToUpload(prev => [...prev, ...selected]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const dropped = Array.from(e.dataTransfer.files).filter(f =>
        /\.(pdf|docx|doc|txt|md)$/i.test(f.name)
      );
      setFilesToUpload(prev => [...prev, ...dropped]);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (filesToUpload.length === 0) return;

    setIsSubmitting(true);
    setStatusFeedback(null);

    const completed: string[] = [];
    const failed: { name: string; error: string }[] = [];

    setUploadProgress({
      current: 0,
      total: filesToUpload.length,
      currentFileName: filesToUpload[0].name,
      completedFiles: [],
      failedFiles: [],
    });

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadProgress({
        current: i + 1,
        total: filesToUpload.length,
        currentFileName: file.name,
        completedFiles: [...completed],
        failedFiles: [...failed],
      });

      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      let res: Response;

      try {
        if (file.size > 3.5 * 1024 * 1024 || ext === "pdf" || ext === "txt" || ext === "md") {
          // Direct extracted text payload (JSON is < 300KB even for huge books, completely bypassing the 4.5MB serverless limit)
          let extractedText = "";
          let fileType = "txt";

          if (ext === "pdf") {
            fileType = "pdf";
            const arrayBuffer = await file.arrayBuffer();
            const { text } = extractTextFromPdfArrayBuffer(arrayBuffer);
            extractedText = text;
          } else if (ext === "txt" || ext === "md") {
            fileType = "txt";
            extractedText = await file.text();
          } else {
            fileType = ext;
            extractedText = `Document: ${file.name}`;
          }

          res = await fetch("/api/sources/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              fileType,
              extractedText,
              subject: fileSubject || "General",
              topic: fileTopic || "",
            }),
          });
        } else {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("subject", fileSubject || "General");
          formData.append("topic", fileTopic || "");

          res = await fetch("/api/sources/upload", {
            method: "POST",
            body: formData,
          });
        }

        let data: any = {};
        try {
          const text = await res.text();
          data = text ? JSON.parse(text) : {};
        } catch {
          if (!res.ok) throw new Error(`HTTP ${res.status}: Upload failed.`);
        }

        if (!res.ok) {
          throw new Error(data.error || `Failed to process ${file.name}`);
        }

        completed.push(file.name);
      } catch (err: any) {
        console.error("Upload error for file:", file.name, err);
        failed.push({ name: file.name, error: err.message || "Failed to upload" });
      }
    }

    setIsSubmitting(false);
    await fetchSources();

    if (failed.length === 0) {
      setIsUploadModalOpen(false);
      setFilesToUpload([]);
      setFileSubject("");
      setFileTopic("");
      setUploadProgress(null);
    } else {
      setUploadProgress({
        current: filesToUpload.length,
        total: filesToUpload.length,
        currentFileName: "",
        completedFiles: completed,
        failedFiles: failed,
      });
      setStatusFeedback(
        `Uploaded ${completed.length} of ${filesToUpload.length} documents. ${failed.length} failed (${failed.map(f => `${f.name}: ${f.error}`).join(", ")})`
      );
      // Keep only failed files in the list for retry
      setFilesToUpload(prev => prev.filter(f => failed.some(fail => fail.name === f.name)));
    }
  };

  const handleAddWebSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webUrl.trim()) return;

    setIsSubmitting(true);
    setStatusFeedback(null);

    try {
      const res = await fetch("/api/sources/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webUrl }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to retrieve web page.");
      }

      setIsWebModalOpen(false);
      setWebUrl("");
      fetchSources();
    } catch (err: any) {
      setStatusFeedback(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddYoutubeSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setIsSubmitting(true);
    setStatusFeedback(null);

    try {
      const res = await fetch("/api/sources/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to process YouTube URL.");
      }

      setIsYoutubeModalOpen(false);
      setYoutubeUrl("");
      fetchSources();
    } catch (err: any) {
      setStatusFeedback(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this source and its RAG chunks?")) return;
    try {
      const res = await fetch(`/api/sources/${id}`, { method: "DELETE" });
      if (res.ok) fetchSources();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSources = sources.filter(s => {
    if (activeTab === "all") return true;
    if (activeTab === "documents") return s.sourceType === "pdf" || s.sourceType === "docx" || s.sourceType === "txt";
    return s.sourceType === activeTab;
  });

  const tabs = [
    { id: "all", label: "All Sources", badge: sources.length },
    { id: "documents", label: "PDF / DOCX Books", badge: sources.filter(s => ["pdf", "docx", "txt"].includes(s.sourceType)).length },
    { id: "web", label: "Web Articles", badge: sources.filter(s => s.sourceType === "web").length },
    { id: "youtube", label: "YouTube Transcripts", badge: sources.filter(s => s.sourceType === "youtube").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            <span>Study Sources & RAG Knowledge Base</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Ingest textbooks, PDFs, web documentation, and YouTube transcripts for AI synthesis.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <Button size="sm" onClick={() => setIsUploadModalOpen(true)} className="text-xs">
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            <span>Upload Document</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsWebModalOpen(true)} className="text-xs">
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            <span>Add Web URL</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsYoutubeModalOpen(true)} className="text-xs">
            <Video className="h-3.5 w-3.5 mr-1.5 text-red-600" />
            <span>Add YouTube</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSources.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-gray-400">
            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-600 dark:text-gray-300 text-sm">No knowledge sources added yet</p>
            <p className="text-gray-400 mt-1">Upload PDF/DOCX files or paste web/YouTube links to power RAG retrieval.</p>
          </div>
        ) : (
          filteredSources.map((src) => (
            <Card key={src.id} className="p-4 flex flex-col justify-between hover:border-emerald-400 transition-all space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={src.sourceType === "youtube" ? "destructive" : src.sourceType === "web" ? "default" : "success"} className="uppercase text-[10px]">
                    {src.sourceType}
                  </Badge>
                  <span className="text-[10px] text-gray-400">
                    {new Date(src.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                  {src.title}
                </h3>

                {src.extractedContent && (
                  <p className="text-xs text-gray-500 line-clamp-3">
                    {src.extractedContent}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                {src.sourceUrl ? (
                  <a
                    href={src.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center text-[11px]"
                  >
                    <span>View Link</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                ) : (
                  <span className="text-gray-400 text-[11px]">Stored in Vercel Blob</span>
                )}

                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSource(src)}
                    className="h-7 px-2 text-[11px]"
                  >
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSource(src.id)}
                    className="h-7 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Upload Document Modal (Multi-File) */}
      <Dialog
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Study Documents (Multi-File)"
        description="Upload multiple textbooks, lecture slides, syllabus PDFs, or DOCX reference files."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleFileUpload} className="space-y-4 text-xs">
          {statusFeedback && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{statusFeedback}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                : "border-gray-300 dark:border-gray-700 hover:border-blue-400 bg-gray-50/50 dark:bg-gray-900/40"
            }`}
            onClick={() => document.getElementById("multi-file-input")?.click()}
          >
            <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
              Click to browse or drag & drop multiple files here
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Supports <strong>PDF, DOCX, DOC, TXT, MD</strong> (Up to 25MB each)
            </p>
            <input
              id="multi-file-input"
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Live Progress Bar during Batch Ingestion */}
          {isSubmitting && uploadProgress && (
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
                <span className="flex items-center space-x-1.5">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  <span>
                    Uploading Document {uploadProgress.current} of {uploadProgress.total}
                  </span>
                </span>
                <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-100 dark:bg-blue-900/40 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-blue-600 dark:text-blue-300 truncate">
                Processing: <strong>{uploadProgress.currentFileName}</strong> (Extracting text & RAG chunks)
              </p>
            </div>
          )}

          {/* Selected Files List */}
          {filesToUpload.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                  <Files className="h-3.5 w-3.5 text-blue-600" />
                  <span>Selected Documents ({filesToUpload.length})</span>
                </span>
                {!isSubmitting && (
                  <button
                    type="button"
                    onClick={() => setFilesToUpload([])}
                    className="text-red-600 hover:underline text-[11px]"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filesToUpload.map((f, idx) => {
                  const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
                  const ext = f.name.split(".").pop()?.toUpperCase();
                  const isDone = uploadProgress?.completedFiles.includes(f.name);
                  const isCurrent = isSubmitting && uploadProgress?.currentFileName === f.name;
                  const isFailed = uploadProgress?.failedFiles.some(fail => fail.name === f.name);

                  return (
                    <div
                      key={`${f.name}-${idx}`}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                        isDone
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                          : isCurrent
                          ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 ring-1 ring-blue-500/20"
                          : isFailed
                          ? "bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
                          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                          {ext}
                        </Badge>
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                          {f.name}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0">({sizeMB} MB)</span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {isDone && (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Ready
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Ingesting...
                          </span>
                        )}
                        {isFailed && (
                          <span className="text-red-500 text-[11px] font-semibold">
                            Failed
                          </span>
                        )}
                        {!isSubmitting && !isDone && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(idx);
                            }}
                            className="text-gray-400 hover:text-red-600 p-1 shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subject & Topic Batch Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Subject Category <span className="text-gray-400 font-normal text-[10px]">(Optional)</span>
              </label>
              <Input
                value={fileSubject}
                onChange={(e) => setFileSubject(e.target.value)}
                placeholder="e.g. Computer Science, Java"
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Topic / Domain <span className="text-gray-400 font-normal text-[10px]">(Optional)</span>
              </label>
              <Input
                value={fileTopic}
                onChange={(e) => setFileTopic(e.target.value)}
                placeholder="e.g. Data Structures, Algorithms"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || filesToUpload.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  <span>Processing {filesToUpload.length} Document(s)...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  <span>Upload & Index {filesToUpload.length > 0 ? `(${filesToUpload.length} Files)` : ""}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Web Source Modal */}
      <Dialog
        isOpen={isWebModalOpen}
        onClose={() => setIsWebModalOpen(false)}
        title="Ingest Web Documentation / Article"
        description="Provide any public educational article URL to extract content."
      >
        <form onSubmit={handleAddWebSource} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Web URL *</label>
            <Input
              type="url"
              required
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              placeholder="https://developer.mozilla.org/..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsWebModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !webUrl}>
              {isSubmitting ? "Scraping & Indexing..." : "Add Web Source"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* YouTube Modal */}
      <Dialog
        isOpen={isYoutubeModalOpen}
        onClose={() => setIsYoutubeModalOpen(false)}
        title="Add YouTube Video Resource"
        description="Provide a YouTube video URL to retrieve metadata and transcripts where available."
      >
        <form onSubmit={handleAddYoutubeSource} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">YouTube Watch / Share URL *</label>
            <Input
              type="url"
              required
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <p className="text-[11px] text-gray-500">
            Note: If captions/transcript are disabled for this video, the system will clearly indicate this and synthesize using the video's public title and overview.
          </p>

          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsYoutubeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !youtubeUrl}>
              {isSubmitting ? "Retrieving Transcript..." : "Add YouTube Source"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Source Preview Dialog */}
      <Dialog
        isOpen={!!selectedSource}
        onClose={() => setSelectedSource(null)}
        title={selectedSource?.title || "Source Preview"}
        description={`Type: ${selectedSource?.sourceType?.toUpperCase()} | Subject: ${selectedSource?.subject || "General"}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl max-h-[400px] overflow-y-auto whitespace-pre-wrap font-mono text-[11px]">
            {selectedSource?.extractedContent || "No extracted text available for this source."}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
