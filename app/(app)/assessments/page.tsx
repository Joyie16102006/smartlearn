"use client";

import React, { useState } from "react";
import { mockAssessments } from "@/data/mockData";
import { AssessmentCard } from "@/components/assessments/AssessmentCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Award, CheckCircle2, Calendar } from "lucide-react";

export default function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "weekly" | "daily">("all");

  const filteredAssessments = mockAssessments.filter((test) => {
    if (activeTab === "all") return true;
    return test.type === activeTab;
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Assessments & Diagnostic Tests
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Formative daily check-ins, multi-topic weekly milestone tests, and longitudinal retention tracking.
        </p>
      </div>

      {/* Hero Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">
              Benchmark Average
            </span>
            <Award className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900 dark:text-zinc-100">82.0%</div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Top 15% mastery velocity across active cohorts
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-500">
            <span>+10% retention month-over-month</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">Quizzes Completed</span>
            <CheckCircle2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900 dark:text-zinc-100">
              7 / 8
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">87.5% completion rate</p>
          </div>
          <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">Daily Streak Maintained</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">Next Milestone</span>
            <Calendar className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-zinc-900 dark:text-zinc-100">
              In 4 Days
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Weekly Test #3 (Sequential Logic)</p>
          </div>
          <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">20 Questions • 30 mins</span>
        </Card>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-1.5">
          {(["all", "weekly", "daily"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
              }`}
            >
              {tab === "all" ? "All Assessments" : `${tab} Tests`}
            </button>
          ))}
        </div>
      </div>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssessments.map((assessment) => (
          <AssessmentCard key={assessment.id} assessment={assessment} />
        ))}
      </div>
    </div>
  );
}
