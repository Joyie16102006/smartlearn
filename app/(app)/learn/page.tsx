"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Course } from "@/types";
import { mockCourses } from "@/data/mockData";
import { DayLearningView } from "@/components/learning/DayLearningView";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  Calendar,
  Flame,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TodayPlanPage() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("digital-electronics");
  const [isDaySessionActive, setIsDaySessionActive] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
          if (!data.find((c: Course) => c.id === selectedCourseId)) {
            setSelectedCourseId(data[0].id);
          }
        }
      })
      .catch((err) => console.warn("Failed to fetch courses from database:", err));
  }, [selectedCourseId]);

  const activeCourse =
    courses.find((c) => c.id === selectedCourseId) || courses[0];

  const activeDay =
    activeCourse.daysList?.find((d) => d.dayNumber === activeCourse.currentDay) ||
    activeCourse.daysList?.[0] || {
      dayNumber: 8,
      title: "Multiplexers (4:1 & 8:1 MUX Architectures)",
      conceptId: "c-mux",
      status: "current" as const,
      topicsCovered: [
        "Multiplexer data routing & select lines rule",
        "4:1 MUX Boolean equation & AND-OR synthesis",
        "Active-low enable input control (EN)",
      ],
      durationMinutes: 60,
    };

  if (isDaySessionActive) {
    return (
      <DayLearningView
        day={activeDay}
        courseId={activeCourse.id}
        courseTitle={activeCourse.title}
        totalDays={activeCourse.totalDays}
        streakDays={activeCourse.streakDays}
        onCompleteDay={() => {}}
        onBack={() => setIsDaySessionActive(false)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* ── TOP HEADER ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-zinc-200 rounded-sm">
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400 block">
            Today's Learning
          </span>
          <h1 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">
            {activeCourse.title}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-800">
            <Flame className="w-3.5 h-3.5 text-zinc-700" />
            <span>{activeCourse.streakDays || 7}d streak</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-zinc-900 bg-zinc-900 text-xs font-mono text-white">
            <Calendar className="w-3.5 h-3.5" />
            <span>Day {activeCourse.currentDay} of {activeCourse.totalDays}</span>
          </div>
        </div>
      </div>

      {/* ── TODAY SECTION CARDS ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            Today's Task Queue
          </h2>
          <span className="text-[11px] font-mono text-zinc-400">
            {courses.length} Active Courses
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, idx) => {
            const isPending = idx === 0;
            const isCompleted = idx === 1;

            return (
              <div
                key={course.id}
                className={cn(
                  "p-5 rounded-sm border transition-colors flex flex-col justify-between min-h-[220px]",
                  isPending
                    ? "bg-white border-zinc-900 shadow-xs"
                    : isCompleted
                    ? "bg-emerald-50/40 border-emerald-300"
                    : "bg-white border-zinc-200"
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                        Day {course.currentDay} of {course.totalDays}
                      </span>
                      <h3 className="text-sm font-bold text-zinc-900 mt-0.5">
                        {course.title}
                      </h3>
                    </div>

                    {isCompleted ? (
                      <span className="px-2 py-0.5 rounded-2xs bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    ) : isPending ? (
                      <span className="px-2 py-0.5 rounded-2xs bg-zinc-900 text-white text-[10px] font-mono font-bold">
                        Pending Today
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-2xs bg-zinc-100 text-zinc-600 text-[10px] font-mono">
                        {course.preferredTime}
                      </span>
                    )}
                  </div>

                  <div className="bg-zinc-50 rounded-xs p-3 border border-zinc-200/60 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                      Today's Topic:
                    </span>
                    <p className="text-xs font-semibold text-zinc-900 leading-snug">
                      {course.currentTopic}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                      <span>Course Progress</span>
                      <span>{course.progressPercentage}%</span>
                    </div>
                    <ProgressBar
                      value={course.progressPercentage}
                      size="sm"
                      color="neutral"
                    />
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">
                    {course.minutesPerDay}m Session
                  </span>

                  {isPending ? (
                    <button
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setIsDaySessionActive(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <Link
                      href={`/courses/${course.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-800 hover:underline"
                    >
                      <span>View Dashboard</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
