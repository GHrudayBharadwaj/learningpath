import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { FloatingAiAssistant } from "@/components/ai/FloatingAiAssistant";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Navbar userName={user?.name || "Demo Student"} userEmail={user?.email || "demo@studyplanner.ai"} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
        <MobileNav />
      </div>
      <FloatingAiAssistant />
    </div>
  );
}
