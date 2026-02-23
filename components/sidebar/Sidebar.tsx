"use client";

import { Search, Plus, Clock, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

const mockChats = [
  { id: "1", title: "Analyze sales performance by region" },
  { id: "2", title: "Top distributors in my region" },
  { id: "3", title: "Top performing SKUs" },
];

export default function Sidebar() {
  const router = useRouter();

  const newChat = () => {
    localStorage.removeItem("currentChat");
    router.push("/chat");
  };

  return (
    <div className="flex h-full flex-col p-3">

      {/* Logo */}
      <div className="mb-4 text-lg font-bold">SAIA</div>

      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold tracking-tight">
          History
        </div>
        <Button 
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"
          onClick={newChat}
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Search */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border px-3 py-2">
        <Search className="h-4 w-4 " />
        <input
          placeholder="Search"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-zinc-500 outline-none"
        />
        <kbd className="rounded-md border  px-2 py-0.5 text-[10px] text-foreground">
          K
        </kbd>
      </div>


      {/* Chat list */}
      <ul className="mt-4 min-h-0 flex-1 space-y-4 overflow-auto pr-1">
        
        {mockChats.map((c) => (
          <li
            key={c.id}
            className="flex items-start w-full gap-2 rounded-xl px-3 py-2  text-sm text-foreground"
          >
            <MessageSquare className="h-4 w-4 text-foreground/70" />
            <span className="line-clamp-1">
              {c.title.length > 20 ? `${c.title.slice(0, 30)}...` : c.title}
            </span>
          </li>
        ))}

      </ul>

      {/* Bottom */}
      <div className="mt-3 border-t pt-3 text-xs text-foreground/70">
        SABI AI Analytics
      </div>
    </div>
  );
}
