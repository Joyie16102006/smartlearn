import React from "react";
import { MistakeLog } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertTriangle, Clock } from "lucide-react";

interface MistakeCardProps {
  mistake: MistakeLog;
}

export const MistakeCard: React.FC<MistakeCardProps> = ({ mistake }) => {
  return (
    <Card hoverable className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {mistake.conceptName}
            </h4>
            <span className="text-[11px] text-zinc-400">
              Error Type: <span className="font-medium text-zinc-700 dark:text-zinc-300">{mistake.errorType}</span>
            </span>
          </div>
        </div>

        <Badge
          variant={mistake.severity === "high" ? "warning" : "neutral"}
          size="sm"
        >
          {mistake.severity} severity
        </Badge>
      </div>

      {/* Question Context */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-lg border border-zinc-200/60 dark:border-zinc-800 text-xs">
        <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mb-1">
          Problem Formulation:
        </span>
        <p className="text-zinc-600 dark:text-zinc-400">
          {mistake.questionTitle}
        </p>
      </div>

      {/* Comparison: Student Answer vs Correct */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
            Submitted Response:
          </span>
          <p className="text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
            {mistake.userAnswer}
          </p>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
            Correct Formulation:
          </span>
          <p className="text-zinc-800 dark:text-zinc-200 font-mono text-[11px]">
            {mistake.correctAnswer}
          </p>
        </div>
      </div>

      {/* AI Diagnostic Reasoning & Adaptive Action */}
      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <div className="text-xs">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Root Cause: </span>
          <span className="text-zinc-600 dark:text-zinc-400">{mistake.likelyCause}</span>
        </div>

        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300">
          <span className="font-semibold block mb-0.5 text-zinc-900 dark:text-zinc-100">Engine Adaptation:</span>
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{mistake.adaptiveAction}</span>
        </div>
      </div>

      <div className="flex justify-end text-[11px] font-mono text-zinc-400">
        <span>Logged {mistake.timestamp}</span>
      </div>
    </Card>
  );
};
