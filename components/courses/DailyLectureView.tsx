"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DayPlan } from "@/types";
import { ExplanationData } from "@/types/explanation";
import { getExplanationById } from "@/data/mockExplanations";
import { ExplainButton } from "@/components/learning/ExplainButton";
import { ExplanationModal } from "@/components/learning/ExplanationModal";
import {
  Sparkles,
  Video,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyLectureViewProps {
  day: DayPlan;
  courseTitle: string;
  onCompleteDay: (dayNumber: number, quizScore: number) => void;
  onBackToFlowchart?: () => void;
}

interface DynamicSection {
  type: "heading" | "paragraph" | "formula" | "code" | "table" | "callout";
  label?: string;
  content?: string;
  language?: string;
  calloutType?: "note" | "tip" | "warning";
  headers?: string[];
  rows?: string[][];
  canExplain?: boolean;
}

interface DynamicQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const DailyLectureView: React.FC<DailyLectureViewProps> = ({
  day,
  courseTitle,
  onCompleteDay,
  onBackToFlowchart,
}) => {
  const [selectedExplanation, setSelectedExplanation] = useState<ExplanationData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(day.quizScore || null);

  // Dynamic AI generated sections & quiz
  const [sections, setSections] = useState<DynamicSection[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<DynamicQuizQuestion[]>([]);
  const [isLoadingLecture, setIsLoadingLecture] = useState(true);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);

  // Fetch AI generated lecture content
  const fetchLecture = useCallback(async () => {
    setIsLoadingLecture(true);
    try {
      const res = await fetch("/api/ai/lecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayTitle: day.title,
          topics: day.topicsCovered,
          courseTitle,
          dayNumber: day.dayNumber,
          totalDays: 30,
          revisionNote: day.revisionNote,
        }),
      });
      const data = await res.json();
      if (data.sections && data.sections.length > 0) {
        setSections(data.sections);
      }
    } catch (err) {
      console.error("Failed to load AI lecture:", err);
    } finally {
      setIsLoadingLecture(false);
    }
  }, [day.title, day.topicsCovered, courseTitle, day.dayNumber, day.revisionNote]);

  // Fetch AI generated quiz questions
  const fetchQuiz = useCallback(async () => {
    setIsLoadingQuiz(true);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayTitle: day.title,
          topics: day.topicsCovered,
          courseTitle,
          dayNumber: day.dayNumber,
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
      }
    } catch (err) {
      console.error("Failed to load AI quiz:", err);
    } finally {
      setIsLoadingQuiz(false);
    }
  }, [day.title, day.topicsCovered, courseTitle, day.dayNumber]);

  useEffect(() => {
    fetchLecture();
    fetchQuiz();
    setQuizAnswers({});
    setQuizSubmitted(day.status === "completed");
    setQuizScore(day.quizScore || null);
  }, [day.dayNumber, fetchLecture, fetchQuiz]);

  const handleOpenExplain = async (conceptOrId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Check mock explanations first
    const mock = getExplanationById(conceptOrId);
    if (mock) {
      setSelectedExplanation(mock);
      setIsModalOpen(true);
      return;
    }

    // Call live AI explanation endpoint
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
          title: `AI Explanation: ${conceptOrId}`,
          simpleExplanation: data.simpleExplanation,
          example: data.example,
          formulaOrDiagram: data.keyFormula || undefined,
          deeperExplanation: {
            breakdown: data.tip || "Focus on the fundamental logic states and governing equations.",
            keyTakeaways: [data.tip || "Verify signal polarity and control addresses."],
          },
        });
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch live explanation:", err);
    }
  };

  const handleSubmitQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    let correctCount = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / Math.max(1, quizQuestions.length)) * 100);
    setQuizScore(calculatedScore);
    setQuizSubmitted(true);
    onCompleteDay(day.dayNumber, calculatedScore);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="p-4 rounded-sm bg-white border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-2xs bg-zinc-100 border border-zinc-200 text-[10px] font-mono font-semibold text-zinc-800">
              <Sparkles className="w-3 h-3" />
              AI Generated Lecture
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">Day {day.dayNumber}</span>
            {day.status === "completed" && (
              <span className="px-1.5 py-0.2 rounded-2xs bg-emerald-100 text-emerald-800 font-bold text-[9px] font-mono">
                Completed ✓
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">
            {day.title}
          </h2>
        </div>

        {onBackToFlowchart && (
          <button
            onClick={onBackToFlowchart}
            className="px-3 py-1.5 rounded-xs border border-zinc-200 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
          >
            ← Close Lecture
          </button>
        )}
      </div>

      {/* Source Video / Reference Card */}
      {day.sourceLink && (
        <div className="p-3.5 rounded-sm bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-white border border-zinc-200 flex items-center justify-center text-zinc-700">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-900 block">
                {day.sourceLink.title}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                Source: {day.sourceLink.source} · {day.sourceLink.duration}
              </span>
            </div>
          </div>
          <a
            href={day.sourceLink.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-white border border-zinc-200 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors shrink-0"
          >
            <span>Watch Video</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Spaced Mistake Revision Refresher */}
      {day.mistakeConcept && (
        <div className="p-4 rounded-sm bg-zinc-50 border-l-2 border-l-zinc-900 border border-zinc-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-zinc-700" />
              <span className="text-xs font-semibold text-zinc-900">
                Targeted Spaced Revision: {day.mistakeConcept}
              </span>
            </div>
            <ExplainButton
              onClick={(e) => handleOpenExplain("kmap-quad-wrapping", e)}
              label="Explain Rule"
              size="xs"
            />
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed font-mono">
            {day.revisionNote || "Reviewing prior diagnostic error to reinforce logic state calculations."}
          </p>
        </div>
      )}

      {/* ChatGPT-Style Structured Clean Document Interface (No typing bar) */}
      <div className="bg-white rounded-sm border border-zinc-200 p-6 sm:p-7 space-y-5">
        {isLoadingLecture ? (
          <div className="space-y-3 py-6 animate-pulse">
            <div className="h-4 bg-zinc-100 rounded-xs w-3/4" />
            <div className="h-3.5 bg-zinc-100 rounded-xs w-full" />
            <div className="h-3.5 bg-zinc-100 rounded-xs w-5/6" />
            <div className="h-16 bg-zinc-100 rounded-xs" />
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 pt-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-700" />
              <span>AI is structuring lecture and formulas...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section, sIdx) => {
              if (section.type === "heading") {
                return (
                  <h3
                    key={sIdx}
                    className="text-sm font-bold text-zinc-900 pt-3 pb-1 border-b border-zinc-100"
                  >
                    {section.content}
                  </h3>
                );
              }

              if (section.type === "paragraph") {
                return (
                  <p
                    key={sIdx}
                    className="text-xs sm:text-[13px] leading-relaxed text-zinc-700 whitespace-pre-wrap"
                  >
                    {section.content}
                  </p>
                );
              }

              if (section.type === "formula") {
                return (
                  <div
                    key={sIdx}
                    className="my-3 rounded-xs border border-zinc-200 bg-zinc-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-zinc-200 bg-white">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">
                        {section.label || "Governing Formula"}
                      </span>
                      <button
                        onClick={(e) => handleOpenExplain(section.content || "", e)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-zinc-900 hover:underline"
                      >
                        <Sparkles className="w-3 h-3" />
                        Explain Formula
                      </button>
                    </div>
                    <div className="px-4 py-3 font-mono text-xs sm:text-sm font-bold text-zinc-950 overflow-x-auto whitespace-pre-wrap">
                      {section.content}
                    </div>
                  </div>
                );
              }

              if (section.type === "code") {
                return (
                  <div
                    key={sIdx}
                    className="my-3 rounded-xs border border-zinc-800 overflow-hidden"
                  >
                    <div className="px-3.5 py-1.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-400">
                        {section.label || "Hardware Description / Code"}
                      </span>
                      {section.language && (
                        <span className="text-[9px] uppercase font-mono text-zinc-500">
                          {section.language}
                        </span>
                      )}
                    </div>
                    <pre className="bg-zinc-950 text-zinc-200 font-mono text-xs px-4 py-3 overflow-x-auto leading-relaxed">
                      {section.content}
                    </pre>
                  </div>
                );
              }

              if (section.type === "table" && section.headers && section.rows) {
                return (
                  <div
                    key={sIdx}
                    className="my-3 overflow-x-auto rounded-xs border border-zinc-200"
                  >
                    <table className="w-full text-xs">
                      <thead className="bg-zinc-50">
                        <tr>
                          {section.headers.map((h, hIdx) => (
                            <th
                              key={hIdx}
                              className="px-3.5 py-2 text-left font-semibold text-zinc-800 border-b border-zinc-200 text-[11px]"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={rIdx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="px-3.5 py-2 text-zinc-700 font-mono border-b border-zinc-100 text-[11px]"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              if (section.type === "callout") {
                return (
                  <div
                    key={sIdx}
                    className="my-3 border-l-2 border-zinc-900 bg-zinc-50 px-3.5 py-2.5 text-xs leading-relaxed text-zinc-800"
                  >
                    {section.content}
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>

      {/* End of Day Diagnostic Quiz */}
      <div className="bg-white rounded-sm border border-zinc-200 p-5 sm:p-6 space-y-4">
        <div className="space-y-1 pb-2 border-b border-zinc-100">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-2xs bg-zinc-100 border border-zinc-200 text-[10px] font-mono font-semibold text-zinc-800">
            End of Day · Diagnostic Quiz
          </div>
          <h3 className="text-sm font-bold text-zinc-900 mt-1">
            Verify Understanding for Day {day.dayNumber}
          </h3>
        </div>

        {isLoadingQuiz ? (
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 py-3">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-700" />
            <span>AI is calibrating diagnostic quiz questions...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmitQuiz} className="space-y-4">
            {quizQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-3.5 rounded-xs bg-zinc-50 border border-zinc-200 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold text-zinc-900">
                    Q{idx + 1}. {q.question}
                  </h4>
                  <ExplainButton
                    onClick={(e) => handleOpenExplain(q.question, e)}
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
                          !quizSubmitted &&
                          setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                        }
                        className={cn(
                          "w-full p-2.5 rounded-2xs border text-left text-xs transition-colors flex items-center justify-between cursor-pointer",
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
                        {quizSubmitted && isCorrect && (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        {!quizSubmitted && isSelected && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && (
                  <p className="text-[11px] text-zinc-600 leading-relaxed pt-1 font-mono">
                    <strong>Explanation:</strong> {q.explanation}
                  </p>
                )}
              </div>
            ))}

            {/* Quiz Result Banner */}
            {quizSubmitted && quizScore !== null && (
              <div
                className={cn(
                  "p-3.5 rounded-xs border space-y-1 animate-in fade-in",
                  quizScore >= 70
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950"
                    : "bg-zinc-50 border-zinc-400 text-zinc-900"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">
                    Diagnostic Score: {quizScore}%
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-2xs bg-white border border-current/20">
                    {quizScore >= 70 ? "Mastery Achieved (Node Turned Green ✓)" : "Mistake Logged for Revision"}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {quizScore >= 70
                    ? "Concept node has been marked green on your curriculum. Excellent work."
                    : "The AI has recorded weak areas and scheduled an adaptive revision drill in tomorrow's lecture."}
                </p>
              </div>
            )}

            {/* Quiz Submit CTA */}
            {!quizSubmitted && (
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                  className="px-4 py-2 rounded-xs bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
                >
                  Submit Daily Quiz & Mark Node
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Contextual Popup Modal for Explain */}
      <ExplanationModal
        explanation={selectedExplanation}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGotIt={() => setIsModalOpen(false)}
      />
    </div>
  );
};
