"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { mockUserProfile } from "@/data/mockData";

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="h-14 border-b border-zinc-200 bg-white sticky top-0 z-10 px-6 flex items-center justify-between">
      {/* Left: Search Bar & Mobile toggle */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 rounded-md text-zinc-600 hover:bg-zinc-100 transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search concepts, courses, formulas..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-white text-zinc-900 placeholder-zinc-400 font-normal transition-colors"
          />
        </div>
      </div>

      {/* Right Controls: Quick Add (+) + Profile Glance */}
      <div className="flex items-center gap-2.5">
        {/* Quick Add Button */}
        <Link
          href="/courses/new"
          className="h-8 px-2.5 rounded-md border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 flex items-center gap-1.5 text-xs font-medium transition-colors"
          title="Add New Course"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New</span>
        </Link>

        {/* Notifications */}
        <button
          className="relative w-8 h-8 rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-600 flex items-center justify-center transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-zinc-900" />
        </button>

        {/* Profile Glance */}
        <Link
          href="/settings"
          className="flex items-center gap-2 pl-2 border-l border-zinc-200 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-2xs border border-zinc-800">
            V
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-zinc-900 block leading-tight">
              Profile
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block">
              Vitian
            </span>
          </div>
        </Link>

      </div>
    </header>
  );
};
