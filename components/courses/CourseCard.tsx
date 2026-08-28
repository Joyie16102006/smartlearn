import React from "react";
import Link from "next/link";
import { Course } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Calendar, ChevronRight, BookOpen, Flame } from "lucide-react";

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div className="bg-white rounded-md border border-zinc-200 hover:border-zinc-400 transition-colors flex flex-col justify-between p-5 space-y-3.5 group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              {course.category.split("&")[0].trim()}
            </span>
            <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-black transition-colors mt-0.5 leading-snug line-clamp-1">
              {course.title}
            </h3>
          </div>
          {/* Per-Course Streak */}
          <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-xs border border-zinc-200 bg-zinc-50 text-zinc-700 text-[11px] font-mono">
            <Flame className="w-3 h-3 text-zinc-600" />
            <span>{course.streakDays || 7}d</span>
          </div>
        </div>

        {/* Learning Goal */}
        <p className="text-xs text-zinc-500 line-clamp-2 mb-3.5 leading-relaxed">
          {course.goal}
        </p>

        {/* Progress Section */}
        <div className="bg-zinc-50 rounded-xs p-3 mb-3.5 space-y-1.5 border border-zinc-200/60">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-medium text-zinc-600 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-zinc-400" />
              Day {course.currentDay} of {course.totalDays}
            </span>
            <span className="font-mono font-semibold text-zinc-900">
              {course.progressPercentage}%
            </span>
          </div>
          <ProgressBar value={course.progressPercentage} size="sm" color="neutral" />
        </div>

        {/* Current Topic */}
        <div className="flex items-start gap-2 text-xs">
          <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-zinc-400 text-[10px] font-mono uppercase block">Current Focus:</span>
            <span className="font-medium text-zinc-800 line-clamp-1">
              {course.currentTopic}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between mt-1">
        <span className="text-[11px] text-zinc-400 font-mono">
          {course.minutesPerDay}m / day
        </span>
        <Link
          href={`/courses/${course.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:underline"
        >
          <span>Open Roadmap</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
