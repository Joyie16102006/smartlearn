"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { DayPlan } from "@/types";
import { ExplanationData } from "@/types/explanation";
import { getExplanationById } from "@/data/mockExplanations";
import { ExplainButton } from "@/components/learning/ExplainButton";
import { ExplanationModal } from "@/components/learning/ExplanationModal";
import { LectureRenderer } from "@/components/learning/LectureRenderer";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  ArrowLeft,
  Check,
  Loader2,
  Flame,
  Clock,
  RotateCcw,
  ListChecks,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/SidebarContext";

interface DayLearningViewProps {
  day: DayPlan;
  courseId?: string;
  courseTitle: string;
  totalDays?: number;
  streakDays?: number;
  onCompleteDay: (dayNumber: number, quizScore: number) => void;
  onBack: () => void;
}

interface DynamicQuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface RevisionCardState {
  title: string;
  summary: string;
  keyFormulas: string[];
  keyPoints: string[];
  mistakeTip?: string;
}

export const DayLearningView: React.FC<DayLearningViewProps> = ({
  day,
  courseId = "digital-electronics",
  courseTitle,
  totalDays = 30,
  streakDays = 7,
  onCompleteDay,
  onBack,
}) => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [selectedExplanation, setSelectedExplanation] = useState<ExplanationData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(day.quizScore || null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionData, setRevisionData] = useState<RevisionCardState | null>(null);
  const [checkedTopics, setCheckedTopics] = useState<Record<number, boolean>>({ 0: true });

  // Markdown content from database / AI
  const [lectureMarkdown, setLectureMarkdown] = useState<string>("");
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoadingLecture, setIsLoadingLecture] = useState(true);

  const [quizId, setQuizId] = useState<string>("");
  const [quizQuestions, setQuizQuestions] = useState<DynamicQuizQuestion[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  const quizRef = useRef<HTMLDivElement>(null);

  // Fetch versioned lesson from database
  const fetchLesson = useCallback(async (version?: number) => {
    setIsLoadingLecture(true);
    try {
      const url = version
        ? `/api/courses/${courseId}/days/${day.dayNumber}/lesson?v=${version}`
        : `/api/courses/${courseId}/days/${day.dayNumber}/lesson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.markdownContent) {
        setLectureMarkdown(data.markdownContent);
        setCurrentVersion(data.versionNumber || 1);
      }
    } catch (err) {
      console.error("Failed to load lesson:", err);
    } finally {
      setIsLoadingLecture(false);
    }
  }, [courseId, day.dayNumber]);

  // Regenerate new lesson version
  const handleRegenerateLesson = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/days/${day.dayNumber}/lesson`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.markdownContent) {
        setLectureMarkdown(data.markdownContent);
        setCurrentVersion(data.versionNumber);
      }
    } catch (err) {
      console.error("Failed to regenerate lesson:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Fetch quiz questions from database
  const fetchQuiz = useCallback(async () => {
    setIsLoadingQuiz(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/days/${day.dayNumber}/quiz`);
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuizId(data.quizId);
        setQuizQuestions(data.questions);
      }
    } catch (err) {
      console.error("Failed to load quiz:", err);
    } finally {
      setIsLoadingQuiz(false);
    }
  }, [courseId, day.dayNumber]);

  // Fetch revision card from database
  const fetchRevision = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/days/${day.dayNumber}/revision`);
      const data = await res.json();
      if (data.title) {
        setRevisionData(data);
      }
    } catch (err) {
      console.error("Failed to load revision:", err);
    }
  }, [courseId, day.dayNumber]);

  useEffect(() => {
    fetchLesson();
    fetchQuiz();
    fetchRevision();
    setQuizAnswers({});
    setQuizSubmitted(day.status === "completed");
    setQuizScore(day.quizScore || null);
    setCheckedTopics({ 0: true });
  }, [day.dayNumber, fetchLesson, fetchQuiz, fetchRevision]);

  const handleOpenExplain = async (conceptOrId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const mock = getExplanationById(conceptOrId);
    if (mock) {
      setSelectedExplanation(mock);
      setIsModalOpen(true);
      return;
    }
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: conceptOrId,
          context: `Day ${day.dayNumber}: ${day.title}`,
          courseTitle,
        }),
      });
      const data = await res.json();
      if (data.simpleExplanation) {
        setSelectedExplanation({
          id: `dyn-${Date.now()}`,
          title: `Concept Breakdown: ${conceptOrId.substring(0, 50)}`,
          simpleExplanation: data.simpleExplanation,
          example: data.example,
          formulaOrDiagram: data.keyFormula || undefined,
          deeperExplanation: {
            breakdown: data.tip || "",
            keyTakeaways: [data.tip || ""],
          },
        });
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch explanation:", err);
    }
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizId || isSubmittingQuiz) return;
    setIsSubmittingQuiz(true);

    try {
      const res = await fetch(`/api/courses/${courseId}/days/${day.dayNumber}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId,
          answers: quizAnswers,
        }),
      });
      const data = await res.json();
      if (data.scorePercentage !== undefined) {
        setQuizScore(data.scorePercentage);
        setQuizSubmitted(true);
        onCompleteDay(day.dayNumber, data.scorePercentage);
      }
    } catch (err) {
      console.error("Failed to submit quiz:", err);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const toggleTopicCheck = (idx: number) =>
    setCheckedTopics((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div
      className={cn(
        "fixed inset-0 flex flex-col bg-zinc-50 z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "left-0" : "left-56"
      )}
    >
      {/* ── FIXED TOP HEADER ── */}
      <div className="flex-none flex items-center justify-between gap-4 px-5 py-3 bg-white border-b border-zinc-200">
        <div className="flex items-center gap-2.5 min-w-0">
          {isCollapsed && (
            <>
              <button
                onClick={toggleSidebar}
                title="Open SmartLearn Sidebar"
                className="flex items-center gap-2 text-xs font-semibold text-zinc-900 hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-xs bg-zinc-900 flex items-center justify-center text-white font-bold text-[10px] shadow-2xs">
                  SL
                </div>
                <span className="font-semibold text-xs tracking-tight text-zinc-900">
                  SmartLearn
                </span>
              </button>
              <div className="h-4 w-px bg-zinc-200 shrink-0 mx-1" />
            </>
          )}

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="h-4 w-px bg-zinc-200 shrink-0 mx-1" />
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block leading-none">{courseTitle}</span>
            <h1 className="text-sm font-bold text-zinc-900 leading-tight truncate">
              Day {day.dayNumber}: {day.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-800">
            <Flame className="w-3.5 h-3.5 text-zinc-700" />
            <span>{streakDays}d streak</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 border border-zinc-900 bg-zinc-900 text-xs font-mono text-white">
            <Clock className="w-3.5 h-3.5" />
            <span>{day.durationMinutes || 60}m Session</span>
          </div>
          <button
            onClick={() => quizRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="px-2.5 py-1 border border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-xs font-medium text-zinc-800 transition-colors cursor-pointer"
          >
            Take Quiz
          </button>
        </div>
      </div>

      {/* ── 3-PANEL BODY ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT PANEL */}
        <div className="w-56 flex-none flex flex-col overflow-y-auto border-r border-zinc-200 bg-white">
          <div className="p-4 space-y-4">

            {/* Course Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">Course Progress</span>
                <span className="text-[10px] font-mono text-zinc-500">{day.dayNumber}/{totalDays}</span>
              </div>
              <ProgressBar value={(day.dayNumber / totalDays) * 100} size="sm" color="neutral" />
              <p className="text-[10px] font-mono text-zinc-500">
                {Math.round((day.dayNumber / totalDays) * 100)}% Complete
              </p>
              {day.status === "completed" && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Score: {quizScore || 85}% ✓</span>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-100" />

            {/* Source Video */}
            {day.sourceLink && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">Source Reference</span>
                <p className="text-[11px] text-zinc-900 font-medium leading-snug line-clamp-2">{day.sourceLink.title}</p>
                <a
                  href={day.sourceLink.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-800 hover:underline"
                >
                  Watch ({day.sourceLink.duration})
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="border-t border-zinc-100" />

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => quizRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Take Quiz</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowRevisionModal(true)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-medium transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Revise Quickly</span>
                </div>
                <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5">5m</span>
              </button>
            </div>

          </div>
        </div>

        {/* ── MIDDLE PANEL: AI Lecture Renderer ── */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-2xl mx-auto px-8 py-7 space-y-6">

            {/* Header badge & Version info */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-[10px] font-mono font-semibold text-zinc-700">
                  <Sparkles className="w-3 h-3" />
                  Lecture Workspace
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  Version {currentVersion}
                </span>
                {day.status === "completed" && (
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold">
                    Mastered ✓
                  </span>
                )}
              </div>

              {/* Regenerate Version Button */}
              <button
                onClick={handleRegenerateLesson}
                disabled={isRegenerating}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
                title="Generate a new version of this lesson"
              >
                <RefreshCw className={cn("w-3 h-3", isRegenerating && "animate-spin")} />
                <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
              </button>
            </div>

            {/* ── Content Area ── */}
            {isLoadingLecture ? (
              <div className="space-y-3 py-8 animate-pulse">
                <div className="h-4 bg-zinc-100 w-3/5" />
                <div className="h-3.5 bg-zinc-100 w-full" />
                <div className="h-3.5 bg-zinc-100 w-5/6" />
                <div className="h-3.5 bg-zinc-100 w-4/5" />
                <div className="h-20 bg-zinc-100" />
                <div className="h-3.5 bg-zinc-100 w-2/3" />
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 pt-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />
                  <span>Loading lecture workspace from database…</span>
                </div>
              </div>
            ) : (
              <LectureRenderer
                content={lectureMarkdown}
                onExplain={(text) => handleOpenExplain(text)}
              />
            )}

            {/* ── End of Day Diagnostic Quiz ── */}
            <div ref={quizRef} className="border-t border-zinc-200 pt-6 space-y-4">
              <div className="space-y-1">
                <div className="inline-flex items-center px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-[10px] font-mono font-semibold text-zinc-800">
                  Diagnostic Mastery Quiz · Day {day.dayNumber}
                </div>
                <h3 className="text-sm font-bold text-zinc-900 mt-1.5">Verify Understanding</h3>
                <p className="text-[11px] text-zinc-500">
                  Scoring ≥70% marks this concept node <strong>green</strong> on your curriculum flowchart.
                </p>
              </div>

              {isLoadingQuiz ? (
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 py-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />
                  <span>Loading diagnostic questions from database…</span>
                </div>
              ) : quizQuestions.length === 0 ? (
                <div className="py-6 text-center text-[11px] font-mono text-zinc-400">
                  Quiz not available for this session.
                </div>
              ) : (
                <form onSubmit={handleSubmitQuiz} className="space-y-4">
                  {quizQuestions.map((q, idx) => (
                    <div key={q.id} className="p-3.5 bg-zinc-50 border border-zinc-200 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-zinc-900">Q{idx + 1}. {q.questionText}</h4>
                        <ExplainButton
                          onClick={(e) => handleOpenExplain(q.questionText, e)}
                          label="Hint"
                          variant="hint"
                          size="xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = quizAnswers[q.id] === oIdx;
                          const isCorrect = q.correctIndex === oIdx;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() =>
                                !quizSubmitted && setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                              }
                              className={cn(
                                "w-full p-2.5 border text-left text-xs transition-colors flex items-center justify-between cursor-pointer",
                                quizSubmitted && isCorrect
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-medium"
                                  : quizSubmitted && isSelected && !isCorrect
                                  ? "bg-red-50 border-red-400 text-red-900"
                                  : isSelected
                                  ? "bg-zinc-900 text-white border-zinc-900 font-medium"
                                  : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
                              )}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              {!quizSubmitted && isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <p className="text-[11px] text-zinc-600 leading-relaxed font-mono">
                          <strong>Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}

                  {quizSubmitted && quizScore !== null && (
                    <div className={cn(
                      "p-3.5 border space-y-1 animate-in fade-in",
                      quizScore >= 70 ? "bg-emerald-50 border-emerald-400 text-emerald-950" : "bg-zinc-50 border-zinc-400 text-zinc-900"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">Diagnostic Score: {quizScore}%</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 bg-white border">
                          {quizScore >= 70 ? "Mastery Achieved ✓" : "Logged for Revision"}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">
                        {quizScore >= 70
                          ? "Concept node marked green on your curriculum flowchart."
                          : "AI has scheduled an adaptive revision drill for tomorrow's lecture."}
                      </p>
                    </div>
                  )}

                  {!quizSubmitted && (
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={Object.keys(quizAnswers).length < quizQuestions.length || isSubmittingQuiz}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        {isSubmittingQuiz ? "Evaluating..." : "Submit Quiz & Mark Node"}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: Topic Name & Subtopic Checklist */}
        <div className="w-56 flex-none flex flex-col overflow-y-auto border-l border-zinc-200 bg-white">
          <div className="p-4 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block mb-1">Topic Name</span>
              <h4 className="text-xs font-bold text-zinc-900 leading-snug">{day.title}</h4>
            </div>

            <div className="border-t border-zinc-100" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">Breakdown of Topic</span>
                <ListChecks className="w-3.5 h-3.5 text-zinc-400" />
              </div>

              {day.topicsCovered.map((topic, idx) => {
                const isChecked = !!checkedTopics[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleTopicCheck(idx)}
                    className={cn(
                      "p-2.5 border text-xs transition-colors cursor-pointer flex items-start gap-2.5 select-none",
                      isChecked ? "bg-zinc-50 border-zinc-300" : "bg-white border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 w-3.5 h-3.5 shrink-0 border flex items-center justify-center transition-colors",
                      isChecked ? "bg-zinc-900 border-zinc-900" : "border-zinc-300 bg-white"
                    )}>
                      {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-zinc-400 block">Module 0{idx + 1}</span>
                      <span className={cn("leading-snug block text-[11px]", isChecked ? "text-zinc-900 font-medium" : "text-zinc-500")}>
                        {topic}
                      </span>
                    </div>
                  </div>
                );
              })}

              <p className="text-[10px] font-mono text-zinc-400 text-right">
                {Object.values(checkedTopics).filter(Boolean).length}/{day.topicsCovered.length} done
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Explain Modal */}
      <ExplanationModal
        explanation={selectedExplanation}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGotIt={() => setIsModalOpen(false)}
      />

      {/* Quick Revision Modal */}
      {showRevisionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setShowRevisionModal(false)}
        >
          <div
            className="bg-white border border-zinc-300 p-6 max-w-lg w-full space-y-4 shadow-xl animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-zinc-900" />
                <h3 className="text-sm font-bold text-zinc-900">
                  {revisionData?.title || "Quick 5-Minute Revision"}
                </h3>
              </div>
              <button onClick={() => setShowRevisionModal(false)} className="text-zinc-400 hover:text-zinc-600 text-sm cursor-pointer">✕</button>
            </div>

            <div className="text-xs text-zinc-600 leading-relaxed space-y-3">
              <p className="text-zinc-900 font-medium leading-relaxed">
                {revisionData?.summary || day.revisionNote || "Review core equations and verify truth table residue outputs."}
              </p>

              {revisionData?.keyFormulas && revisionData.keyFormulas.length > 0 && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 font-mono text-xs text-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-sans font-semibold">Key Formula</span>
                  {revisionData.keyFormulas.map((f, i) => (
                    <div key={i}>{f}</div>
                  ))}
                </div>
              )}

              {revisionData?.keyPoints && revisionData.keyPoints.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">Key Takeaways</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-zinc-700">
                    {revisionData.keyPoints.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {revisionData?.mistakeTip && (
                <div className="border-l-2 border-zinc-900 bg-zinc-50 p-2.5 text-zinc-800">
                  <span className="font-semibold block text-[11px]">Mistake to avoid:</span>
                  <span>{revisionData.mistakeTip}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 cursor-pointer"
              >
                Got it, Return to Session
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
