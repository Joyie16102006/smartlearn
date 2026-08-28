import React from "react";
import { HelpCircle, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExplainButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
  variant?: "default" | "pill" | "subtle" | "inline" | "hint";
  size?: "xs" | "sm" | "md";
  className?: string;
  icon?: "sparkles" | "help" | "lightbulb";
  title?: string;
}

export const ExplainButton: React.FC<ExplainButtonProps> = ({
  onClick,
  label = "Explain",
  variant = "default",
  size = "sm",
  className,
  icon = "sparkles",
  title = "Click for a contextual explanation",
}) => {
  const renderIcon = () => {
    const iconClass = size === "xs" ? "w-3 h-3" : size === "md" ? "w-3.5 h-3.5" : "w-3 h-3";
    if (icon === "lightbulb" || variant === "hint") {
      return <Lightbulb className={cn(iconClass, "text-zinc-500")} />;
    }
    if (icon === "help") {
      return <HelpCircle className={cn(iconClass, "text-zinc-500")} />;
    }
    return <Sparkles className={cn(iconClass, "text-zinc-500")} />;
  };

  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400";

  const sizeStyles = {
    xs: "px-2 py-0.5 text-[11px] gap-1 rounded",
    sm: "px-2.5 py-1 text-xs gap-1.5 rounded-md",
    md: "px-3 py-1.5 text-xs gap-2 rounded-md",
  };

  const variantStyles = {
    default:
      "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700",
    pill:
      "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-full",
    subtle:
      "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800",
    inline:
      "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 p-1 rounded border-0 underline-offset-2 hover:underline",
    hint:
      "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {renderIcon()}
      <span>{label}</span>
    </button>
  );
};
