"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./Sidebar";
import { cn } from "@/components/ui/button";

export function MobileNav() {
  const pathname = usePathname();

  // Pick top 5 items for mobile bottom bar
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {mobileItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors",
              isActive ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-500 dark:text-gray-400"
            )}
          >
            <Icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400")} />
            <span className="truncate max-w-[60px]">{item.label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
