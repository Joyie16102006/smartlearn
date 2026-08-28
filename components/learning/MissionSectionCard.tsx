import React from "react";
import { MissionSection } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  BookOpen,
  Video,
  Code2,
  HelpCircle,
  RotateCcw,
  Clock,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MissionSectionCardProps {
  section: MissionSection;
  onAction?: (section: MissionSection) => void;
}

export const MissionSectionCard: React.FC<MissionSectionCardProps> = ({
  section,
  onAction,
}) => {
  const getSectionIcon = (type: MissionSection["type"]) => {
    switch (type) {
      case "learn":
        return <BookOpen className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />;
      case "resource":
        return <Video className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />;
      case "practice":
        return <Code2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />;
      case "quiz":
        return <HelpCircle className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />;
      case "revision":
        return <RotateCcw className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />;
    }
  };

  return (
    <Card
      hoverable
      className={cn(
        "transition-colors",
        section.status === "completed" && "bg-zinc-50/60 dark:bg-zinc-900/40 opacity-75"
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Step number + Icon + Content */}
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
            {section.status === "completed" ? (
              <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            ) : (
              getSectionIcon(section.type)
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase text-zinc-400">
                Step 0{section.stepNumber} • {section.type.toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                <Clock className="w-3 h-3 text-zinc-400" />
                {section.durationMinutes} min
              </span>
              {section.status === "completed" && (
                <Badge variant="neutral" size="sm">
                  Completed
                </Badge>
              )}
            </div>

            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {section.title}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              {section.subtitle}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pt-0.5">
              {section.description}
            </p>
          </div>
        </div>

        {/* Right: Action CTA */}
        <div className="sm:shrink-0 w-full sm:w-auto">
          <button
            onClick={() => onAction && onAction(section)}
            className={cn(
              "w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors",
              section.status === "completed"
                ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            )}
          >
            <span>{section.actionLabel}</span>
            {section.type === "resource" ? (
              <ExternalLink className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </Card>
  );
};
