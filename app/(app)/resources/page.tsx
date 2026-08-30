"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Course, ResourceItem } from "@/types";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Search, Layers, Video, FileText, BookOpen, UploadCloud, Plus, Loader2 } from "lucide-react";

export default function ResourcesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.courses || []);
        setCourses(list);
      })
      .catch((err) => console.warn("Failed to load courses for resources:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const resources: ResourceItem[] = courses.flatMap((c) =>
    (c.daysList || [])
      .filter((d) => d.sourceLink)
      .map((d, idx) => ({
        id: `res-${c.id}-${d.dayNumber}-${idx}`,
        title: d.sourceLink!.title,
        type: "video" as const,
        durationMinutes: 12,
        difficulty: "Intermediate" as const,
        source: d.sourceLink!.source,
        conceptName: d.title,
        whyRecommended: "Curated for daily syllabus topic mastery",
        url: d.sourceLink!.url,
        rating: 4.8,
        isBookmarked: false,
      }))
  );

  const filteredResources = resources.filter((res) => {
    const matchesType = selectedType === "all" || res.type === selectedType;
    const matchesSearch =
      res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.conceptName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const categories = [
    { id: "all", label: "All Assets", icon: Layers },
    { id: "video", label: "Videos", icon: Video },
    { id: "article", label: "Articles", icon: FileText },
    { id: "documentation", label: "Docs", icon: BookOpen },
    { id: "uploaded", label: "Syllabus Uploads", icon: UploadCloud },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="pb-2 border-b border-zinc-200">
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
          Curated Learning Resources
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Precision-ranked educational videos, vetted documentation, articles, and syllabus materials.
        </p>
      </div>

      {/* Category Pills & Search */}
      {resources.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedType(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedType === cat.id
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white border border-zinc-200 focus:outline-none focus:border-zinc-900 text-zinc-900 placeholder-zinc-400 font-normal"
            />
          </div>
        </div>
      )}

      {/* Resources Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
          <span>Loading resources...</span>
        </div>
      ) : filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((res) => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-md border border-zinc-200 p-12 text-center space-y-3 max-w-md mx-auto shadow-2xs">
          <BookOpen className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-900">
            No Resources Ingested Yet
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            When you create a course with YouTube, documentation, or syllabus links, precision-ranked resources will be indexed here.
          </p>
          <Link
            href="/courses/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course With Sources</span>
          </Link>
        </div>
      )}
    </div>
  );
}
