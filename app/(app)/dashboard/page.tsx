"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Course } from "@/types";
import { mockCourses } from "@/data/mockData";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Flame, ArrowRight, Plus } from "lucide-react";

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
        }
      })
      .catch((err) => console.warn("Failed to fetch courses from database:", err));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* ── TOP TITLE & [+ ADD COURSE] ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
            Courses
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Active learning tracks & course-specific daily streaks
          </p>
        </div>

        <Link
          href="/courses/new"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Course</span>
        </Link>
      </div>

      {/* ── COURSE-WISE STREAK BADGES ROW (Clean, Professional & Sharp) ── */}
      <div className="flex flex-wrap items-center gap-2">
        {courses.map((course) => (
          <div
            key={course.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-zinc-200 bg-zinc-50 text-xs text-zinc-700 font-mono"
          >
            <Flame className="w-3 h-3 text-zinc-600" />
            <span className="font-semibold text-zinc-900 truncate max-w-[140px]">
              {course.title}:
            </span>
            <span className="text-zinc-600">
              {course.streakDays || 7}d streak
            </span>
          </div>
        ))}
      </div>

      {/* ── COURSES CARDS GRID (Sharp, Clean & Professional) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        {courses.map((course) => (
          <div
            key={course.id}
            className="relative bg-white rounded-md border border-zinc-200 p-5 flex flex-col justify-between hover:border-zinc-400 transition-colors group min-h-[220px]"
          >
            {/* Top-Left Corner Fold Tag (Sharp minimalist fold) */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-zinc-900" />

            <div className="space-y-3">
              {/* Header Row: Category & Streak */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                    {course.category.split("&")[0].trim()}
                  </span>
                  {/* Course Name */}
                  <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-black transition-colors mt-0.5 leading-snug">
                    {course.title}
                  </h3>
                </div>

                {/* Course Streak Badge */}
                <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-xs border border-zinc-200 bg-zinc-50 text-[11px] font-mono text-zinc-700">
                  <Flame className="w-3 h-3 text-zinc-600" />
                  <span>{course.streakDays || 7}d</span>
                </div>
              </div>

              {/* Course Goal */}
              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                {course.goal}
              </p>

              {/* Progress Section */}
              <div className="bg-zinc-50 rounded-sm p-3 space-y-1.5 border border-zinc-200/60">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-600 font-medium">
                    Day {course.currentDay} of {course.totalDays}
                  </span>
                  <span className="font-mono font-semibold text-zinc-900">
                    {course.progressPercentage}% Complete
                  </span>
                </div>
                <ProgressBar
                  value={course.progressPercentage}
                  size="sm"
                  color="neutral"
                />
              </div>
            </div>

            {/* Continue Action Button */}
            <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400">
                {course.concepts.length} Concepts
              </span>

              <Link
                href={`/courses/${course.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-2xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}

        {/* ── BIG [+] ADD COURSE CARD (Sharp, Minimalist) ── */}
        <Link
          href="/courses/new"
          className="bg-zinc-50/50 hover:bg-zinc-100/60 rounded-md border border-dashed border-zinc-300 hover:border-zinc-900 transition-colors p-6 flex flex-col items-center justify-center gap-2.5 min-h-[220px] group cursor-pointer text-center"
        >
          <div className="w-10 h-10 rounded-sm bg-white border border-zinc-200 group-hover:border-zinc-900 flex items-center justify-center text-zinc-500 group-hover:text-zinc-900 transition-colors shadow-2xs">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-800 group-hover:text-zinc-950 transition-colors block">
              Add Course
            </span>
            <span className="text-[11px] text-zinc-400 mt-0.5 block font-mono">
              Build curriculum & flowchart
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
