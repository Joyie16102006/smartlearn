import React from "react";
import { AssessmentResult } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Clock, ChevronRight } from "lucide-react";

interface AssessmentCardProps {
  assessment: AssessmentResult;
  onRetake?: () => void;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  onRetake,
}) => {
  const isPending = assessment.scorePercentage === 0;

  return (
    <Card hoverable className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase text-zinc-400">
              {assessment.type === "weekly" ? "Weekly Milestone" : "Daily Quiz"}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-xs text-zinc-500 font-mono">{assessment.completedAt}</span>
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {assessment.title}
          </h3>
          <p className="text-xs text-zinc-500">{assessment.courseTitle}</p>
        </div>

        {isPending ? (
          <Badge variant="warning" size="sm" dot>
            Pending
          </Badge>
        ) : (
          <div className="text-right">
            <span className="text-xl font-semibold font-mono text-zinc-900 dark:text-zinc-100">
              {assessment.scorePercentage}%
            </span>
            <span className="block text-[10px] text-zinc-400 font-mono">
              {assessment.correctAnswers}/{assessment.totalQuestions} Correct
            </span>
          </div>
        )}
      </div>

      {!isPending && (
        <>
          {/* Progress Bar */}
          <ProgressBar
            value={assessment.scorePercentage}
            size="sm"
            color="neutral"
          />

          {/* Diagnostic Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                Strong Mastery
              </span>
              <span className="text-zinc-800 dark:text-zinc-200 font-medium text-xs">
                {assessment.strongConcept}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                Revision Target
              </span>
              <span className="text-zinc-800 dark:text-zinc-200 font-medium text-xs">
                {assessment.weakConcept}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Footer Details & Action */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-400" />
            {assessment.timeSpentMinutes} mins
          </span>
          {!isPending && assessment.improvementDeltaPercentage > 0 && (
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
              +{assessment.improvementDeltaPercentage}% vs prior
            </span>
          )}
        </div>

        <button
          onClick={onRetake}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-colors"
        >
          <span>{isPending ? "Start Quiz" : "Inspect Analytics"}</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </Card>
  );
};
