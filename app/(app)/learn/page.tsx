"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Course, DayPlan } from "@/types";
import { DayLearningView } from "@/components/learning/DayLearningView";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  Calendar,
  Flame,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Plus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TodayPlanPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [isDaySessionActive, setIsDaySessionActive] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.courses || []);
        if (list.length > 0) {
          setCourses(list);
          setSelectedCourseId(list[0].id);
        }
      })
      .catch((err) => console.warn("Failed to fetch courses from database:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const activeCourse =
    courses.find((c) => c.id === selectedCourseId) || courses[0];

  const activeDay: DayPlan | null =
    activeCourse?.daysList?.find((d) => d.dayNumber === activeCourse.currentDay) ||
    activeCourse?.daysList?.[0] ||
    null;

  if (isLoading) {
    return (
      <div className="p-16 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
        <span>Loading daily plan...</span>
      </div>
    );
  }

  if (courses.length === 0 || !activeCourse || !activeDay) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white rounded-md border border-zinc-200 p-10 text-center space-y-4 shadow-2xs">
        <div className="w-12 h-12 rounded-sm bg-zinc-100 flex items-center justify-center mx-auto text-zinc-500">
          <Calendar className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-zinc-900">
            No Daily Plan Available
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Create or import a course to generate your daily syllabus topics, lecture notes, and quizzes.
          </p>
        </div>
        <Link
          href="/courses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Course</span>
        </Link>
      </div>
    );
  }

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
          <h1 className="text-base font-bold text-zinc-900">
            {activeCourse.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-mono">
            Day {activeCourse.currentDay} of {activeCourse.totalDays}
          </span>
          <span className="text-zinc-300">•</span>
          <div className="flex items-center gap-1 text-xs font-mono text-zinc-700">
            <Flame className="w-3.5 h-3.5 text-zinc-700" />
            <span>{activeCourse.streakDays}d streak</span>
          </div>
        </div>
      </div>

      {/* ── COURSE SWITCHER (If multiple courses exist) ── */}
      {courses.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCourseId(c.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors whitespace-nowrap cursor-pointer",
                c.id === activeCourse.id
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}

      {/* ── DAILY TARGET CARD ── */}
      <div className="bg-white rounded-md border border-zinc-200 p-6 space-y-5 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2 py-0.5 rounded-xs bg-zinc-100 border border-zinc-200 text-[10px] font-mono text-zinc-700">
              Day {activeDay.dayNumber} Focus Topic
            </span>
            <h2 className="text-lg font-bold text-zinc-900 pt-1">
              {activeDay.title}
            </h2>
            <p className="text-xs text-zinc-500 font-mono">
              Estimated study time: {activeDay.durationMinutes} minutes
            </p>
          </div>

          <button
            onClick={() => setIsDaySessionActive(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <span>Start Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Topics Covered */}
        <div className="space-y-2 pt-2 border-t border-zinc-100">
          <h3 className="text-xs font-semibold text-zinc-900 uppercase font-mono tracking-wider">
            Topics in this session
          </h3>
          <ul className="space-y-1.5">
            {activeDay.topicsCovered.map((topic, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 text-xs text-zinc-700"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 shrink-0" />
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
