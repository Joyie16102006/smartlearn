"use client";

import React, { useState } from "react";
import { mockUserProfile } from "@/data/mockData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Clock,
  Bell,
  Sun,
  Save,
  CheckCircle2,
  User,
} from "lucide-react";

export default function SettingsPage() {
  const [preferredTime, setPreferredTime] = useState("6:00 PM");
  const [dailyDuration, setDailyDuration] = useState(60);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Learning Settings
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Configure your daily schedule, pacing budget, notification preferences, and interface mode.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Profile Snapshot */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-500" />
            <span>Learner Profile</span>
          </h2>

          <div className="flex items-center gap-3.5 pt-1">
            <img
              src={mockUserProfile.avatarUrl}
              alt={mockUserProfile.name}
              className="w-11 h-11 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
            />
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {mockUserProfile.name}
              </h3>
              <p className="text-xs text-zinc-500 font-mono">{mockUserProfile.email}</p>
              <div className="flex items-center gap-1.5 pt-1">
                <Badge variant="neutral" size="sm">Active Cohort</Badge>
                <Badge variant="outline" size="sm">Level 2</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Schedule & Daily Learning Budget */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
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
                className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 text-zinc-900 dark:text-zinc-100"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Time when daily mission reminder is dispatched.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Daily Duration (Minutes)
              </label>
              <input
                type="number"
                min={15}
                max={240}
                step={15}
                value={dailyDuration}
                onChange={(e) => setDailyDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 text-zinc-900 dark:text-zinc-100 font-mono"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Standard: 60 min (20m Learn, 15m Resource, 10m Practice, 10m Quiz, 5m Revision)
              </p>
            </div>
          </div>
        </Card>

        {/* Notifications & Automation */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-zinc-500" />
            <span>Automated Notifications & Reminders</span>
          </h2>

          <div className="space-y-2.5">
            <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer">
              <div>
                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 block">
                  Daily Mission Reminders
                </span>
                <span className="text-[11px] text-zinc-500">
                  Receive an alert 15 minutes before your scheduled study session.
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-500 accent-zinc-900"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer">
              <div>
                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 block">
                  Streak Protection Alerts
                </span>
                <span className="text-[11px] text-zinc-500">
                  Evening notification if your daily session has not been completed.
                </span>
              </div>
              <input
                type="checkbox"
                checked={streakReminders}
                onChange={(e) => setStreakReminders(e.target.checked)}
                className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-500 accent-zinc-900"
              />
            </label>
          </div>
        </Card>

        {/* Theme Preferences */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sun className="w-4 h-4 text-zinc-500" />
            <span>Interface Mode</span>
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            {(["system", "light", "dark"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTheme(t)}
                className={`py-2 px-3 rounded-lg text-xs font-medium capitalize border transition-colors text-center ${
                  theme === t
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
                }`}
              >
                {t} Mode
              </button>
            ))}
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Preferences saved successfully.</span>
            </span>
          ) : (
            <span className="text-[11px] text-zinc-400 font-mono">Synchronized across active sessions</span>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
