"use client";

import { Archive, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useChatState } from "../provider/ChatProvider";
import { Avatar } from "../ui/avatar";
import { useTheme } from "next-themes";
export default function SidebarRail({
  // historyPinned,
  historyView,
  // setHistoryPinned,
  setHistoryHover,
  setHistoryView,
  userInfo,
}: {
  historyPinned: boolean;
  historyView: "recent" | "archived";
  setHistoryPinned: (v: boolean) => void;
  setHistoryHover: (v: boolean) => void;
  setHistoryView: (v: "recent" | "archived") => void;
  userInfo?: { displayName?: string } | null;
}) {
  const router = useRouter();
  const { newChat } = useChatState();
   const { theme} = useTheme();
  const isDark = theme === "dark";

  const onNewChat = () => {
    newChat();
    router.push("/chat");
  };

  return (
    <div className="flex h-full flex-col items-center justify-between py-3">
      <div className="mb-4 text-xs font-semibold tracking-tight">
        <Image src={isDark ? "/saia-logo-black.png" : "/saia-logo-white.png"} 
        
        alt="Logo" width={28} height={28} />
      </div>
      <div className="flex flex-col items-start h-full">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={onNewChat}
          aria-label="New chat"
          title="New chat"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <button
          className={[
            "mt-2 flex h-10 w-10 items-center justify-center rounded-xl",
            historyView === "recent"
              ? "bg-muted/50 text-foreground"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
          ].join(" ")}
          onMouseEnter={() => {
            setHistoryView("recent");
            setHistoryHover(true);
          }}
          onClick={() => {
            setHistoryView("recent");
            setHistoryHover(true);
          }}
          aria-label="History"
          title="History"
        >
          <History className="h-4 w-4" />
        </button>

        <button
          className={[
            "mt-2 flex h-10 w-10 items-center justify-center rounded-xl",
            historyView === "archived"
              ? "bg-muted/50 text-foreground"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
          ].join(" ")}
          onMouseEnter={() => {
            setHistoryView("archived");
            setHistoryHover(true);
          }}
          onClick={() => {
            setHistoryView("archived");
            setHistoryHover(true);
          }}
          aria-label="Archived chats"
          title="Archived chats"
        >
          <Archive className="h-4 w-4" />
        </button>
      </div>

      {/* Optional: User avatar at bottom of rail */}
      <div className="mt-2">
        <Avatar className="h-10 w-10 rounded-full bg-muted text-sm font-medium text-foreground flex items-center justify-center">
          {userInfo?.displayName ? (
            <span>{userInfo.displayName.slice(0, 2).toUpperCase()}</span>
          ) : (
            <span>U</span>
          )}
        </Avatar>
      </div>
    </div>
  );
}
