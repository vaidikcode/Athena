"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { loadSessionUser, subscribeSessionChange } from "@/lib/client/user-session";
import { GoogleAccountForm } from "@/components/auth/GoogleAccountForm";
import { VisitBackgroundJobs } from "@/components/jobs/VisitBackgroundJobs";

export function SignInGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof loadSessionUser>>(null);

  const refresh = useCallback(() => {
    setUser(loadSessionUser());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    return subscribeSessionChange(refresh);
  }, [refresh]);

  if (!ready) {
    return (
      <div className="flex h-screen min-h-0 flex-col items-center justify-center gap-2 bg-surface-base text-ink-subtle">
        <Loader2 className="size-6 animate-spin text-brand-600" aria-hidden />
        <span className="text-sm">One moment…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-base px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-surface-border bg-white p-8 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand-600 shadow-sm mb-4">
                <Zap className="size-6 text-white" aria-hidden />
              </div>
              <h1 className="text-xl font-bold text-ink">Sign in to Phuko</h1>
              <p className="mt-1.5 text-sm text-ink-subtle">Schedule OS — intelligence for your day</p>
            </div>

            <div className="mt-8">
              <GoogleAccountForm />
            </div>

            <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
              One account for Calendar, Rules, and the AI console.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <VisitBackgroundJobs />
      {children}
    </>
  );
}
