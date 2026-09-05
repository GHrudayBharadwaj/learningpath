"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Bot, X } from "lucide-react";
import { MultiModelAiModal } from "./MultiModelAiModal";

export function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  // Global keyboard shortcut: Ctrl+J or Alt+A to toggle AI modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key.toLowerCase() === "j") || (e.altKey && e.key.toLowerCase() === "a")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex items-center space-x-2">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2 pl-3.5 pr-4 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-bold shadow-xl shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 cursor-pointer border border-white/20"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>

          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="tracking-wide">AI Multi-Model Hub</span>

          <span className="hidden sm:inline-block text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-normal">
            Ctrl+J
          </span>
        </button>
      </div>

      <MultiModelAiModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
