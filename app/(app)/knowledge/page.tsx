"use client";

import React, { useState } from "react";
import { mockConceptMasteryList, mockMistakeLogs, mockUserProfile } from "@/data/mockData";
import { MasteryCard } from "@/components/knowledge/MasteryCard";
import { MistakeCard } from "@/components/knowledge/MistakeCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from "lucide-react";

export default function KnowledgeMasteryPage() {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "strong" | "needs-practice" | "weak">("all");

  const filteredConcepts = mockConceptMasteryList.filter((concept) => {
    if (selectedFilter === "all") return true;
    return concept.categoryType === selectedFilter;
  });

  const strongCount = mockConceptMasteryList.filter((c) => c.categoryType === "strong").length;
  const needsPracticeCount = mockConceptMasteryList.filter((c) => c.categoryType === "needs-practice").length;
  const weakCount = mockConceptMasteryList.filter((c) => c.categoryType === "weak").length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
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
            <Brain className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900 dark:text-zinc-100">
              {mockUserProfile.overallMasteryPercentage}%
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Weighted cross-curriculum mastery
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-500">
            <span>+4.2% velocity this week</span>
          </div>
        </Card>

        {/* Strong Concepts */}
        <Card
          onClick={() => setSelectedFilter("strong")}
          className={`cursor-pointer transition-colors p-4 flex flex-col justify-between space-y-3 ${
            selectedFilter === "strong" ? "border-zinc-900 dark:border-zinc-100" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">High Mastery</span>
            <CheckCircle2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900 dark:text-zinc-100">
              {strongCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Concepts &ge; 80% Mastery</p>
          </div>
          <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">Stable Retention</span>
        </Card>

        {/* Needs Practice */}
        <Card
          onClick={() => setSelectedFilter("needs-practice")}
          className={`cursor-pointer transition-colors p-4 flex flex-col justify-between space-y-3 ${
            selectedFilter === "needs-practice" ? "border-zinc-900 dark:border-zinc-100" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">In Progress</span>
            <Activity className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900 dark:text-zinc-100">
              {needsPracticeCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Concepts 50% – 79%</p>
          </div>
          <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">Active Formative Stage</span>
        </Card>

        {/* Weak Concepts */}
        <Card
          onClick={() => setSelectedFilter("weak")}
          className={`cursor-pointer transition-colors p-4 flex flex-col justify-between space-y-3 ${
            selectedFilter === "weak" ? "border-zinc-900 dark:border-zinc-100" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">Needs Revision</span>
            <AlertTriangle className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900 dark:text-zinc-100">
              {weakCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Concepts &lt; 50% Mastery</p>
          </div>
          <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">Revision Queued</span>
        </Card>
      </div>

      {/* Concept Mastery Breakdown Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Concept Mastery Breakdown
            </h2>
            <p className="text-xs text-zinc-500">
              Deterministic scoring: 20% MCQ + 30% Problem Solving + 20% Derivations + 30% Weekly Assessment
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5">
            {(["all", "strong", "needs-practice", "weak"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  selectedFilter === filter
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                }`}
              >
                {filter === "all" ? "All Concepts" : filter.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConcepts.map((concept) => (
            <MasteryCard key={concept.id} mastery={concept} />
          ))}
        </div>
      </div>

      {/* Recent Mistake & Cognitive Misconception Diagnostics */}
      <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Cognitive Mistake Diagnostics Log
          </h2>
          <p className="text-xs text-zinc-500">
            Root-cause misconception analysis used to update prerequisite pathways automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockMistakeLogs.map((mistake) => (
            <MistakeCard key={mistake.id} mistake={mistake} />
          ))}
        </div>
      </div>
    </div>
  );
}
