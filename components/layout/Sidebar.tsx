"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Compass,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockUserProfile } from "@/data/mockData";
import { useSidebar } from "@/components/layout/SidebarContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Courses", href: "/dashboard", icon: BookOpen },
  { name: "Plan Today", href: "/learn", icon: Compass, badge: "Day 8" },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <>
      {/* ── COLLAPSED FLOATING TRIGGER (Visible when sidebar is hidden) ── */}
      {isCollapsed && (
        <button
          onClick={toggleSidebar}
          title="Open SmartLearn Sidebar"
          className="fixed top-2.5 left-3 z-50 flex items-center gap-2 px-2.5 py-1.5 bg-white border border-zinc-300 hover:border-zinc-900 rounded-sm shadow-sm transition-all group cursor-pointer animate-in fade-in slide-in-from-left duration-200"
        >
          <div className="w-5 h-5 rounded-xs bg-zinc-900 group-hover:bg-zinc-800 flex items-center justify-center text-white font-bold text-[10px] shadow-2xs">
            SL
          </div>
          <span className="font-semibold text-xs tracking-tight text-zinc-900 group-hover:text-black">
            SmartLearn
          </span>
          <PanelLeftOpen className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 transition-colors ml-0.5" />
        </button>
      )}

      {/* ── SLIDING SIDEBAR ASIDE ── */}
      <aside
        className={cn(
          "border-r border-zinc-200 bg-white flex flex-col h-screen sticky top-0 shrink-0 z-40 select-none transition-all duration-300 ease-in-out",
          isCollapsed
            ? "-ml-56 w-56 -translate-x-full opacity-0 pointer-events-none"
            : "ml-0 w-56 translate-x-0 opacity-100 shadow-sm"
        )}
      >
        {/* Brand Header with interactive SmartLearn Icon Toggle */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200">
          <button
            onClick={toggleSidebar}
            title="Click to hide sidebar"
            className="flex items-center gap-2.5 p-1 -ml-1 rounded-sm hover:bg-zinc-100 transition-colors text-left group cursor-pointer flex-1"
          >
            <div className="w-6 h-6 rounded-sm bg-zinc-900 group-hover:bg-zinc-800 flex items-center justify-center text-white font-bold text-xs shadow-2xs transition-colors">
              SL
            </div>
            <div className="flex items-center justify-between flex-1 pr-1">
              <span className="font-semibold text-sm tracking-tight text-zinc-900 group-hover:text-black">
                SmartLearn
              </span>
              <PanelLeftClose className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 transition-colors" />
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors",
                  isActive
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 text-[10px] font-mono rounded-xs",
                      isActive
                        ? "bg-zinc-800 text-zinc-200"
                        : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile Glance */}
        <div className="p-3 border-t border-zinc-200 bg-zinc-50/50">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-zinc-100 transition-colors group"
          >
            <img
              src={mockUserProfile.avatarUrl}
              alt={mockUserProfile.name}
              className="w-7 h-7 rounded-sm object-cover border border-zinc-200 grayscale contrast-125"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-900 group-hover:text-black transition-colors truncate">
                {mockUserProfile.name}
              </p>
              <p className="text-[10px] text-zinc-500 truncate font-mono">
                7d Streak · Student
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};
