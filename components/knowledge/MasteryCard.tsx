import React from "react";
import { ConceptMastery } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface MasteryCardProps {
  mastery: ConceptMastery;
}

export const MasteryCard: React.FC<MasteryCardProps> = ({ mastery }) => {
  const getBadgeVariant = (type: ConceptMastery["categoryType"]) => {
    switch (type) {
      case "strong":
        return "neutral";
      case "needs-practice":
        return "default";
      case "weak":
        return "warning";
    }
  };

  const getBadgeLabel = (type: ConceptMastery["categoryType"]) => {
    switch (type) {
      case "strong":
        return "High Mastery";
      case "needs-practice":
        return "In Progress";
      case "weak":
        return "Needs Revision";
    }
  };

  return (
    <Card hoverable className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
            {mastery.category}
          </span>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {mastery.conceptName}
          </h4>
        </div>
        <Badge variant={getBadgeVariant(mastery.categoryType)} size="sm" dot>
          {getBadgeLabel(mastery.categoryType)}
        </Badge>
      </div>

      {/* Main Score Bar */}
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs text-zinc-500 font-medium">
            Calculated Competency
          </span>
          <span className="text-base font-semibold font-mono text-zinc-900 dark:text-zinc-100">
            {mastery.masteryPercentage}%
          </span>
        </div>
        <ProgressBar
          value={mastery.masteryPercentage}
          size="sm"
          color="neutral"
        />
      </div>

      {/* Evidence Breakdown Grid */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
        <div className="bg-zinc-50 dark:bg-zinc-850 p-2 rounded-md border border-zinc-200/60 dark:border-zinc-800">
          <span className="text-[10px] text-zinc-400 block font-mono">MCQ</span>
          <span className="text-xs font-semibold font-mono text-zinc-800 dark:text-zinc-200">
            {mastery.breakdown.mcqScore}%
          </span>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-850 p-2 rounded-md border border-zinc-200/60 dark:border-zinc-800">
          <span className="text-[10px] text-zinc-400 block font-mono">Problem</span>
          <span className="text-xs font-semibold font-mono text-zinc-800 dark:text-zinc-200">
            {mastery.breakdown.problemSolvingScore}%
          </span>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-850 p-2 rounded-md border border-zinc-200/60 dark:border-zinc-800">
          <span className="text-[10px] text-zinc-400 block font-mono">Explain</span>
          <span className="text-xs font-semibold font-mono text-zinc-800 dark:text-zinc-200">
            {mastery.breakdown.explanationScore}%
          </span>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-850 p-2 rounded-md border border-zinc-200/60 dark:border-zinc-800">
          <span className="text-[10px] text-zinc-400 block font-mono">Weekly</span>
          <span className="text-xs font-semibold font-mono text-zinc-800 dark:text-zinc-200">
            {mastery.breakdown.weeklyTestScore}%
          </span>
        </div>
      </div>

      {/* Common Mistakes preview if any */}
      {mastery.commonMistakes.length > 0 && (
        <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-700 dark:text-zinc-300">
          <span className="font-semibold block mb-0.5 text-zinc-900 dark:text-zinc-100">
            Diagnosed Error Pattern:
          </span>
          <ul className="list-disc list-inside space-y-0.5 text-zinc-600 dark:text-zinc-400">
            {mastery.commonMistakes.map((m, i) => (
              <li key={i} className="truncate">{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer Timing info */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 font-mono">
        <span>Reviewed {mastery.lastReviewedDaysAgo === 0 ? "today" : `${mastery.lastReviewedDaysAgo}d ago`}</span>
        <span className="text-zinc-600 dark:text-zinc-400">
          {mastery.nextReviewDays === 0 ? "Revision due today" : `Next in ${mastery.nextReviewDays}d`}
        </span>
      </div>
    </Card>
  );
};
