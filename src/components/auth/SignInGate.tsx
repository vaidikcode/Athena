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
      <div className="flex h-screen min-h-0 flex-col items-center justify-center gap-3 bg-nb-cream text-black">
        <Loader2 className="size-6 animate-spin text-nb-blue" aria-hidden />
        <span className="text-sm font-bold">One moment…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-nb-cream px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border-[3px] border-black bg-white p-8 shadow-nb">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border-[3px] border-black bg-nb-yellow shadow-nb mb-5">
                <Zap className="size-7 text-black" aria-hidden />
              </div>
              <h1 className="text-2xl font-black text-black">Sign in to Athena</h1>
              <p className="mt-1.5 text-sm font-bold text-black/50">Schedule OS — intelligence for your day</p>
            </div>

            <div className="mt-8">
              <GoogleAccountForm />
            </div>

            <p className="mt-6 text-center text-xs font-bold leading-relaxed text-black/40">
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
