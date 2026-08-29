"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  UploadCloud,
  FileText,
  Link2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function NewCoursePage() {
  const router = useRouter();
  const [courseName, setCourseName] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [days, setDays] = useState(30);
  const [minutesPerDay, setMinutesPerDay] = useState(60);
  const [preferredTime, setPreferredTime] = useState("6:00 PM");

  // Multi-link support
  const [links, setLinks] = useState<string[]>([]);
  const [newLinkInput, setNewLinkInput] = useState("");

  // Uploaded files list
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generationPhases = [
    {
      title: "Parsing Uploaded Syllabus & Source Documents",
      desc: "Model 1 is extracting text, chapters, and topics from your uploaded materials...",
    },
    {
      title: "Deconstructing Concept Knowledge Graph & Prerequisites",
      desc: "Model 2 (Nemotron 550B) is building the cognitive sequence and dependency graph...",
    },
    {
      title: "Calibrating Day-Wise Pacing & Difficulty",
      desc: `Synthesizing ${days} daily learning blocks at ${minutesPerDay}m/day with difficulty weights...`,
    },
    {
      title: "Constructing Course Flowchart & Interactive DAG",
      desc: "Writing DAG nodes, formula cards, and daily topics to Supabase PostgreSQL database...",
    },
  ];

  const handleAddLink = () => {
    if (newLinkInput.trim()) {
      setLinks((prev) => [...prev, newLinkInput.trim()]);
      setNewLinkInput("");
    }
  };

  const handleRemoveLink = (idx: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const names = Array.from(e.target.files).map((f) => f.name);
      setUploadedFiles((prev) => [...prev, ...names]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsGenerating(true);
    setGenerationStep(0);

    // Dynamic phase stepper while API is computing
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < generationPhases.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2500);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: courseName,
          goal: learningGoal,
          level,
          totalDays: days,
          minutesPerDay,
          sources: links,
          files: uploadedFiles,
        }),
      });

      clearInterval(stepInterval);

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate course with AI engine");
      }

      // Mark all phases as completed before redirect
      setGenerationStep(generationPhases.length);

      setTimeout(() => {
        router.push(`/courses/${data.id}`);
      }, 800);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error("Course generation error:", err);
      setErrorMessage(err.message || "Failed to generate course. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="pb-3 border-b border-zinc-200">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
          Create New Course & Flowchart
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Specify course parameters, upload materials or links, and the AI model will construct a structured concept flowchart.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-sm border border-red-200 bg-red-50 flex items-start gap-3 text-red-800 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">Generation Failed</p>
            <p className="text-red-700 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {isGenerating ? (
        /* Real AI Generation Progress View */
        <div className="p-8 sm:p-10 rounded-sm bg-white border border-zinc-200 text-center space-y-6 animate-in fade-in">
          <div className="w-12 h-12 rounded-sm bg-zinc-900 text-white flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-sm font-bold text-zinc-900">
              {generationStep < generationPhases.length
                ? generationPhases[generationStep].title
                : "Course & Flowchart Generated!"}
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {generationStep < generationPhases.length
                ? generationPhases[generationStep].desc
                : "Redirecting to your interactive course flowchart..."}
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="max-w-md mx-auto space-y-2 pt-2">
            {generationPhases.map((phase, idx) => {
              const isDone = idx < generationStep;
              const isCurrent = idx === generationStep;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-sm border text-left text-xs transition-all flex items-center justify-between ${
                    isDone
                      ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-medium"
                      : isCurrent
                      ? "bg-zinc-100 border-zinc-900 text-zinc-950 font-semibold"
                      : "bg-zinc-50/50 border-zinc-200 text-zinc-400 opacity-60"
                  }`}
                >
                  <span>
                    0{idx + 1}. {phase.title}
                  </span>
                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {isCurrent && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-900" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Course Input Form */
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Course Fundamentals */}
          <div className="p-5 rounded-sm bg-white border border-zinc-200 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-700" />
              <span>1. Course Fundamentals</span>
            </h2>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                  Course / Topic Name *
                </label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Digital Electronics, Operating Systems, Machine Learning..."
                  className="w-full px-3.5 py-2 rounded-xs bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-500 focus:bg-white transition-colors font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                  Target Outcome / Learning Goal *
                </label>
                <textarea
                  required
                  rows={2}
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  placeholder="What concepts, exams, or projects are you aiming to master?"
                  className="w-full px-3.5 py-2 rounded-xs bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-500 focus:bg-white transition-colors leading-relaxed font-medium"
                />
              </div>

              {/* Knowledge Level Selector */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                  Current Knowledge Level
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={`py-2 px-3 rounded-xs text-xs font-medium border transition-colors text-center cursor-pointer ${
                        level === lvl
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Time Budget & Schedule */}
          <div className="p-5 rounded-sm bg-white border border-zinc-200 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-700" />
              <span>2. Time Budget & Schedule Calibration</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                  Total Target Days
                </label>
                <input
                  type="number"
                  min={5}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xs bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-mono font-semibold focus:outline-none focus:border-zinc-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                  Minutes Per Day
                </label>
                <input
                  type="number"
                  min={15}
                  max={240}
                  step={15}
                  value={minutesPerDay}
                  onChange={(e) => setMinutesPerDay(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xs bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-mono font-semibold focus:outline-none focus:border-zinc-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                  Preferred Daily Time
                </label>
                <input
                  type="text"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="e.g. 6:00 PM"
                  className="w-full px-3.5 py-2 rounded-xs bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-medium focus:outline-none focus:border-zinc-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="p-3 rounded-xs bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs font-mono text-zinc-700">
              <span>Curriculum Total Commitment:</span>
              <span className="font-semibold text-zinc-900">
                {days} days × {minutesPerDay}m = {Math.round((days * minutesPerDay) / 60)}h Total
              </span>
            </div>
          </div>

          {/* Section 3: Study Materials, PDF Uploads & Multi-Links */}
          <div className="p-5 rounded-sm bg-white border border-zinc-200 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-zinc-700" />
              <span>3. Source Materials & Reference Links</span>
            </h2>

            {/* Dropzone */}
            <div className="relative border border-dashed border-zinc-300 hover:border-zinc-500 rounded-sm p-5 text-center bg-zinc-50/50 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.pptx,.ppt,.docx,.txt"
                onChange={handleFileInputChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileText className="w-6 h-6 text-zinc-500 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-zinc-800">
                Upload Textbook PDF, PPTX Slides, or Syllabus Document
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                The model extracts concepts & equations to build the flowchart
              </p>

              {/* Uploaded files chips */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-3 pt-3 border-t border-zinc-200">
                  {uploadedFiles.map((file, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-2xs bg-white border border-zinc-200 text-xs font-mono text-zinc-700 flex items-center gap-1.5"
                    >
                      <FileText className="w-3 h-3 text-zinc-400" />
                      <span>{file}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="text-zinc-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Multi-links Manager */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono uppercase text-zinc-500">
                YouTube Playlists or Syllabus URLs
              </label>

              {/* Existing links */}
              {links.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xs bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-700 truncate">
                    <Link2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{link}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(idx)}
                    className="p-1.5 rounded-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add link input */}
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={newLinkInput}
                  onChange={(e) => setNewLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                  placeholder="https://youtube.com/playlist?list=... or documentation URL"
                  className="flex-1 px-3.5 py-1.5 rounded-xs bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="px-3 py-1.5 rounded-xs border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs text-zinc-700 font-medium transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add URL</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Course & Flowchart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
