"use client";

import React, { useState } from "react";
import { ConceptNode } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Flame,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoadmapGraphProps {
  concepts: ConceptNode[];
  onSelectConcept?: (concept: ConceptNode) => void;
}

export const RoadmapGraph: React.FC<RoadmapGraphProps> = ({
  concepts,
  onSelectConcept,
}) => {
  const [selectedConcept, setSelectedConcept] = useState<ConceptNode | null>(
    concepts.find((c) => c.status === "current") || concepts[0]
  );

  const getStatusIcon = (status: ConceptNode["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />;
      case "current":
        return <Flame className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />;
      case "weak":
        return <AlertTriangle className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />;
      case "upcoming":
        return <Circle className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />;
    }
  };

  const getStatusBadge = (status: ConceptNode["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="neutral" size="sm">Completed</Badge>;
      case "current":
        return <Badge variant="default" size="sm" dot>Current Focus</Badge>;
      case "weak":
        return <Badge variant="warning" size="sm">Needs Practice</Badge>;
      case "upcoming":
        return <Badge variant="outline" size="sm">Upcoming</Badge>;
    }
  };

  const handleNodeClick = (concept: ConceptNode) => {
    setSelectedConcept(concept);
    if (onSelectConcept) onSelectConcept(concept);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Visual Roadmap Tree Node Stack */}
      <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 md:p-6">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Concept Dependency Graph
            </h3>
            <p className="text-xs text-zinc-500">
              Prerequisite sequencing calibrated to your mastery velocity
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" /> Done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" /> Active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Weak
            </span>
          </div>
        </div>

        <div className="relative space-y-3">
          {concepts.map((concept, index) => {
            const isSelected = selectedConcept?.id === concept.id;
            const isLast = index === concepts.length - 1;

            return (
              <div key={concept.id} className="relative">
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-5 top-10 bottom-[-12px] w-px z-0",
                      concept.status === "completed"
                        ? "bg-zinc-300 dark:bg-zinc-700"
                        : "bg-zinc-200 dark:bg-zinc-800"
                    )}
                  />
                )}

                {/* Node Card */}
                <div
                  onClick={() => handleNodeClick(concept)}
                  className={cn(
                    "relative z-10 flex items-start gap-3.5 p-3.5 rounded-lg border transition-all cursor-pointer",
                    isSelected
                      ? "bg-zinc-50 dark:bg-zinc-800/80 border-zinc-400 dark:border-zinc-600 shadow-xs"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  {/* Status Node Icon */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center shrink-0 border transition-colors",
                      concept.status === "completed" && "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
                      concept.status === "current" && "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent",
                      concept.status === "weak" && "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700",
                      concept.status === "upcoming" && "bg-transparent border-zinc-200 dark:border-zinc-800"
                    )}
                  >
                    {getStatusIcon(concept.status)}
                  </div>

                  {/* Concept Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {concept.name}
                      </h4>
                      {getStatusBadge(concept.status)}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-2">
                      {concept.description}
                    </p>

                    {/* Mini Mastery Meter */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="w-24">
                        <ProgressBar
                          value={concept.masteryPercentage}
                          size="sm"
                          color="neutral"
                        />
                      </div>
                      <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {concept.masteryPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Concept Deep Dive Drawer / Panel */}
      <div className="lg:col-span-5 sticky top-24 space-y-4">
        {selectedConcept ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 md:p-6">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
                  Concept Inspector
                </span>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {selectedConcept.name}
                </h3>
              </div>
              {getStatusBadge(selectedConcept.status)}
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5">
              {selectedConcept.description}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                  Mastery Level
                </span>
                <span className="text-lg font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                  {selectedConcept.masteryPercentage}%
                </span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                  Estimated Time
                </span>
                <span className="text-lg font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                  {selectedConcept.estimatedMinutes}m
                </span>
              </div>
            </div>

            {/* Key Formulas Section */}
            {selectedConcept.keyFormulas && selectedConcept.keyFormulas.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Formulas & Active Recall
                </h4>
                <div className="space-y-1.5">
                  {selectedConcept.keyFormulas.map((formula, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-xs font-mono text-zinc-800 dark:text-zinc-200"
                    >
                      {formula}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Adaptive Action Notice */}
            {selectedConcept.status === "weak" && (
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 mb-5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Adaptive Recommendation
                    </h5>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-normal">
                      The engine detected confusion in corner wrapping rules. Scheduled a targeted drill before next topic.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={() => (window.location.href = "/learn")}
              className="w-full py-2 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium transition-colors"
            >
              {selectedConcept.status === "completed"
                ? "Review Concept"
                : selectedConcept.status === "weak"
                ? "Start Targeted Revision"
                : "Practice Concept"}
            </button>
          </div>
        ) : (
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-400 text-xs">
            Select a concept node to view analytics and formulas.
          </div>
        )}
      </div>
    </div>
  );
};
