import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  FileSpreadsheet,
  Calendar,
  BookOpen,
  Code2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100 flex flex-col justify-between">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI Study Planner
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="text-xs">
              Get Started Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-12 pb-24 text-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Vercel-First Full-Stack Academic Assistant</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 max-w-4xl mx-auto leading-tight">
          Supercharge Your Learning with <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AI Notes, Smart Excel Plans & RAG</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Import your spreadsheet syllabus, schedule tasks across calendar views, ingest PDFs, Web articles, and YouTube transcripts, and generate exam & interview ready study notes instantly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/signup">
            <Button size="lg" className="h-12 px-8 text-sm font-semibold shadow-lg shadow-blue-500/20 cursor-pointer">
              <span>Create Free Account</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="h-12 px-8 text-sm cursor-pointer">
              Explore Demo Dashboard
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Excel / CSV Study Importer</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Auto-detects course columns, subject, priority, duration, and platforms. Full mapping wizard with validation and duplicate prevention.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Multi-Source RAG & Citations</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Ingest PDFs, Word DOCX, text files, Web URLs, and YouTube transcripts with pgvector semantic retrieval and verified source citations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Exam Notes & Coding Suite</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Generate 2-mark, 5-mark, and 10-mark exam sheets, plus LeetCode/GeeksforGeeks-aligned coding practice guides with $O(n)$ complexity breakdown.
            </p>
          </div>
        </div>

        {/* Feature Highlights List */}
        <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 mt-12 text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Vercel Serverless & Edge-Ready Architecture</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>OpenAI (GPT-4o) & Google Gemini Multi-Provider</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Scheduled Vercel Cron & Resend Email Reminders</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Secure Password Hashing & Strict User Isolation</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 px-6 text-center text-xs text-gray-500">
        AI Study Planner &bull; Built with Next.js App Router, Tailwind CSS, Drizzle ORM, and Vercel AI SDK
      </footer>
    </div>
  );
}
