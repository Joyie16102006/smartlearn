import React from "react";
import { ResourceItem } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Video,
  FileText,
  BookOpen,
  UploadCloud,
  Clock,
  ExternalLink,
  Star,
} from "lucide-react";

interface ResourceCardProps {
  resource: ResourceItem;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const getResourceIcon = (type: ResourceItem["type"]) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />;
      case "article":
        return <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />;
      case "documentation":
        return <BookOpen className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />;
      case "uploaded":
        return <UploadCloud className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />;
    }
  };

  return (
    <Card hoverable className="flex flex-col justify-between h-full group">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              {getResourceIcon(resource.type)}
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                {resource.source}
              </span>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {resource.conceptName}
              </span>
            </div>
          </div>

          <Badge variant="neutral" size="sm">
            {resource.type}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors mb-2 leading-snug">
          {resource.title}
        </h3>

        {/* Metadata */}
        <div className="flex items-center gap-2.5 text-xs text-zinc-500 mb-3 font-mono text-[11px]">
          {resource.durationMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400" />
              {resource.durationMinutes} min
            </span>
          )}
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span>{resource.difficulty}</span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="flex items-center gap-0.5 text-zinc-700 dark:text-zinc-300 font-medium">
            <Star className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
            {resource.rating}
          </span>
        </div>

        {/* Why Recommended Callout */}
        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 mb-4">
          <p className="text-[11px] leading-relaxed">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Context: </span>
            {resource.whyRecommended}
          </p>
        </div>
      </div>

      {/* Action footer */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-mono">
          Vetted curriculum asset
        </span>
        <button
          onClick={() => resource.url && window.open(resource.url, "_blank")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-colors"
        >
          <span>Open Resource</span>
          <ExternalLink className="w-3 h-3 text-zinc-400" />
        </button>
      </div>
    </Card>
  );
};
