"use client";

import React, { useState } from "react";
import { mockResources } from "@/data/mockData";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Search, Layers, Video, FileText, BookOpen, UploadCloud } from "lucide-react";

export default function ResourcesPage() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredResources = mockResources.filter((res) => {
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
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Curated Learning Resources
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Precision-ranked educational videos, vetted documentation, articles, and syllabus materials.
        </p>
      </div>

      {/* Category Pills & Search */}
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
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
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
            placeholder="Search by topic or source..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
          />
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-10 text-center space-y-2">
          <Layers className="w-6 h-6 text-zinc-400 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No resources found
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try switching the category filter or searching for a different concept keyword.
          </p>
        </div>
      )}
    </div>
  );
}
