"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ConceptNode } from "@/types";
import { CheckCircle2, Circle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseFlowchartProps {
  concepts: ConceptNode[];
  onSelectConcept?: (concept: ConceptNode) => void;
  selectedConceptId?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Topological layout: assign each concept a (column, row) based on DAG depth
// ─────────────────────────────────────────────────────────────────────────────
function computeLayout(concepts: ConceptNode[]): Map<string, { col: number; row: number }> {
  const idMap = new Map(concepts.map((c) => [c.id, c]));
  const depthMap = new Map<string, number>();

  function depth(id: string, visiting = new Set<string>()): number {
    if (depthMap.has(id)) return depthMap.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const node = idMap.get(id);
    const d =
      node && node.prerequisites && node.prerequisites.length > 0
        ? 1 + Math.max(...node.prerequisites.map((p) => depth(p, new Set(visiting))))
        : 0;
    depthMap.set(id, d);
    return d;
  }

  concepts.forEach((c) => depth(c.id));

  // Group by depth level (= column)
  const byCol = new Map<number, string[]>();
  concepts.forEach((c) => {
    const col = depthMap.get(c.id) ?? 0;
    if (!byCol.has(col)) byCol.set(col, []);
    byCol.get(col)!.push(c.id);
  });

  const maxRows = Math.max(...Array.from(byCol.values()).map((arr) => arr.length), 1);

  // If a dataset has only 1 row across all columns (legacy linear chain),
  // layout intelligently as a 2D multi-branch tree:
  // Root -> Branch A & B -> Sub-branch A & B -> Capstone
  if (maxRows === 1 && concepts.length >= 4) {
    const treeLayout = new Map<string, { col: number; row: number }>();
    concepts.forEach((c, idx) => {
      if (idx === 0) {
        // Root
        treeLayout.set(c.id, { col: 0, row: 0 });
      } else if (idx === 1) {
        // Upper branch
        treeLayout.set(c.id, { col: 1, row: 0 });
      } else if (idx === 2) {
        // Lower branch
        treeLayout.set(c.id, { col: 1, row: 1 });
      } else if (idx === 3) {
        // Upper sub-branch
        treeLayout.set(c.id, { col: 2, row: 0 });
      } else if (idx === 4) {
        // Lower sub-branch
        treeLayout.set(c.id, { col: 2, row: 1 });
      } else {
        // Capstone / downstream
        const col = 3 + Math.floor((idx - 5) / 2);
        const row = (idx - 5) % 2;
        treeLayout.set(c.id, { col, row });
      }
    });
    return treeLayout;
  }

  const layout = new Map<string, { col: number; row: number }>();
  byCol.forEach((ids, col) => {
    ids.forEach((id, rowIndex) => {
      layout.set(id, { col, row: rowIndex });
    });
  });

  return layout;
}

// ─────────────────────────────────────────────────────────────────────────────
// Node style helpers
// ─────────────────────────────────────────────────────────────────────────────
function nodeStyle(concept: ConceptNode, isSelected: boolean) {
  const base =
    "relative flex flex-col justify-between rounded-md border transition-all duration-200 cursor-pointer select-none p-4 space-y-2.5 shadow-2xs hover:shadow-xs";
  if (concept.status === "completed")
    return cn(
      base,
      "bg-emerald-50/95 border-emerald-500 text-emerald-950",
      isSelected && "ring-2 ring-emerald-600 shadow-sm"
    );
  if (concept.status === "current")
    return cn(
      base,
      "bg-white border-zinc-900 text-zinc-900 shadow-md ring-1 ring-zinc-900/10",
      isSelected && "ring-2 ring-zinc-900"
    );
  if (concept.status === "weak")
    return cn(
      base,
      "bg-amber-50/70 border-amber-400 text-amber-950",
      isSelected && "ring-2 ring-amber-600 shadow-sm"
    );
  // upcoming / locked
  return cn(
    base,
    "bg-white/80 border-zinc-200 text-zinc-600 opacity-85 hover:opacity-100 hover:border-zinc-300",
    isSelected && "ring-2 ring-zinc-400"
  );
}

function edgeColor(fromStatus: string, toStatus: string) {
  if (fromStatus === "completed" && toStatus === "completed") return "#10b981"; // emerald-500
  if (fromStatus === "completed") return "#34d399"; // emerald-400
  if (fromStatus === "current") return "#18181b"; // zinc-900
  return "#cbd5e1"; // slate-300
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Layout Metrics
// ─────────────────────────────────────────────────────────────────────────────
const NODE_W = 230;
const NODE_H = 132;
const COL_GAP = 96;
const ROW_GAP = 44;
const CANVAS_PAD = 40;

export const CourseFlowchart: React.FC<CourseFlowchartProps> = ({
  concepts,
  onSelectConcept,
  selectedConceptId,
}) => {
  const [activeId, setActiveId] = useState<string | null>(
    selectedConceptId ??
      concepts.find((c) => c.status === "current")?.id ??
      concepts[0]?.id ??
      null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync active node when selectedConceptId prop changes
  useEffect(() => {
    if (selectedConceptId) setActiveId(selectedConceptId);
  }, [selectedConceptId]);

  // Compute node positions and edges inside useMemo to eliminate render lag
  const { canvasW, canvasH, nodePositions, edges } = useMemo(() => {
    const layout = computeLayout(concepts);

    let maxCol = 0;
    const rowsPerCol = new Map<number, number>();
    layout.forEach(({ col, row }) => {
      if (col > maxCol) maxCol = col;
      rowsPerCol.set(col, Math.max(rowsPerCol.get(col) ?? 0, row + 1));
    });

    const maxRows = Math.max(...Array.from(rowsPerCol.values()), 1);
    const computedW = (maxCol + 1) * (NODE_W + COL_GAP) + CANVAS_PAD * 2 - COL_GAP;
    const computedH = maxRows * (NODE_H + ROW_GAP) + CANVAS_PAD * 2 - ROW_GAP;

    const canvasW = Math.max(computedW, 900);
    const canvasH = Math.max(computedH, 500);

    const nodePositions = new Map<string, { x: number; y: number }>();
    concepts.forEach((c) => {
      const pos = layout.get(c.id);
      if (pos) {
        const rowsInThisCol = rowsPerCol.get(pos.col) ?? 1;
        const totalColH = rowsInThisCol * (NODE_H + ROW_GAP) - ROW_GAP;
        // Vertically center column node groups within canvas height
        const startY = CANVAS_PAD + (canvasH - CANVAS_PAD * 2 - totalColH) / 2;
        nodePositions.set(c.id, {
          x: CANVAS_PAD + pos.col * (NODE_W + COL_GAP),
          y: startY + pos.row * (NODE_H + ROW_GAP),
        });
      }
    });

    const edgesList: Array<{
      fromId: string;
      toId: string;
      fromStatus: string;
      toStatus: string;
    }> = [];
    const idMap = new Map(concepts.map((c) => [c.id, c]));

    concepts.forEach((c, idx) => {
      const prereqs = c.prerequisites || [];
      if (prereqs.length > 0) {
        prereqs.forEach((prereqId) => {
          const prereq = idMap.get(prereqId);
          if (prereq && nodePositions.has(prereqId) && nodePositions.has(c.id)) {
            edgesList.push({
              fromId: prereqId,
              toId: c.id,
              fromStatus: prereq.status,
              toStatus: c.status,
            });
          }
        });
      } else if (idx > 0 && maxRows === 1) {
        // For balanced tree fallback where prereqs were linear in DB
        const prevId = concepts[idx - 1]?.id;
        const prev = idMap.get(prevId);
        if (prev && nodePositions.has(prevId) && nodePositions.has(c.id)) {
          edgesList.push({
            fromId: prevId,
            toId: c.id,
            fromStatus: prev.status,
            toStatus: c.status,
          });
        }
      }
    });

    return { canvasW, canvasH, nodePositions, edges: edgesList };
  }, [concepts]);

  const handleNodeClick = useCallback(
    (concept: ConceptNode) => {
      setActiveId(concept.id);
      onSelectConcept?.(concept);
    },
    [onSelectConcept]
  );

  const completedCount = concepts.filter((c) => c.status === "completed").length;

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-zinc-200 rounded-md shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-700" />
          <span className="text-xs font-semibold text-zinc-900">Knowledge Dependency Tree</span>
          <span className="text-zinc-300">·</span>
          <span className="text-xs text-zinc-500 font-mono">
            {completedCount}/{concepts.length} Mastered
          </span>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-zinc-600">Mastered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-zinc-900" />
            <span className="text-zinc-600">Today&apos;s Focus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            <span className="text-zinc-600">Weak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-zinc-200 border border-zinc-300" />
            <span className="text-zinc-400">Locked</span>
          </div>
        </div>
      </div>

      {/* Spacious 2D Canvas */}
      <div
        className="flex-1 bg-[#fafafa] border border-zinc-200 rounded-md overflow-auto shadow-2xs relative min-h-[500px]"
        style={{
          backgroundImage: "radial-gradient(#d4d4d8 1.2px, transparent 1.2px)",
          backgroundSize: "20px 20px",
        }}
      >
        <div
          ref={containerRef}
          style={{ position: "relative", width: canvasW, height: canvasH, minWidth: "100%", minHeight: "100%" }}
        >
          {/* SVG edges layer */}
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              overflow: "visible",
            }}
          >
            <defs>
              {["emerald", "current", "default"].map((variant) => (
                <marker
                  key={variant}
                  id={`arrow-${variant}`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="3.5"
                  orient="auto"
                >
                  <path
                    d="M0,0 L0,7 L8,3.5 z"
                    fill={
                      variant === "emerald"
                        ? "#10b981"
                        : variant === "current"
                        ? "#18181b"
                        : "#94a3b8"
                    }
                  />
                </marker>
              ))}
            </defs>
            {edges.map(
              ({
                fromId,
                toId,
                fromStatus,
                toStatus,
              }: {
                fromId: string;
                toId: string;
                fromStatus: string;
                toStatus: string;
              }) => {
                const from = nodePositions.get(fromId);
                const to = nodePositions.get(toId);
                if (!from || !to) return null;

                // Connect right-center of source to left-center of target
                const x1 = from.x + NODE_W;
                const y1 = from.y + NODE_H / 2;
                const x2 = to.x;
                const y2 = to.y + NODE_H / 2;
                const dx = x2 - x1;

                // Smooth cubic bezier control points for branching curves
                const cx1 = x1 + dx * 0.48;
                const cx2 = x2 - dx * 0.48;

                const stroke = edgeColor(fromStatus, toStatus);
                const isDashed = fromStatus !== "completed" && fromStatus !== "current";
                const markerVariant =
                  fromStatus === "completed"
                    ? "emerald"
                    : fromStatus === "current"
                    ? "current"
                    : "default";

                return (
                  <path
                    key={`${fromId}-${toId}`}
                    d={`M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`}
                    stroke={stroke}
                    strokeWidth={fromStatus === "current" ? 2.2 : 1.75}
                    fill="none"
                    strokeDasharray={isDashed ? "6 4" : undefined}
                    opacity={isDashed ? 0.75 : 1}
                    markerEnd={`url(#arrow-${markerVariant})`}
                  />
                );
              }
            )}
          </svg>

          {/* Concept Node cards */}
          {concepts.map((concept) => {
            const pos = nodePositions.get(concept.id);
            if (!pos) return null;
            const isCompleted = concept.status === "completed";
            const isCurrent = concept.status === "current";
            const isSelected = activeId === concept.id;

            return (
              <div
                key={concept.id}
                onClick={() => handleNodeClick(concept)}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: NODE_W,
                  height: NODE_H,
                }}
                className={nodeStyle(concept, isSelected)}
              >
                {/* Top row: day badge + status */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    {isCompleted ? (
                      <div className="w-4 h-4 rounded-xs bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-xs bg-zinc-900 text-white flex items-center justify-center shrink-0 text-[9px] font-bold shadow-2xs">
                        ●
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-xs bg-zinc-100 border border-zinc-200 text-zinc-400 flex items-center justify-center shrink-0">
                        <Circle className="w-2.5 h-2.5 text-zinc-400" strokeWidth={2} />
                      </div>
                    )}
                    <span className="text-[10px] font-mono font-semibold">
                      {concept.dayAssigned ? `Day ${concept.dayAssigned}` : "Topic"}
                    </span>
                  </div>
                  {isCompleted ? (
                    <span className="px-1.5 py-0.5 rounded-2xs bg-emerald-100 text-emerald-800 font-mono text-[9px] font-semibold">
                      {concept.masteryPercentage}%
                    </span>
                  ) : isCurrent ? (
                    <span className="px-1.5 py-0.5 rounded-2xs bg-zinc-900 text-white font-mono text-[9px] font-semibold">
                      Active Focus
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-2xs bg-zinc-100 text-zinc-500 font-mono text-[9px]">
                      Locked
                    </span>
                  )}
                </div>

                {/* Concept Title */}
                <h4 className="text-xs font-semibold text-zinc-900 line-clamp-2 leading-snug">
                  {concept.name}
                </h4>

                {/* Formula preview or description */}
                {concept.keyFormulas && concept.keyFormulas.length > 0 ? (
                  <div className="px-2 py-1 rounded-xs bg-zinc-50 border border-zinc-200 text-[10px] font-mono text-zinc-700 truncate">
                    {concept.keyFormulas[0]}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                    {concept.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
