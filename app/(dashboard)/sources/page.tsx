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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Dialog, Tabs } from "@/components/ui/dialog";

export default function SourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isWebModalOpen, setIsWebModalOpen] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);

  // Form states
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [fileSubject, setFileSubject] = useState("");
  const [fileTopic, setFileTopic] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

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

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setIsSubmitting(true);
    setStatusFeedback(null);

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("subject", fileSubject || "General");
    formData.append("topic", fileTopic || fileToUpload.name);

    try {
      const res = await fetch("/api/sources/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to process and upload document.");
      }

      setIsUploadModalOpen(false);
      setFileToUpload(null);
      fetchSources();
    } catch (err: any) {
      setStatusFeedback(err.message);
    } finally {
      setIsSubmitting(false);
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

      {/* Upload Document Modal */}
      <Dialog
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Study Document"
        description="Upload textbooks, syllabus PDFs, or DOCX reference files."
      >
        <form onSubmit={handleFileUpload} className="space-y-4 text-xs">
          {statusFeedback && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>{statusFeedback}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Select File (PDF, DOCX, TXT) *</label>
            <input
              type="file"
              required
              accept=".pdf,.docx,.doc,.txt,.md"
              onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
              className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Subject</label>
              <Input
                value={fileSubject}
                onChange={(e) => setFileSubject(e.target.value)}
                placeholder="e.g. Physics, Java"
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Topic</label>
              <Input
                value={fileTopic}
                onChange={(e) => setFileTopic(e.target.value)}
                placeholder="e.g. Quantum Mechanics"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !fileToUpload}>
              {isSubmitting ? "Uploading & Chunking..." : "Upload & Process"}
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
