import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "brand" | "emerald" | "amber" | "rose" | "purple" | "neutral";
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  barClassName,
  showLabel = false,
  size = "md",
  color = "neutral",
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeClasses = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-medium text-zinc-600 mb-1">
          <span>Progress</span>
          <span className="font-mono text-zinc-900">{percentage}%</span>
        </div>
      )}
      <div className={cn("w-full bg-zinc-100 border border-zinc-200/60 rounded-xs overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "h-full bg-zinc-900 transition-all duration-300 ease-out",
            barClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
