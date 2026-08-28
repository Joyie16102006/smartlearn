"use client";

import React, { useState } from "react";
import { ConceptNode } from "@/types";
import {
  CheckCircle2,
  Lock,
  Play,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseFlowchartProps {
  concepts: ConceptNode[];
  onSelectConcept?: (concept: ConceptNode) => void;
  onEnterDay?: (dayNumber: number) => void;
  selectedConceptId?: string | null;
}

export const CourseFlowchart: React.FC<CourseFlowchartProps> = ({
  concepts,
  onSelectConcept,
  onEnterDay,
  selectedConceptId,
}) => {
  const [activeNode, setActiveNode] = useState<ConceptNode | null>(
    concepts.find((c) => c.status === "current") || concepts[0]
  );

  // Group concepts into flowchart phases
  const chunkCount = Math.max(1, Math.ceil(concepts.length / 3));
  const phases = [
    {
      id: "phase-1",
      name: "Phase 1: Foundations & Core Axioms",
      concepts: concepts.slice(0, chunkCount),
    },
    {
      id: "phase-2",
      name: "Phase 2: Architectural Synthesis & Minimization",
      concepts: concepts.slice(chunkCount, chunkCount * 2),
    },
    {
      id: "phase-3",
      name: "Phase 3: Advanced Implementation & Memory Elements",
      concepts: concepts.slice(chunkCount * 2),
    },
  ].filter((p) => p.concepts.length > 0);

  const handleNodeClick = (concept: ConceptNode) => {
    setActiveNode(concept);
    if (onSelectConcept) {
      onSelectConcept(concept);
    }
  };

  const completedCount = concepts.filter((c) => c.status === "completed").length;

  return (
    <div className="space-y-4">
      {/* Flowchart Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-zinc-200 rounded-sm">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-700" />
          <span className="text-xs font-semibold text-zinc-900">
            Concept Flowchart
          </span>
          <span className="text-zinc-300">·</span>
          <span className="text-xs text-zinc-500 font-mono">
            {completedCount}/{concepts.length} Nodes Mastered
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-2xs bg-emerald-600" />
            <span className="text-zinc-600">Mastered (Green)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-2xs bg-zinc-900" />
            <span className="text-zinc-600">Today's Focus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-2xs bg-zinc-200" />
            <span className="text-zinc-400">Locked</span>
          </div>
        </div>
      </div>

      {/* Flowchart Canvas */}
      <div className="bg-white border border-zinc-200 rounded-sm p-5 sm:p-6 overflow-x-auto">
        <div className="min-w-[620px] space-y-6">
          {phases.map((phase, pIdx) => (
            <div key={phase.id} className="space-y-3">
              {/* Phase Header Line */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-xs border border-zinc-200">
                  {phase.name}
                </span>
                <div className="flex-1 border-b border-dashed border-zinc-200" />
              </div>

              {/* Phase Concept Nodes Grid */}
              <div className="grid grid-cols-3 gap-3">
                {phase.concepts.map((concept) => {
                  const isCompleted = concept.status === "completed";
                  const isCurrent = concept.status === "current";
                  const isWeak = concept.status === "weak";
                  const isSelected = activeNode?.id === concept.id;

                  return (
                    <div
                      key={concept.id}
                      onClick={() => handleNodeClick(concept)}
                      className={cn(
                        "relative p-3.5 rounded-sm border transition-colors cursor-pointer select-none space-y-2 flex flex-col justify-between",
                        // Completed box covered in clean, professional GREEN
                        isCompleted
                          ? "bg-emerald-50/80 border-emerald-500 text-emerald-950"
                          : isCurrent
                          ? "bg-white border-zinc-900 text-zinc-900 shadow-xs"
                          : isWeak
                          ? "bg-amber-50/60 border-amber-400 text-amber-950"
                          : "bg-zinc-50/50 border-zinc-200 text-zinc-400 opacity-80 hover:opacity-100",
                        isSelected && "ring-1 ring-zinc-900"
                      )}
                    >
                      <div className="space-y-1.5">
                        {/* Node Top Header */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            {isCompleted ? (
                              <div className="w-4 h-4 rounded-xs bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            ) : isCurrent ? (
                              <div className="w-4 h-4 rounded-xs bg-zinc-900 text-white flex items-center justify-center shrink-0 font-bold text-[9px]">
                                ●
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-xs bg-zinc-200 text-zinc-500 flex items-center justify-center shrink-0">
                                <Lock className="w-2.5 h-2.5" />
                              </div>
                            )}
                            <span className="text-[10px] font-mono font-semibold">
                              {concept.dayAssigned ? `Day ${concept.dayAssigned}` : "Topic"}
                            </span>
                          </div>

                          {/* Status Badge */}
                          {isCompleted ? (
                            <span className="px-1.5 py-0.2 rounded-2xs bg-emerald-100 text-emerald-800 font-mono text-[9px] font-semibold">
                              {concept.masteryPercentage}%
                            </span>
                          ) : isCurrent ? (
                            <span className="px-1.5 py-0.2 rounded-2xs bg-zinc-900 text-white font-mono text-[9px] font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded-2xs bg-zinc-100 text-zinc-400 font-mono text-[9px]">
                              Locked
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-zinc-900 line-clamp-1">
                          {concept.name}
                        </h4>

                        <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                          {concept.description}
                        </p>
                      </div>

                      {/* Formulas Preview */}
                      {concept.keyFormulas && concept.keyFormulas.length > 0 && (
                        <div className="p-1 rounded-xs bg-zinc-50 border border-zinc-200 text-[10px] font-mono text-zinc-700 truncate">
                          {concept.keyFormulas[0]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Connecting Connector Arrow between phases */}
              {pIdx < phases.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <div className="w-px h-4 bg-zinc-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
