import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "neutral" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className,
  dot = false,
}) => {
  const variantStyles = {
    default:
      "bg-zinc-100 text-zinc-800 border-zinc-200/80 dark:bg-zinc-800/80 dark:text-zinc-200 dark:border-zinc-700/80",
    neutral:
      "bg-zinc-50 text-zinc-600 border-zinc-200/60 dark:bg-zinc-900/60 dark:text-zinc-400 dark:border-zinc-800",
    success:
      "bg-emerald-50/60 text-emerald-800 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/60",
    warning:
      "bg-amber-50/60 text-amber-800 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60",
    danger:
      "bg-rose-50/60 text-rose-800 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/60",
    outline:
      "bg-transparent text-zinc-700 border-zinc-300 dark:text-zinc-300 dark:border-zinc-700",
  };

  const dotColors = {
    default: "bg-zinc-600 dark:bg-zinc-300",
    neutral: "bg-zinc-400 dark:bg-zinc-500",
    success: "bg-emerald-600 dark:bg-emerald-400",
    warning: "bg-amber-600 dark:bg-amber-400",
    danger: "bg-rose-600 dark:bg-rose-400",
    outline: "bg-zinc-500",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-medium tracking-tight",
    md: "px-2.5 py-0.5 text-xs font-medium tracking-tight",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border transition-colors select-none",
        variantStyles[variant] || variantStyles.default,
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant] || dotColors.default)} />}
      {children}
    </span>
  );
};
