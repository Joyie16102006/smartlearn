"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Course } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Flame, ArrowRight, Plus, Trash2, Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.courses || []);
        setCourses(list);
      })
      .catch((err) => console.warn("Failed to fetch courses from database:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/courses/${courseToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
        setCourseToDelete(null);
      } else {
        setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
        setCourseToDelete(null);
      }
    } catch (err) {
      console.error("Error deleting course:", err);
      setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
      setCourseToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

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

      {/* ── COURSE-WISE STREAK BADGES ROW (Only if courses exist) ── */}
      {courses.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {courses.map((course) => {
            const isStreakActive = Boolean(
              (course.streakDays && course.streakDays > 0) ||
              course.daysList?.some((d) => d.status === "completed") ||
              course.progressPercentage > 0
            );
            return (
              <div
                key={course.id}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-xs font-mono transition-colors",
                  isStreakActive
                    ? "border-orange-200 bg-orange-50/90 text-orange-950 font-medium"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700"
                )}
              >
                <Flame
                  className={cn(
                    "w-3 h-3 transition-colors",
                    isStreakActive ? "text-orange-500 fill-orange-500" : "text-zinc-400"
                  )}
                />
                <span className="font-semibold text-zinc-900 truncate max-w-[140px]">
                  {course.title}:
                </span>
                <span className={isStreakActive ? "text-orange-800 font-medium" : "text-zinc-600"}>
                  {course.streakDays || 1}d streak
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── COURSES CARDS GRID ── */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
          <span>Loading courses...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-md border border-zinc-200 p-12 text-center space-y-4 max-w-md mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 rounded-sm bg-zinc-100 flex items-center justify-center mx-auto text-zinc-500">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-900">
              No courses created yet
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Add your syllabus, topics, or YouTube/article links to generate your first adaptive AI curriculum and flowchart.
            </p>
          </div>
          <Link
            href="/courses/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Course</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {courses.map((course) => {
            const isStreakActive = Boolean(
              (course.streakDays && course.streakDays > 0) ||
              course.daysList?.some((d) => d.status === "completed") ||
              course.progressPercentage > 0
            );
            return (
              <div
                key={course.id}
                className="relative bg-white rounded-md border border-zinc-200 p-5 flex flex-col justify-between hover:border-zinc-400 transition-colors group min-h-[220px]"
              >
                {/* Top-Left Corner Fold Tag */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-zinc-900" />

                <div className="space-y-3">
                  {/* Header Row: Category & Streak */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                        {course.category?.split("&")[0]?.trim() || "Technical Track"}
                      </span>
                      {/* Course Name */}
                      <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-black transition-colors mt-0.5 leading-snug">
                        {course.title}
                      </h3>
                    </div>

                    {/* Course Streak Badge (Vibrant orange when active) */}
                    <div
                      className={cn(
                        "shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[11px] font-mono transition-colors",
                        isStreakActive
                          ? "border-orange-200 bg-orange-50/90 text-orange-950 font-medium"
                          : "border-zinc-200 bg-zinc-50 text-zinc-700"
                      )}
                    >
                      <Flame
                        className={cn(
                          "w-3 h-3 transition-colors",
                          isStreakActive ? "text-orange-500 fill-orange-500" : "text-zinc-400"
                        )}
                      />
                      <span>{course.streakDays || 1}d</span>
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

              {/* Bottom Action Row: Concept Count + Un-highlighted Delete + Continue */}
              <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">
                  {course.concepts?.length || 0} Concepts
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Un-highlighted Minimalist Trash Icon Button */}
                  <button
                    type="button"
                    onClick={() => setCourseToDelete(course)}
                    className="p-1.5 rounded-sm text-zinc-400 hover:text-red-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                    title="Delete course"
                    aria-label={`Delete ${course.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    href={`/courses/${course.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-2xs"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

          {/* ── BIG [+] ADD COURSE CARD ── */}
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
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {courseToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isDeleting && setCourseToDelete(null)}
        >
          <div
            className="relative bg-white rounded-md border border-zinc-200 shadow-xl max-w-sm w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-sm bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900">
                  Delete this course?
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-zinc-900">
                    "{courseToDelete.title}"
                  </span>
                  ? This will remove its curriculum, flowchart concepts, and learning history.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCourseToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCourse}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-sm shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Course</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
