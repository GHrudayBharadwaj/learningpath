"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Sparkles, LogOut, User, CheckCircle2, Bot } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { MultiModelAiModal } from "@/components/ai/MultiModelAiModal";

export function Navbar({ userName = "Demo Student", userEmail = "demo@studyplanner.ai" }: { userName?: string; userEmail?: string }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchModal(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {
      // Continue
    }
    router.push("/login");
  };

  return (
    <>
      <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search study plans, topics, notes, sources..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-gray-100/80 dark:bg-gray-800/80 border border-transparent focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all"
          />
        </form>

        {/* Action Controls & Profile */}
        <div className="flex items-center space-x-2.5 ml-auto">
          {/* AI Multi-Model Assistant Button */}
          <button
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 hover:from-purple-600/20 hover:to-blue-600/20 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800/60 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
            <span>AI Hub</span>
            <span className="hidden md:inline-block text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 px-1.5 py-0.2 rounded font-normal font-mono">
              GPT/Gemini
            </span>
          </button>

          {/* Quick AI Note Generation */}
          <Link
            href="/notes?action=generate"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer"
          >
            <Bot className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </Link>

          {/* Notifications */}
          <button
            onClick={() => setShowNotificationsModal(true)}
            className="relative p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Reminders & Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-gray-900" />
          </button>

          {/* User Profile Badge */}
          <div className="flex items-center space-x-2 pl-2 border-l border-gray-200 dark:border-gray-800">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight">{userName}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight truncate max-w-[120px]">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Multi-Model AI Hub Modal */}
      <MultiModelAiModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />

      {/* Global Search Results Dialog */}
      <Dialog
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="Search Results"
        description={`Showing results for: "${searchQuery}"`}
      >
        {isSearching ? (
          <div className="py-8 text-center text-sm text-gray-500">Searching your workspace...</div>
        ) : searchResults ? (
          <div className="space-y-4">
            {/* Tasks */}
            {searchResults.tasks?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Study Tasks</h4>
                <div className="space-y-1.5">
                  {searchResults.tasks.map((task: any) => (
                    <Link
                      key={task.id}
                      href={`/plans`}
                      onClick={() => setShowSearchModal(false)}
                      className="block p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-gray-100 dark:border-gray-800 text-xs transition-colors"
                    >
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{task.title}</span>
                      <span className="ml-2 text-gray-500">({task.subject} &bull; {task.scheduledDate})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {searchResults.notes?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">AI Notes</h4>
                <div className="space-y-1.5">
                  {searchResults.notes.map((note: any) => (
                    <Link
                      key={note.id}
                      href={`/notes`}
                      onClick={() => setShowSearchModal(false)}
                      className="block p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-gray-100 dark:border-gray-800 text-xs transition-colors"
                    >
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{note.topic}</span>
                      <span className="ml-2 text-gray-500">({note.subject})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {searchResults.sources?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Sources</h4>
                <div className="space-y-1.5">
                  {searchResults.sources.map((source: any) => (
                    <Link
                      key={source.id}
                      href={`/sources`}
                      onClick={() => setShowSearchModal(false)}
                      className="block p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-gray-100 dark:border-gray-800 text-xs transition-colors"
                    >
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{source.title}</span>
                      <span className="ml-2 uppercase text-[10px] text-blue-600">[{source.sourceType}]</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(!searchResults.tasks?.length && !searchResults.notes?.length && !searchResults.sources?.length) && (
              <div className="py-8 text-center text-sm text-gray-500">
                No matching plans, tasks, notes, or sources found.
              </div>
            )}
          </div>
        ) : null}
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        title="Study Reminders & Notifications"
        description="Upcoming study notifications and scheduled reminders"
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Daily Study Reminders Active</p>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                Vercel Cron is scheduled to send daily agenda emails to <strong>{userEmail}</strong>.
              </p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 flex items-start space-x-3">
            <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">AI Notes Ready</p>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                Multi-source RAG is ready. You can generate notes from your uploaded PDFs, web links, or YouTube transcripts.
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
