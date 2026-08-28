"use client";

import React, { useState, useEffect } from "react";
import { ExplanationData } from "@/types/explanation";
import {
  X,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface ExplanationModalProps {
  explanation: ExplanationData | null;
  isOpen: boolean;
  onClose: () => void;
  onGotIt?: (explanationId: string) => void;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
  explanation,
  isOpen,
  onClose,
  onGotIt,
}) => {
  const [showDeeperExplanation, setShowDeeperExplanation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowDeeperExplanation(false);
    }
  }, [isOpen, explanation?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !explanation) return null;

  const handleGotIt = () => {
    if (onGotIt) {
      onGotIt(explanation.id);
    }
    onClose();
  };

  const toggleDeeperExplanation = () => {
    setShowDeeperExplanation((prev) => !prev);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 space-y-4 text-zinc-800 dark:text-zinc-200 relative my-auto shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="neutral" size="sm">
                {explanation.isQuestionHint ? "Conceptual Hint" : "Contextual Breakdown"}
              </Badge>
              {explanation.category && (
                <span className="text-[11px] font-mono text-zinc-400">
                  {explanation.category}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 pt-0.5">
              {explanation.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close explanation"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Target Snippet / Formula Box */}
        {explanation.targetSnippet && (
          <div className="p-3.5 rounded-lg bg-zinc-900 text-white space-y-2 border border-zinc-800">
            <div className="text-[10px] font-mono uppercase text-zinc-400">
              Formulation
            </div>
            <div className="font-mono text-sm font-semibold text-zinc-100 tracking-wide break-words">
              {explanation.targetSnippet}
            </div>

            {/* Term Breakdown */}
            {explanation.terms && explanation.terms.length > 0 && (
              <div className="pt-2 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {explanation.terms.map((item, idx) => (
                  <div key={idx} className="flex items-baseline gap-1.5">
                    <span className="font-mono font-medium text-zinc-300 shrink-0">
                      {item.term}
                    </span>
                    <span className="text-zinc-400 text-[11px] leading-tight">
                      = {item.definition}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Simple Explanation */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-zinc-400">
            <BookOpen className="w-3 h-3 text-zinc-400" />
            <span>Explanation</span>
          </div>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {explanation.simpleExplanation}
          </p>
        </div>

        {/* 3. Example Section */}
        {explanation.example && (
          <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">
              Worked Example
            </span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {explanation.example}
            </p>
          </div>
        )}

        {/* 4. Diagram / Visual Block */}
        {explanation.formulaOrDiagram && (
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
            {explanation.diagramTitle && (
              <span className="text-[10px] font-mono uppercase text-zinc-400">
                {explanation.diagramTitle}
              </span>
            )}
            <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto whitespace-pre leading-snug py-0.5">
              {explanation.formulaOrDiagram}
            </pre>
          </div>
        )}

        {/* 5. Expandable Deeper Explanation Section */}
        {showDeeperExplanation && (
          <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 space-y-2.5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">
              Deep Conceptual Breakdown
            </span>

            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {explanation.deeperExplanation.breakdown}
            </p>

            {explanation.deeperExplanation.analogy && (
              <div className="p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 space-y-0.5">
                <span className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  Mental Model:
                </span>
                <p>{explanation.deeperExplanation.analogy}</p>
              </div>
            )}

            {explanation.deeperExplanation.commonPitfalls && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 block">
                  Common Pitfalls:
                </span>
                <ul className="list-disc list-inside text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5 pl-1">
                  {explanation.deeperExplanation.commonPitfalls.map((pitfall, idx) => (
                    <li key={idx}>{pitfall}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={toggleDeeperExplanation}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showDeeperExplanation ? "Hide Deep Dive" : "Still confused?"}</span>
            {showDeeperExplanation ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleGotIt}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Understood</span>
          </button>
        </div>
      </div>
    </div>
  );
};
