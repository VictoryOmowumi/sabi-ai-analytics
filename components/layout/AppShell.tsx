"use client";

import type { ReactNode } from "react";
import SidebarRail from "@/components/sidebar/SidebarRail";
import HistoryPanel from "@/components/sidebar/HistoryPanel";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/provider/AuthProvider";
import { useState } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // user details to pass to sidebar rail for avatar + greeting (optional)
  const { user } = useAuth();

  // Only show history panel on app pages (optional)
  const isAppRoute = pathname.startsWith("/chat") || pathname.startsWith("/history") || pathname.startsWith("/settings");

  const [historyPinned, setHistoryPinned] = useState(false);
  const [historyHover, setHistoryHover] = useState(false);
  const [historyView, setHistoryView] = useState<"recent" | "archived">("recent");

  const showHistoryPanel = isAppRoute && (historyPinned || historyHover);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen w-full overflow-hidden">
        {/* Rail */}
        <aside
          className="w-14 border-r border-border bg-background/80"
        >
          <SidebarRail
            historyPinned={historyPinned}
            historyView={historyView}
            setHistoryPinned={setHistoryPinned}
            setHistoryHover={setHistoryHover}
            setHistoryView={setHistoryView}
            userInfo={user}
          />
        </aside>

        {/* Slide-out panel (History) with smooth animation */}
        <aside
          className={
            [
              "transition-all duration-200 overflow-hidden border-r border-border bg-background/70 backdrop-blur",
              showHistoryPanel ? "w-72" : "w-0"
            ].join(" ")
          }
          onMouseEnter={() => setHistoryHover(true)}
          onMouseLeave={() => {
            if (!historyPinned) setHistoryHover(false);
          }}
        >
          {/* Render panel content only when open to avoid unnecessary layout shift */}
          {showHistoryPanel && (
            <HistoryPanel
              view={historyView}
              pinned={historyPinned}
              onTogglePin={() => setHistoryPinned((p) => !p)}
              onRequestClose={() => {
                if (!historyPinned) setHistoryHover(false);
              }}
            />
          )}
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
