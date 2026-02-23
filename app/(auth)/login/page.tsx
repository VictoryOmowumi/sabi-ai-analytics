"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/provider/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/chat");
  }, [loading, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Enter your username and password.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Login failed");
      }

      await refresh();
      router.replace("/chat");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message || "Login failed" : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left editorial panel */}
        <div className="relative hidden lg:block overflow-hidden border-r border-border/60">
          {/* subtle texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(255,255,255,0.04),_transparent_55%)]" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:56px_56px]" />

          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border border-border/60 bg-card/40 grid place-items-center">
                <Image src="/saia-logo-white.png" alt="SAIA" width={32} height={32} />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">SABI AI Analytics</div>
                <div className="text-xs text-muted-foreground">Internal intelligence assistant</div>
              </div>
            </div>

            <div className="max-w-md">
              <div className="text-5xl font-semibold tracking-tight">
                Ask better questions.
                <span className="text-muted-foreground"> Get clearer answers.</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Explore customers, distributors, regions, and KPIs with natural language — powered by your data team’s AI service.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {["Customers", "Sales", "Regions", "Trends"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border/60 bg-card/30 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Seven-Up Bottling Company Ltd
            </div>
          </div>
        </div>

        {/* Right auth panel */}
        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-xl">
            <div className="mb-6 lg:hidden flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border border-border/60 bg-card/40 grid place-items-center">
                <Image src="/saia-logo-white.png" alt="SAIA" width={32} height={32} />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">SABI AI Analytics</div>
                <div className="text-xs text-muted-foreground">Sign in</div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Use your work credentials to continue.
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-xs text-muted-foreground">Username</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. ade.balogun"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-muted-foreground">Password</label>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button className="w-full rounded-2xl" disabled={submitting}>
                  {submitting ? "Signing in..." : "Sign in"}
                </Button>

              </form>
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              Having issues? Contact MIS Support.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}