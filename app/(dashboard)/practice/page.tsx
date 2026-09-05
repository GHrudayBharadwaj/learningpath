"use client";

import React from "react";
import { Code2 } from "lucide-react";
import { CodingSuite } from "@/components/practice/CodingSuite";

export default function PracticePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Code2 className="h-6 w-6 text-blue-600" />
            <span>Coding Practice & Interview Preparation</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Auto-generate beginner to optimal solutions, time & space complexity analysis, and curated practice platform links.
          </p>
        </div>
      </div>

      <CodingSuite />
    </div>
  );
}
