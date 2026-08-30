"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Course, AssessmentResult } from "@/types";
import { AssessmentCard } from "@/components/assessments/AssessmentCard";
import { Card } from "@/components/ui/Card";
import { Award, CheckCircle2, Calendar, Plus, Loader2 } from "lucide-react";

export default function AssessmentsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "weekly" | "daily">("all");

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.courses || []);
        setCourses(list);
      })
      .catch((err) => console.warn("Failed to load courses for assessments:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const assessments: AssessmentResult[] = courses.flatMap((c) =>
    (c.daysList || [])
      .filter((d) => d.quizScore !== undefined && d.quizScore !== null)
      .map((d) => ({
        id: `quiz-${c.id}-${d.dayNumber}`,
        title: `Day ${d.dayNumber} Mastery Assessment`,
        type: "daily" as const,
        courseTitle: c.title,
        completedAt: "Completed",
        scorePercentage: d.quizScore || 0,
        totalQuestions: 3,
        correctAnswers: Math.round(((d.quizScore || 0) / 100) * 3),
        strongConcept: d.title,
        weakConcept: d.mistakeConcept || "None",
        improvementDeltaPercentage: 5,
        timeSpentMinutes: 5,
      }))
  );

  const filteredAssessments = assessments.filter((test) => {
    if (activeTab === "all") return true;
    return test.type === activeTab;
  });

  const completedCount = assessments.length;
  const avgScore =
    assessments.length > 0
      ? Math.round(
          assessments.reduce((acc, a) => acc + a.scorePercentage, 0) / assessments.length
        )
      : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="pb-2 border-b border-zinc-200">
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
          Assessments & Diagnostic Tests
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Formative daily check-ins, multi-topic weekly milestone tests, and longitudinal retention tracking.
        </p>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">
              Benchmark Average
            </span>
            <Award className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900">
              {avgScore}%
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Average across completed quiz checks
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 text-[11px] font-mono text-zinc-500">
            <span>{completedCount} assessments graded</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">
              Quizzes Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900">
              {completedCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Formative evaluation checkpoints
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 text-[11px] font-mono text-emerald-600">
            <span>Adaptive grading active</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">
              Upcoming Checkpoints
            </span>
            <Calendar className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900">
              {courses.length > 0 ? "Daily" : "None"}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              End-of-day knowledge checks
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 text-[11px] font-mono text-zinc-500">
            <span>Scheduled with daily sessions</span>
          </div>
        </Card>
      </div>

      {/* Main Assessment List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
          <span>Loading assessments...</span>
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-md border border-zinc-200 p-12 text-center space-y-3 max-w-md mx-auto shadow-2xs">
          <Award className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-900">
            No Assessments Completed Yet
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            When you complete daily lesson sessions and answer end-of-day quizzes, your graded diagnostics and mistake revisions will appear here.
          </p>
          <Link
            href="/courses/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
            {(["all", "daily", "weekly"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-xs capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {tab === "all" ? "All Tests" : `${tab} Quizzes`}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredAssessments.map((test) => (
              <AssessmentCard key={test.id} assessment={test} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
