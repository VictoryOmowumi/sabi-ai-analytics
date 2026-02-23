"use client";

import { useMemo, useState } from "react";
import { Copy, Moon, Power, RefreshCcw, Share2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

type HeaderProps = {
  user?: { displayName?: string } | null;
  onNewChat?: () => void;
  onLogout?: () => void | Promise<void>;
  sharePath?: string | null;
  canShare?: boolean;
};

export default function Header({
  user,
  onNewChat,
  onLogout,
  sharePath,
  canShare = true,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [shareOpen, setShareOpen] = useState(false);

  const shareUrl = useMemo(() => {
    if (!sharePath) return "";
    if (/^https?:\/\//i.test(sharePath)) return sharePath;
    if (typeof window === "undefined") return sharePath;

    try {
      return new URL(sharePath, window.location.origin).toString();
    } catch {
      return sharePath;
    }
  }, [sharePath]);

  const onCopyShareLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="text-sm text-muted-foreground">
        {user?.displayName ? `Hi, ${user.displayName}` : "SABI AI"}
      </div>
      <div className="flex items-center gap-2">
        {onNewChat && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onNewChat}
            aria-label="New chat"
            title="New chat"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => setShareOpen(true)}
          disabled={!canShare || !sharePath}
          aria-label="Share chat"
          title={canShare && sharePath ? "Share chat" : "Share unavailable for this chat"}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        {onLogout && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => void onLogout()}
            aria-label="Logout"
            title="Logout"
          >
            <Power className="h-4 w-4" />
            Logout
          </Button>
        )}
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Chat</DialogTitle>
            <DialogDescription>
              Copy this link to open this chat directly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input value={shareUrl} readOnly />
            <Button
              type="button"
              variant="outline"
              onClick={() => void onCopyShareLink()}
              disabled={!shareUrl}
              aria-label="Copy share link"
              title="Copy link"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}
