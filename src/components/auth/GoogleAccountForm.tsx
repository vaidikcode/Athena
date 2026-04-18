"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { saveSessionUser, type SessionUser } from "@/lib/client/user-session";

type Props = {
  onSuccess?: () => void;
  className?: string;
};

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "User";
  if (!local) return "User";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function GoogleAccountForm({ onSuccess, className }: Props) {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const em = email.trim();
    const pw = password;
    if (!em || !pw) {
      setError("Enter your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("Enter a valid email address.");
      return;
    }
    if (pw.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    const user: SessionUser = {
      email: em,
      displayName: displayNameFromEmail(em),
      signedAt: new Date().toISOString(),
    };
    saveSessionUser(user);
    setPassword("");
    setError(null);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {error ? (
        <p className="rounded-md border border-athens-stone bg-athens-highlight px-3 py-2 text-sm font-medium text-athens-blue">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor={emailId} className="block text-sm font-medium text-athens-blue">
          Email or phone
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-athens-stone bg-white px-3 py-2.5 text-sm text-athens-blue shadow-sm outline-none transition focus:border-athens-blue focus:ring-2 focus:ring-athens-blue/20"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label htmlFor={passwordId} className="block text-sm font-medium text-athens-blue">
          Password
        </label>
        <input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-athens-stone bg-white px-3 py-2.5 text-sm text-athens-blue shadow-sm outline-none transition focus:border-athens-blue focus:ring-2 focus:ring-athens-blue/20"
          placeholder="Enter your password"
        />
      </div>

      <button
        type="submit"
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-athens-stone bg-white",
          "text-sm font-medium text-athens-blue shadow-sm transition hover:bg-athens-highlight"
        )}
      >
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{
            background: "conic-gradient(from 180deg, #EA4335, #FBBC05, #34A853, #4285F4, #EA4335)",
          }}
          aria-hidden
        >
          G
        </span>
        Sign in
      </button>
    </form>
  );
}
