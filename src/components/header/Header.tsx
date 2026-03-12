
import { useMemo, useState } from "react";
import { Copy, Moon, Power, RefreshCcw, Share2, Sun } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useTheme } from "@/components/provider/ThemeProvider";
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
  const shareTooltip = canShare && sharePath ? "Share chat" : "Share unavailable for this chat";

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
    <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="max-w-[42vw] truncate text-xs text-muted-foreground sm:text-sm">
        {user?.displayName ? `Hi, ${user.displayName}` : "SABI AI"}
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        {onNewChat && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onNewChat}
                aria-label="New chat"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              New chat
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            Toggle theme
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 px-0 text-xs sm:w-auto sm:px-3"
                onClick={() => setShareOpen(true)}
                disabled={!canShare || !sharePath}
                aria-label="Share chat"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            {shareTooltip}
          </TooltipContent>
        </Tooltip>
        {onLogout && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 px-0 text-xs sm:w-auto sm:px-3"
                onClick={() => void onLogout()}
                aria-label="Logout"
              >
                <Power className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              Logout
            </TooltipContent>
          </Tooltip>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void onCopyShareLink()}
                    disabled={!shareUrl}
                    aria-label="Copy share link"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                Copy link
              </TooltipContent>
            </Tooltip>
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}
