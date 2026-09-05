"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Flame, Clock, CheckCircle2, TrendingUp } from "lucide-react";

const COLORS = ["#2563eb", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

export function ProgressCharts({
  summary,
  subjectStats,
  dailyLogs,
}: {
  summary: any;
  subjectStats: Record<string, any>;
  dailyLogs: any[];
}) {
  const barData = (dailyLogs || []).slice(0, 7).reverse().map(log => ({
    date: log.date.slice(5),
    minutes: log.totalMinutesStudied,
    hours: Math.round((log.totalMinutesStudied / 60) * 10) / 10,
    tasks: log.completedTasks,
  }));

  const displayBarData = barData.length > 0 ? barData : [
    { date: "Day 1", minutes: 90, hours: 1.5, tasks: 2 },
    { date: "Day 2", minutes: 150, hours: 2.5, tasks: 3 },
    { date: "Day 3", minutes: 180, hours: 3.0, tasks: 4 },
    { date: "Day 4", minutes: 60, hours: 1.0, tasks: 1 },
    { date: "Day 5", minutes: 240, hours: 4.0, tasks: 5 },
    { date: "Today", minutes: (summary?.totalStudyHours || 2.5) * 60, hours: summary?.totalStudyHours || 2.5, tasks: summary?.completedTasks || 3 },
  ];

  const pieData = Object.entries(subjectStats || {}).map(([name, stat]: [string, any]) => ({
    name,
    value: stat.minutes || (stat.total * 60) || 60,
  }));

  const displayPieData = pieData.length > 0 ? pieData : [
    { name: "Data Structures", value: 180 },
    { name: "Algorithms", value: 120 },
    { name: "System Design", value: 90 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Stat Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Active Streak</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{summary?.streakDays || 1} Days</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Study Hours</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{summary?.totalStudyHours || 0} hrs</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Completed Tasks</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {summary?.completedTasks || 0} / {summary?.totalTasks || 0}
            </h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Completion Rate</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{summary?.completionRate || 0}%</h3>
          </div>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours Studied Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Study Hours Velocity</CardTitle>
            <CardDescription>Daily study time distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="h" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      color: "#fff",
                      borderRadius: "8px",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                  <Bar dataKey="hours" fill="#2563eb" radius={[6, 6, 0, 0]} name="Hours Studied" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject Mastery Breakdown</CardTitle>
            <CardDescription>Time allocated by subject area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {displayPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${Math.round(Number(value) / 60)} hrs (${value}m)`, "Allocated"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
