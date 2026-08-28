"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { mockCourses } from "@/data/mockData";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConceptNode } from "@/types";

interface CourseOverviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CourseOverviewPage({ params }: CourseOverviewPageProps) {
  const resolvedParams = use(params);
  const initialCourse =
    mockCourses.find((c) => c.id === resolvedParams.id) || mockCourses[0];

  const [course, setCourse] = useState(initialCourse);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(course.currentDay);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [isDaySessionActive, setIsDaySessionActive] = useState<boolean>(false);

  React.useEffect(() => {
    fetch(`/api/courses/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.id) {
          setCourse(data);
          setSelectedDayNumber(data.currentDay || 1);
        }
      })
      .catch((err) => console.warn("Failed to load course from DB:", err));
  }, [resolvedParams.id]);

  // Active day object
  const activeDay =
    course.daysList?.find((d) => d.dayNumber === selectedDayNumber) ||
    course.daysList?.[0] || {
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

  // Active concept for right-panel inspector
  const activeConcept: ConceptNode =
    course.concepts.find((c) => c.id === selectedConceptId) ||
    course.concepts.find((c) => c.id === activeDay.conceptId) ||
    course.concepts[0];

  const handleCompleteDay = (dayNum: number, score: number) => {
    setCourse((prev) => {
      const updatedDays = prev.daysList?.map((d) =>
        d.dayNumber === dayNum ? { ...d, status: "completed" as const, quizScore: score } : d
      );
      const matchingDay = prev.daysList?.find((d) => d.dayNumber === dayNum);
      const conceptIdToUpdate = matchingDay?.conceptId;
      const updatedConcepts = prev.concepts.map((c) =>
        c.id === conceptIdToUpdate
          ? { ...c, status: "completed" as const, masteryPercentage: Math.max(c.masteryPercentage, score) }
          : c
      );
      return {
        ...prev,
        daysList: updatedDays,
        concepts: updatedConcepts,
        progressPercentage: Math.min(100, prev.progressPercentage + 3),
      };
    });
  };

  // Open Day session when tapping any day (especially today's highlighted one)
  const handleDayClick = (dayNumber: number) => {
    setSelectedDayNumber(dayNumber);
    setIsDaySessionActive(true);
  };

  // Day session is fixed-position overlay (handled by DayLearningView itself)
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

  // ── COURSE DASHBOARD: fixed overlay, 3 independent scrollable panels ──
  return (
    <div className="fixed inset-0 left-56 flex flex-col bg-zinc-50 z-30">

      {/* ── FIXED TOP HEADER BAR ── */}
      <div className="flex-none flex items-center justify-between gap-4 px-5 py-3 bg-white border-b border-zinc-200">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
          <div className="h-4 w-px bg-zinc-200 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block leading-none">
              Course Dashboard
            </span>
            <h1 className="text-sm font-bold text-zinc-900 leading-tight truncate">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-800">
            <Flame className="w-3.5 h-3.5 text-zinc-700" />
            <span>{course.streakDays || 7}d streak</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 border border-zinc-900 bg-zinc-900 text-xs font-mono text-white">
            <Calendar className="w-3.5 h-3.5" />
            <span>Day {course.currentDay} of {course.totalDays}</span>
          </div>
          <button
            onClick={() => {
              setSelectedDayNumber(course.currentDay);
              setIsDaySessionActive(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Launch Day {course.currentDay}</span>
          </button>
        </div>
      </div>

      {/* ── 3-PANEL BODY (fills remaining height, each scrolls independently) ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANEL: Day-Wise Schedule ── */}
        <div className="w-64 flex-none flex flex-col overflow-y-auto border-r border-zinc-200 bg-white">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900">Day-Wise Schedule</span>
              <span className="text-[10px] font-mono text-zinc-400">{course.totalDays} Days</span>
            </div>

            <div className="space-y-1">
              {course.daysList?.map((d) => {
                const isCompleted = d.status === "completed";
                const isToday = d.dayNumber === course.currentDay;
                const isSelected = selectedDayNumber === d.dayNumber;

                return (
                  <button
                    key={d.dayNumber}
                    onClick={() => handleDayClick(d.dayNumber)}
                    className={cn(
                      "w-full text-left px-2.5 py-2 border text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer",
                      isToday
                        ? "bg-zinc-900 text-white border-zinc-900 font-medium"
                        : isSelected
                        ? "bg-zinc-100 border-zinc-400 text-zinc-950 font-semibold"
                        : isCompleted
                        ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 hover:bg-emerald-50"
                        : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : isToday ? (
                        <div className="w-2 h-2 rounded-full bg-white shrink-0 animate-ping" />
                      ) : (
                        <Lock className="w-3 h-3 text-zinc-300 shrink-0" />
                      )}
                      <span className="truncate text-[11px]">
                        {d.dayNumber}: {d.title.split(":")[0].replace(/^Day\s+\d+:\s*/, "")}
                      </span>
                    </div>

                    {isCompleted && d.quizScore ? (
                      <span className="font-mono text-[10px] shrink-0 font-semibold opacity-80">
                        {d.quizScore}%
                      </span>
                    ) : isToday ? (
                      <span className="text-[9px] font-mono uppercase bg-white text-zinc-900 px-1 py-0.5 shrink-0 font-bold">
                        TODAY
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MIDDLE PANEL: Flowchart + Today Breakdown ── */}
        <div className="flex-1 overflow-y-auto bg-zinc-50/40">
          <div className="p-5 space-y-4">

            {/* NotebookLM-Style Concept Flowchart */}
            <CourseFlowchart
              concepts={course.concepts}
              onSelectConcept={(concept) => setSelectedConceptId(concept.id)}
              onEnterDay={(dayNum) => {
                setSelectedDayNumber(dayNum);
                setIsDaySessionActive(true);
              }}
              selectedConceptId={selectedConceptId}
            />

            {/* Today's Session Breakdown */}
            <div className="bg-white border border-zinc-200 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                    Today's Session Breakdown
                  </span>
                  <h3 className="text-xs font-semibold text-zinc-900 mt-0.5">
                    Day {activeDay.dayNumber}: {activeDay.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsDaySessionActive(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Open Work</span>
                </button>
              </div>
              <div className="space-y-1.5">
                {activeDay.topicsCovered.map((topic, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 font-mono flex items-start gap-2"
                  >
                    <span className="text-zinc-400 font-bold shrink-0">0{idx + 1}.</span>
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── RIGHT PANEL: Concept Details + Topic Mastery ── */}
        <div className="w-64 flex-none flex flex-col overflow-y-auto border-l border-zinc-200 bg-white">
          <div className="p-4 space-y-4">

            {/* Concept Details Inspector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-xs font-semibold text-zinc-900">Concept Details</span>
                <span className="text-[10px] font-mono text-zinc-400">{activeConcept.difficulty}</span>
              </div>

              <h4 className="text-xs font-bold text-zinc-900">{activeConcept.name}</h4>
              <p className="text-[11px] text-zinc-600 leading-relaxed">{activeConcept.description}</p>

              {activeConcept.keyFormulas && activeConcept.keyFormulas.length > 0 && (
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 space-y-1">
                  <span className="text-[9px] font-mono uppercase text-zinc-400 block font-semibold">
                    Key Formula:
                  </span>
                  <div className="font-mono text-[11px] text-zinc-900 break-all">
                    {activeConcept.keyFormulas[0]}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-100" />

            {/* Topic Mastery Scores */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">Topic Mastery Scores</span>
                <Brain className="w-3.5 h-3.5 text-zinc-400" />
              </div>

              <div className="space-y-2">
                {course.concepts.map((concept) => {
                  const isMastered = concept.status === "completed";
                  const isSelected = activeConcept.id === concept.id;

                  return (
                    <div
                      key={concept.id}
                      onClick={() => setSelectedConceptId(concept.id)}
                      className={cn(
                        "p-2.5 border transition-colors cursor-pointer space-y-1",
                        isSelected
                          ? "bg-zinc-100 border-zinc-400"
                          : isMastered
                          ? "bg-emerald-50/50 border-emerald-300"
                          : "bg-white border-zinc-200 hover:border-zinc-300"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-900 truncate pr-1 text-[11px]">
                          {concept.name}
                        </span>
                        <span className={cn(
                          "font-mono text-[10px] font-semibold shrink-0",
                          isMastered ? "text-emerald-700" : "text-zinc-600"
                        )}>
                          {concept.masteryPercentage}%
                        </span>
                      </div>
                      <ProgressBar value={concept.masteryPercentage} size="sm" color="neutral" />
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
