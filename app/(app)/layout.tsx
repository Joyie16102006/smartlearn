import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { GlobalAIAssistant } from "@/components/ai/GlobalAIAssistant";

import { SidebarProvider } from "@/components/layout/SidebarContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        {/* Persistent Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-5 sm:p-7 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Global AI Assistant Floating Button & Tutor Drawer */}
        <GlobalAIAssistant />
      </div>
    </SidebarProvider>
  );
}
