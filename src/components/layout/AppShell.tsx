
import type { ReactNode } from "react";
import SidebarRail from "@/components/sidebar/SidebarRail";
import HistoryPanel from "@/components/sidebar/HistoryPanel";
import { useAuth } from "@/components/provider/AuthProvider";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const HISTORY_PINNED_KEY = "sabi_history_pinned";

export default function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  const { user } = useAuth();

  const isAppRoute = pathname.startsWith("/chat") || pathname.startsWith("/history") || pathname.startsWith("/settings");

  const [historyPinned, setHistoryPinned] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(HISTORY_PINNED_KEY) === "true";
  });
  const [historyHover, setHistoryHover] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [historyView, setHistoryView] = useState<"recent" | "archived">("recent");

  useEffect(() => {
    window.localStorage.setItem(HISTORY_PINNED_KEY, String(historyPinned));
  }, [historyPinned]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(() => {
    if (isMobile && historyPinned) {
      setHistoryPinned(false);
    }
  }, [isMobile, historyPinned]);

  useEffect(() => {
    setHistoryHover(false);
  }, [pathname]);

  const showDesktopHistoryPanel = isAppRoute && !isMobile && (historyPinned || historyHover);
  const showMobileHistoryPanel = isAppRoute && isMobile && historyHover;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen w-full overflow-hidden">
        {/* Rail */}
        <aside
          className="w-12 shrink-0 border-r border-border bg-background/80 md:w-14"
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
              "hidden overflow-hidden border-r border-border bg-background/70 backdrop-blur transition-all duration-200 md:block",
              showDesktopHistoryPanel ? "md:w-72" : "md:w-0"
            ].join(" ")
          }
          onMouseEnter={() => setHistoryHover(true)}
          onMouseLeave={() => {
            if (!historyPinned) setHistoryHover(false);
          }}
        >
          {/* Render panel content only when open to avoid unnecessary layout shift */}
          {showDesktopHistoryPanel && (
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

        {showMobileHistoryPanel && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 bg-black/40 md:hidden"
              aria-label="Close history panel"
              onClick={() => setHistoryHover(false)}
            />
            <aside className="fixed inset-y-0 left-12 z-40 w-[min(85vw,18rem)] border-r border-border bg-background/90 backdrop-blur md:hidden">
              <HistoryPanel
                view={historyView}
                pinned={false}
                onTogglePin={() => setHistoryHover(false)}
                onRequestClose={() => setHistoryHover(false)}
              />
            </aside>
          </>
        )}

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
