"use client";

import { AuthProvider } from "./AuthProvider";
import { ThemeProvider } from "next-themes";
import { ChatProvider } from "./ChatProvider";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <ChatProvider>
        {children}
        </ChatProvider>
        </AuthProvider>
    </ThemeProvider>
  );
}
