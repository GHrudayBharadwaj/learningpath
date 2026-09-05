"use client";

import React, { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function StudyCalendar({
  tasks,
  onTaskClick,
  onAddTask,
  onGenerateNotes,
}: {
  tasks: any[];
  onTaskClick?: (task: any) => void;
  onAddTask?: (date: string) => void;
  onGenerateNotes?: (task: any) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = tasks.reduce((acc: Record<string, any[]>, task) => {
    const d = task.scheduledDate;
    if (!acc[d]) acc[d] = [];
    acc[d].push(task);
    return acc;
  }, {});

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDayTasks = tasksByDate[selectedDateStr] || [];

  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, "d");
      const cloneDay = day;
      const dateKey = format(cloneDay, "yyyy-MM-dd");
      const dayTasks = tasksByDate[dateKey] || [];
      const isCurrentMonth = isSameMonth(cloneDay, monthStart);
      const isSelected = isSameDay(cloneDay, selectedDate);
      const isToday = isSameDay(cloneDay, new Date());

      days.push(
        <div
          key={dateKey}
          onClick={() => setSelectedDate(cloneDay)}
          className={`min-h-[90px] p-2 border border-gray-100 dark:border-gray-800 transition-all cursor-pointer flex flex-col justify-between ${
            !isCurrentMonth ? "bg-gray-50/40 dark:bg-gray-900/30 text-gray-400" : "bg-white dark:bg-gray-900"
          } ${isSelected ? "ring-2 ring-blue-500 rounded-lg shadow-xs z-10" : ""} ${
            isToday ? "border-blue-400 dark:border-blue-700" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold h-6 w-6 flex items-center justify-center rounded-full ${
                isToday ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {formattedDate}
            </span>
            {dayTasks.length > 0 && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-full">
                {dayTasks.length}
              </span>
            )}
          </div>

          <div className="space-y-1 mt-1 overflow-hidden">
            {dayTasks.slice(0, 2).map((task) => (
              <div
                key={task.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onTaskClick) onTaskClick(task);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                  task.status === "completed"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : task.priority === "urgent"
                    ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                    : "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                }`}
                title={task.title}
              >
                {task.subject}: {task.topic}
              </div>
            ))}
            {dayTasks.length > 2 && (
              <p className="text-[9px] text-gray-400 font-semibold">+{dayTasks.length - 2} more</p>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toISOString()}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <p className="text-xs text-gray-400">Click any date to view and organize tasks</p>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} className="text-xs h-8">
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center py-2 text-xs font-semibold text-gray-400 border-b border-gray-100 dark:border-gray-800">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Weeks & Days */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
          {rows}
        </div>
      </div>

      {/* Selected Day Agenda */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Scheduled Agenda</span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </h3>
            </div>
            {onAddTask && (
              <Button size="sm" onClick={() => onAddTask(selectedDateStr)} className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
              </Button>
            )}
          </div>

          <div className="py-4 space-y-3 max-h-[480px] overflow-y-auto">
            {selectedDayTasks.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                <p>No study tasks scheduled for this day.</p>
                {onAddTask && (
                  <Button variant="link" size="sm" onClick={() => onAddTask(selectedDateStr)} className="mt-2 text-xs">
                    + Schedule a study session
                  </Button>
                )}
              </div>
            ) : (
              selectedDayTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-400 transition-all bg-gray-50/50 dark:bg-gray-800/40 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{t.subject}</Badge>
                        <Badge variant={t.priority === "urgent" ? "destructive" : t.priority === "high" ? "warning" : "default"}>
                          {t.priority}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mt-1">{t.topic}</h4>
                      {t.subtopic && <p className="text-[11px] text-gray-500">{t.subtopic}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800 text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {t.startTime ? `${t.startTime} (${t.durationMinutes}m)` : `${t.durationMinutes} mins`}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {onGenerateNotes && (
                        <button
                          onClick={() => onGenerateNotes(t)}
                          className="px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold hover:bg-blue-200 flex items-center space-x-1 cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Notes</span>
                        </button>
                      )}
                      {onTaskClick && (
                        <Button variant="outline" size="sm" onClick={() => onTaskClick(t)} className="h-6 text-[10px] px-2">
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
