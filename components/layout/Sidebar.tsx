"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/button";
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  BookOpen,
  Code2,
  BarChart3,
  Settings,
  GraduationCap,
  Upload,
  Layers,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plans", label: "Study Plans", icon: Layers },
  { href: "/calendar", label: "Study Calendar", icon: CalendarDays },
  { href: "/notes", label: "AI Study Notes", icon: Sparkles },
  { href: "/sources", label: "Sources & Docs", icon: BookOpen },
  { href: "/practice", label: "Coding Practice", icon: Code2 },
  { href: "/progress", label: "Progress & Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 px-6 h-16 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <span className="font-bold text-base bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI Study Planner
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">Vercel-First Edition</p>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Study Workspace
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Quick Excel Action */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <Link
          href="/plans/import"
          className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/10 transition-all cursor-pointer"
        >
          <Upload className="h-4 w-4" />
          <span>Import Excel Plan</span>
        </Link>
      </div>
    </aside>
  );
}
