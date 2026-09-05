"use client";

import React, { useState } from "react";
import { Code2, Sparkles, ExternalLink, CheckCircle2, ChevronRight, Terminal, RefreshCw, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function CodingSuite({ onSelectTopic }: { onSelectTopic?: (topic: string) => void }) {
  const [topic, setTopic] = useState("Binary Search");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [practiceData, setPracticeData] = useState<any>(null);

  const handleGenerateCodingGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          subject: "Data Structures & Algorithms",
          difficulty,
          purpose: "coding",
          noteType: "coding_practice",
          includeSources: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPracticeData(data.note);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const platforms = [
    { name: "LeetCode", url: `https://leetcode.com/problemset/all/?search=${encodeURIComponent(topic)}`, badge: "Top Interview" },
    { name: "GeeksforGeeks", url: `https://www.geeksforgeeks.org/tag/${encodeURIComponent(topic)}/`, badge: "Tutorials & Solutions" },
    { name: "HackerRank", url: `https://www.hackerrank.com/domains`, badge: "Skill Certification" },
    { name: "CodeChef", url: `https://www.codechef.com/practice`, badge: "Competitive" },
  ];

  return (
    <div className="space-y-6">
      {/* Search and Generator Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Code2 className="h-5 w-5 text-blue-600" />
            <span>AI Coding Practice & Interview Generator</span>
          </CardTitle>
          <CardDescription>
            Enter any programming topic or algorithm to generate verified problem sets, $O(n)$ complexity breakdown, and curated practice links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateCodingGuide} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Dynamic Programming, Trie, Two Pointers, Graph BFS..."
                className="text-xs"
              />
            </div>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <Button type="submit" size="sm" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  <span>Generating Code Guide...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  <span>Generate Practice Guide</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Verified Practice Platforms */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {platforms.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-500 hover:shadow-xs transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                {p.name}
              </p>
              <span className="text-[10px] text-gray-500">{p.badge}</span>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </a>
        ))}
      </div>

      {/* Output Content */}
      {practiceData && (
        <Card>
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{practiceData.topic}</CardTitle>
                <CardDescription>Generated Interview & Coding Practice Guide</CardDescription>
              </div>
              <Badge variant="purple">{practiceData.difficulty}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <article className="prose prose-blue dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200">
              {practiceData.content}
            </article>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
