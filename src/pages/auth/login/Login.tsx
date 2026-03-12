import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { useAuth } from "@/components/provider/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api/auth";
import { Eye, EyeClosed } from "lucide-react";
import googleIcon from "@/assets/google.svg";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, refresh } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/chat", { replace: true });
  }, [loading, user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Enter your username and password.");
      return;
    }

    try {
      setSubmitting(true);
      await login({ username, password });
      await refresh();
      navigate("/chat", { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message || "Login failed" : "Login failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden border-r border-border/60 lg:block">
          <DottedGlowBackground
            className="pointer-events-none mask-radial-to-90% mask-radial-at-center opacity-20 dark:opacity-100"
            opacity={0.5}
            gap={10}
            radius={1.1}
            colorLightVar="--color-neutral-500"
            glowColorLightVar="--color-neutral-600"
            colorDarkVar="--color-neutral-500"
            glowColorDarkVar="--color-sky-800"
            backgroundOpacity={0}
            speedMin={0.3}
            speedMax={1.6}
            speedScale={1}
          />
          <div className="relative z-10 flex h-full flex-col justify-between p-10">
            <div className="flex items-center gap-3">
              <div className="">
                <img
                  src="/saia-logo-white.png"
                  alt="SAIA"
                  width={64}
                  height={64}
                />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">
                  SABI AI Analytics
                </div>
                <div className="text-xs text-muted-foreground">
                  Internal intelligence assistant
                </div>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="text-6xl font-semibold tracking-tight">
                Ask better questions.
                <span className="text-muted-foreground">
                  {" "}
                  Get clearer answers.
                </span>
              </div>
              <p className="ml-1 mt-3 text-sm text-muted-foreground">
                Explore customers, distributors, regions, and KPIs with natural
                language <br /> — powered by SABI AI service.
              </p>

              <div className="my-6 flex flex-wrap gap-2">
                {["Customers", "Sales", "Regions", "Trends"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border/60 bg-card/30 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-10 text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Seven-Up Bottling Company Ltd
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 h-full  ">
          <div className="w-full lg:w-4/5 flex flex-col justify-between mx-auto h-full border-dashed-2 border-border/60">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-border/60 bg-card/40">
                <img
                  src="/saia-logo-white.png"
                  alt="SAIA"
                  width={32}
                  height={32}
                />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">
                  SABI AI Analytics
                </div>
                <div className="text-xs text-muted-foreground">Sign in</div>
              </div>
            </div>

            <div className="h-full flex flex-col justify-center rounded-3xl border border-border/60 bg-card/30 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Use your work credentials to continue.
              </p>

              <form onSubmit={onSubmit} className="mt-12 space-y-4">
                <div>
                  <label className="mb-2 block text-xs text-muted-foreground">
                    Username
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. hello.you@sevenup.org"
                    autoComplete="username"
                    className="h-10!"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-muted-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="h-10! pr-10"
                    />
                    <button
                      className="absolute inset-y-0 right-3 inline-flex items-center text-muted-foreground transition hover:text-foreground"
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeClosed size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button className="w-full mt-4 h-10!" disabled={submitting}>
                  {submitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>
              <div className="flex items-center justify-center my-6">
                <div className="flex-1 w-1/2 h-[0.1px] bg-border"></div>
                <p className="text-sm text-muted-foreground px-2">or</p>
                <div className="flex-1 w-1/2 h-[0.1px] bg-border"></div>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                className="mt-2 h-10 w-full"
              >
                <img src={googleIcon} alt="Google" className="w-4 h-4" />
                Sign in with Google
              </Button>
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
