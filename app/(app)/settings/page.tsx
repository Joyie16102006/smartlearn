"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Clock,
  Bell,
  Sun,
  Save,
  CheckCircle2,
  User,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("Vitian");
  const [email, setEmail] = useState("student@vitapstudent.ac.in");
  const [preferredTime, setPreferredTime] = useState("6:00 PM");
  const [dailyDuration, setDailyDuration] = useState(60);
  const [learningStyle, setLearningStyle] = useState("visual-practice");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);


  useEffect(() => {
    fetch("/api/user/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          if (data.name) setName(data.name);
          if (data.email) setEmail(data.email);
          if (data.preferredTime) setPreferredTime(data.preferredTime);
          if (data.dailyDuration) setDailyDuration(data.dailyDuration);
          if (data.learningStyle) setLearningStyle(data.learningStyle);
        }
      })
      .catch((err) => console.warn("Failed to load user preferences:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          preferredTime,
          dailyDuration,
          learningStyle,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-200">
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
          Learning Settings
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Configure your learner details, schedule, pacing budget, and preferences. All changes sync directly to Supabase.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
          <span>Loading settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {/* Profile Details */}
          <Card className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-500" />
              <span>Learner Profile Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-white border border-zinc-200 focus:outline-none focus:border-zinc-900 text-zinc-900"
                  placeholder="Your Name"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-white border border-zinc-200 focus:outline-none focus:border-zinc-900 text-zinc-900"
                  placeholder="student@vitapstudent.ac.in"
                  required
                />

              </div>
            </div>
          </Card>

          {/* Schedule & Daily Learning Budget */}
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              <span>Daily Schedule & Target Duration</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Preferred Study Time
                </label>
                <input
                  type="text"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-white border border-zinc-200 focus:outline-none focus:border-zinc-900 text-zinc-900"
                  placeholder="e.g. 6:00 PM"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Daily Pacing Budget (Minutes)
                </label>
                <input
                  type="number"
                  value={dailyDuration}
                  onChange={(e) => setDailyDuration(Number(e.target.value))}
                  min={15}
                  max={240}
                  step={15}
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-white border border-zinc-200 focus:outline-none focus:border-zinc-900 text-zinc-900"
                />
              </div>
            </div>
          </Card>

          {/* Learning Style */}
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Sun className="w-4 h-4 text-zinc-500" />
              <span>Learning Pedagogy Mode</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {[
                { id: "visual-practice", label: "Visual & Practice", desc: "Interactive DAGs & derivations" },
                { id: "formula-first", label: "Formula First", desc: "Mathematical proofs & equations" },
                { id: "code-first", label: "Code & Applied", desc: "Verilog / Python implementations" },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setLearningStyle(style.id)}
                  className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                    learningStyle === style.id
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-400 bg-white"
                  }`}
                >
                  <span className="text-xs font-semibold text-zinc-900 block">{style.label}</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">{style.desc}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Save Action */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {savedSuccess && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Details saved to Supabase database successfully!</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
