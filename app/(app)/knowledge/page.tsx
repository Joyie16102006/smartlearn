"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Course, ConceptMastery } from "@/types";
import { MasteryCard } from "@/components/knowledge/MasteryCard";
import { Card } from "@/components/ui/Card";
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Plus,
  Loader2,
} from "lucide-react";

export default function KnowledgeMasteryPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "strong" | "needs-practice" | "weak">("all");

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.courses || []);
        setCourses(list);
      })
      .catch((err) => console.warn("Failed to load courses for mastery:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const allConcepts: ConceptMastery[] = courses.flatMap((c) =>
    (c.concepts || []).map((cn) => {
      let categoryType: "strong" | "needs-practice" | "weak" = "needs-practice";
      if (cn.masteryPercentage >= 80) categoryType = "strong";
      else if (cn.masteryPercentage < 50 && cn.status === "completed") categoryType = "weak";

      return {
        id: cn.id,
        conceptName: cn.name,
        category: c.title,
        masteryPercentage: cn.masteryPercentage || 0,
        categoryType,
        breakdown: {
          mcqScore: cn.masteryPercentage || 0,
          problemSolvingScore: cn.masteryPercentage || 0,
          explanationScore: cn.masteryPercentage || 0,
          weeklyTestScore: cn.masteryPercentage || 0,
        },
        lastReviewedDaysAgo: 1,
        nextReviewDays: 3,
        commonMistakes: [],
        attemptsCount: cn.masteryPercentage > 0 ? 1 : 0,
        confidenceScore: cn.masteryPercentage || 0,
      };
    })
  );

  const filteredConcepts = allConcepts.filter((concept) => {
    if (selectedFilter === "all") return true;
    return concept.categoryType === selectedFilter;
  });

  const strongCount = allConcepts.filter((c) => c.categoryType === "strong").length;
  const needsPracticeCount = allConcepts.filter((c) => c.categoryType === "needs-practice").length;
  const weakCount = allConcepts.filter((c) => c.categoryType === "weak").length;

  const avgMastery =
    allConcepts.length > 0
      ? Math.round(
          allConcepts.reduce((acc, c) => acc + c.masteryPercentage, 0) /
            allConcepts.length
        )
      : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="pb-2 border-b border-zinc-200">
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
          Knowledge & Mastery Health
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Multi-signal concept competency evaluated continuously across MCQs, problem-solving derivations, and retention tests.
        </p>
      </div>

      {/* Global Mastery Index Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Mastery Score */}
        <Card className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">
              Overall Index
            </span>
            <Brain className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900">
              {avgMastery}%
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Weighted cross-curriculum mastery
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 text-[11px] font-mono text-zinc-500">
            <span>{allConcepts.length} concepts tracked</span>
          </div>
        </Card>

        {/* Strong Concepts */}
        <Card className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">
              Mastered
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900">
              {strongCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Concepts at ≥80% mastery
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 text-[11px] font-mono text-emerald-600">
            <span>Verified in quizzes</span>
          </div>
        </Card>

        {/* Needs Practice */}
        <Card className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">
              In Progress
            </span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900">
              {needsPracticeCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              50% - 79% retention index
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 text-[11px] font-mono text-amber-600">
            <span>Scheduled for study</span>
          </div>
        </Card>

        {/* Weak Concepts */}
        <Card className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">
              Flagged Areas
            </span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900">
              {weakCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Concepts with quiz mistakes
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 text-[11px] font-mono text-red-600">
            <span>Adaptive revision active</span>
          </div>
        </Card>
      </div>

      {/* Main Concept Breakdown */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
          <span>Loading concept telemetry...</span>
        </div>
      ) : allConcepts.length === 0 ? (
        <div className="bg-white rounded-md border border-zinc-200 p-12 text-center space-y-3 max-w-md mx-auto shadow-2xs">
          <Brain className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-900">No Concept Data Yet</h3>
          <p className="text-xs text-zinc-500">
            Once you create a course and complete daily quiz checks, your concept mastery health will appear here.
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
            {(["all", "strong", "needs-practice", "weak"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1 text-xs font-medium rounded-xs capitalize transition-colors ${
                  selectedFilter === filter
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {filter === "all" ? "All Concepts" : filter.replace("-", " ")}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConcepts.map((concept) => (
              <MasteryCard key={concept.id} mastery={concept} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
