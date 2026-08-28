import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  bordered = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-900 rounded-xl p-5 md:p-6 transition-all duration-150",
        bordered && "border border-zinc-200 dark:border-zinc-800",
        hoverable && "hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
