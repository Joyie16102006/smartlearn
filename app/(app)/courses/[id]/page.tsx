"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { CourseFlowchart } from "@/components/courses/CourseFlowchart";
import { DayLearningView } from "@/components/learning/DayLearningView";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Flame,
  Brain,
  Play,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Course, ConceptNode, DayPlan } from "@/types";
import { useSidebar } from "@/components/layout/SidebarContext";

interface CourseOverviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CourseOverviewPage({ params }: CourseOverviewPageProps) {
  const resolvedParams = use(params);
  const { isCollapsed } = useSidebar();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [isDaySessionActive, setIsDaySessionActive] = useState<boolean>(false);

  useEffect(() => {
    fetch(`/api/courses/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.id) {
          setCourse(data);
          setSelectedDayNumber(data.currentDay || 1);
        }
      })
      .catch((err) => console.warn("Failed to load course from DB:", err))
      .finally(() => setIsLoading(false));
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-50 z-30">
        <div className="text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-800 mx-auto" />
          <p className="text-xs text-zinc-500 font-mono">Loading course curriculum & flowchart...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto my-20 bg-white rounded-md border border-zinc-200 p-8 text-center space-y-4 shadow-2xs">
        <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-900">Course Not Found</h2>
          <p className="text-xs text-zinc-500">The requested course does not exist or has been deleted.</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  // Active day object
  const activeDay: DayPlan =
    course.daysList?.find((d) => d.dayNumber === selectedDayNumber) ||
    course.daysList?.[0] || {
      dayNumber: 1,
      title: "Course Foundations",
      conceptId: course.concepts?.[0]?.id || "c-1",
      status: "current" as const,
      topicsCovered: ["Fundamental Core Principles"],
      durationMinutes: 60,
    };

  // Active concept for right-panel inspector
  const activeConcept: ConceptNode | undefined =
    course.concepts?.find((c) => c.id === selectedConceptId) ||
    course.concepts?.find((c) => c.id === activeDay.conceptId) ||
    course.concepts?.[0];

  const handleCompleteDay = (dayNum: number, score: number) => {
    setCourse((prev) => {
      if (!prev) return prev;
      const updatedDays = prev.daysList?.map((d) =>
        d.dayNumber === dayNum ? { ...d, status: "completed" as const, quizScore: score } : d
      );
      const matchingDay = prev.daysList?.find((d) => d.dayNumber === dayNum);
      const conceptIdToUpdate = matchingDay?.conceptId;
      const updatedConcepts = prev.concepts?.map((c) =>
        c.id === conceptIdToUpdate
          ? { ...c, status: "completed" as const, masteryPercentage: Math.max(c.masteryPercentage, score) }
          : c
      );
      return {
        ...prev,
        daysList: updatedDays || [],
        concepts: updatedConcepts || [],
        progressPercentage: Math.min(100, prev.progressPercentage + 3),
      };
    });
  };

  const handleDayClick = (dayNumber: number) => {
    setSelectedDayNumber(dayNumber);
    setIsDaySessionActive(true);
  };

  if (isDaySessionActive) {
    return (
      <DayLearningView
        day={activeDay}
        courseId={course.id}
        courseTitle={course.title}
        totalDays={course.totalDays}
        streakDays={course.streakDays}
        onCompleteDay={handleCompleteDay}
        onBack={() => setIsDaySessionActive(false)}
      />
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 flex flex-col bg-zinc-50 z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "left-14" : "left-56"
      )}
    >
      {/* ── FIXED TOP HEADER BAR ── */}
      <div className="flex-none flex items-center justify-between gap-4 px-5 py-3 bg-white border-b border-zinc-200">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block leading-none">
              Course Dashboard
            </span>
            <h1 className="text-sm font-bold text-zinc-900 leading-tight truncate">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Progress bar glance */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-500">
              Day {course.currentDay} of {course.totalDays}
            </span>
            <div className="w-24">
              <ProgressBar
                value={course.progressPercentage}
                size="sm"
                color="neutral"
              />
            </div>
            <span className="text-xs font-mono font-semibold text-zinc-900">
              {course.progressPercentage}%
            </span>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => handleDayClick(course.currentDay)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Day {course.currentDay}</span>
          </button>
        </div>
      </div>

      {/* ── 3-COLUMN MAIN BODY ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* ── LEFT PANEL: 30-Day Schedule Outline ── */}
        <div className="w-72 flex-none border-r border-zinc-200 bg-white flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-900 uppercase font-mono tracking-wider">
              Curriculum Schedule
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">
              {course.totalDays} Days
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {course.daysList?.map((day) => {
              const isSelected = day.dayNumber === selectedDayNumber;
              const isCurrent = day.dayNumber === course.currentDay;
              const isCompleted = day.status === "completed";

              return (
                <button
                  key={day.dayNumber}
                  onClick={() => {
                    setSelectedDayNumber(day.dayNumber);
                    setSelectedConceptId(day.conceptId);
                  }}
                  className={cn(
                    "w-full text-left p-2.5 rounded-sm transition-colors flex items-start gap-2.5 cursor-pointer",
                    isSelected
                      ? "bg-zinc-900 text-white shadow-2xs"
                      : "hover:bg-zinc-100 text-zinc-800"
                  )}
                >
                  <div className="pt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2
                        className={cn(
                          "w-3.5 h-3.5",
                          isSelected ? "text-white" : "text-emerald-600"
                        )}
                      />
                    ) : isCurrent ? (
                      <div
                        className={cn(
                          "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "border-white" : "border-zinc-900"
                        )}
                      >
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isSelected ? "bg-white" : "bg-zinc-900"
                          )}
                        />
                      </div>
                    ) : (
                      <Lock
                        className={cn(
                          "w-3.5 h-3.5",
                          isSelected ? "text-zinc-300" : "text-zinc-400"
                        )}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-[10px] font-mono",
                          isSelected ? "text-zinc-300" : "text-zinc-400"
                        )}
                      >
                        Day {day.dayNumber}
                      </span>
                      {day.quizScore && (
                        <span
                          className={cn(
                            "text-[10px] font-mono font-semibold",
                            isSelected ? "text-emerald-300" : "text-emerald-600"
                          )}
                        >
                          {day.quizScore}%
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-xs font-medium truncate",
                        isSelected ? "text-white" : "text-zinc-900"
                      )}
                    >
                      {day.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CENTER PANEL: Interactive DAG Flowchart ── */}
        <div className="flex-1 bg-zinc-50 flex flex-col overflow-hidden relative">
          <div className="p-3 border-b border-zinc-200 bg-white/70 backdrop-blur-xs flex items-center justify-between z-10">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900">
                Knowledge Dependency DAG
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Click concept nodes to inspect formulas, mastery, and topics
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-zinc-100 border border-zinc-200 text-zinc-700">
              {course.concepts?.length || 0} Connected Concepts
            </span>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <CourseFlowchart
              concepts={course.concepts || []}
              selectedConceptId={selectedConceptId}
              onSelectConcept={(concept) => {
                setSelectedConceptId(concept.id);
                if (concept.dayAssigned) {
                  setSelectedDayNumber(concept.dayAssigned);
                }
              }}
            />
          </div>
        </div>

        {/* ── RIGHT PANEL: Concept & Lesson Inspector ── */}
        <div className="w-80 flex-none border-l border-zinc-200 bg-white flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-900 uppercase font-mono tracking-wider">
              Concept Detail
            </h2>
            {activeConcept && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-zinc-100 text-zinc-600">
                {activeConcept.difficulty || "Intermediate"}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeConcept ? (
              <>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-900">
                    {activeConcept.name}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {activeConcept.description}
                  </p>
                </div>

                {/* Mastery Level */}
                <div className="p-3 bg-zinc-50 rounded-sm border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 font-medium">Concept Mastery</span>
                    <span className="font-mono font-bold text-zinc-900">
                      {activeConcept.masteryPercentage || 0}%
                    </span>
                  </div>
                  <ProgressBar
                    value={activeConcept.masteryPercentage || 0}
                    size="sm"
                    color="neutral"
                  />
                </div>

                {/* Key Formulas */}
                {activeConcept.keyFormulas && activeConcept.keyFormulas.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono uppercase text-zinc-400 block">
                      Key Mathematical Formulas
                    </span>
                    <div className="space-y-1">
                      {activeConcept.keyFormulas.map((f, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-sm bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto"
                        >
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Start Day Button */}
                <button
                  onClick={() => handleDayClick(activeDay.dayNumber)}
                  className="w-full py-2 px-3 rounded-sm bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Day {activeDay.dayNumber} Session</span>
                </button>
              </>
            ) : (
              <div className="text-center py-10 text-xs text-zinc-400 font-mono">
                Select a concept or day to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
