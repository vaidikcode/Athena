"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Plus,
  Trash2,
  Loader2,
  ArrowRight,
  Activity,
  Briefcase,
  ScrollText,
  CircleDollarSign,
  HeartHandshake,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const PRIORITY_OPTIONS = [
  { id: "health", label: "Health", Icon: Activity },
  { id: "work", label: "Work", Icon: Briefcase },
  { id: "knowledge", label: "Knowledge", Icon: ScrollText },
  { id: "money", label: "Money", Icon: CircleDollarSign },
  { id: "relations", label: "Relationships", Icon: HeartHandshake },
] as const;

const DEFAULT_RULES = [
  "No meetings before 10 am",
  "Protect 2 hours for deep work daily",
  "Exercise at least 5× per week",
  "1 hour of reading / learning per day",
  "No screens 30 min before sleep",
];

const SOURCES = [
  { id: "notion", label: "Notion", abbr: "N", color: "bg-nb-blue" },
  { id: "slack", label: "Slack", abbr: "S", color: "bg-nb-blue/85" },
  { id: "google-docs", label: "Google Docs", abbr: "G", color: "bg-nb-blue/70" },
  { id: "browser", label: "Browser Hist.", abbr: "B", color: "bg-white text-nb-blue ring-1 ring-inset ring-athens-stone" },
] as const;

export function RulesSetup({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [priorities, setPriorities] = useState<string[]>(["health","work","knowledge"]);
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [deepWorkHours, setDeepWorkHours] = useState("2");

  // Step 2 state
  const [rules, setRules] = useState<string[]>(DEFAULT_RULES);
  const [newRule, setNewRule] = useState("");

  // Step 3 state
  const [connectPhase, setConnectPhase] = useState<"idle"|"connecting"|"done">("idle");
  const [connectedCount, setConnectedCount] = useState(0);

  // Simulate source connections only when entering step 3. Do not depend on `connectPhase`:
  // setting "connecting" would re-run this effect, cleanup would clear the interval, and Notion would stay stuck.
  useEffect(() => {
    if (step !== 3) {
      setConnectPhase("idle");
      setConnectedCount(0);
      return;
    }

    setConnectPhase("connecting");
    setConnectedCount(0);

    const MS_PER_SOURCE = 220;
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setConnectedCount(i);
      if (i >= SOURCES.length) {
        clearInterval(iv);
        setConnectPhase("done");
      }
    }, MS_PER_SOURCE);

    return () => clearInterval(iv);
  }, [step]);

  const togglePriority = (id: string) =>
    setPriorities(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const addRule = () => {
    const r = newRule.trim();
    if (r) { setRules(prev => [...prev, r]); setNewRule(""); }
  };

  const removeRule = (i: number) => setRules(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black/20 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-black bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-black px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-nb-blue text-white">
              <Landmark className="size-4" aria-hidden />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-nb-blue/80">Athena</div>
              <div className="text-lg font-semibold text-nb-blue">Set up your OS</div>
            </div>
            <div className="ml-auto flex gap-1.5">
              {([1,2,3] as Step[]).map(s => (
                <div
                  key={s}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    s === step ? "bg-nb-blue" : s < step ? "bg-nb-blue/40" : "bg-black/20"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 py-7">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-nb-blue">What matters most to you?</h2>
                <p className="mt-1 text-sm font-light text-nb-blue/70">
                  Select your top priorities. Athena will optimise your schedule around these.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePriority(p.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                      priorities.includes(p.id)
                        ? "border-nb-blue bg-nb-cream text-nb-blue ring-1 ring-athens-stone"
                        : "border-black text-nb-blue/80 hover:border-nb-blue/40 hover:bg-nb-cream/50"
                    )}
                  >
                    <p.Icon className="size-4 shrink-0" aria-hidden />
                    {p.label}
                    {priorities.includes(p.id) && <Check className="size-3.5" />}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label:"Wake time",        value:wakeTime,      set:setWakeTime },
                  { label:"Sleep time",       value:sleepTime,     set:setSleepTime },
                  { label:"Deep work (hrs)",  value:deepWorkHours, set:setDeepWorkHours, type:"number" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="mb-1 block text-xs font-medium text-nb-blue/75">{f.label}</label>
                    <input
                      type={f.type ?? "time"}
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      min={f.type === "number" ? "1" : undefined}
                      max={f.type === "number" ? "8" : undefined}
                      className="w-full rounded-lg border border-black px-3 py-2 text-sm text-nb-blue outline-none focus:border-nb-blue focus:ring-2 focus:ring-athens-blue/20"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-nb-blue">Your ground rules</h2>
                <p className="mt-1 text-sm font-light text-nb-blue/70">
                  Rules Athena will protect when planning your schedule. Edit or add your own.
                </p>
              </div>
              <ul className="space-y-2">
                {rules.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg border border-black bg-nb-cream px-3 py-2.5">
                    <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-black/20">
                      <div className="size-1.5 rounded-full bg-nb-blue" />
                    </div>
                    <span className="flex-1 text-sm text-nb-blue">{r}</span>
                    <button type="button" onClick={() => removeRule(i)} className="text-nb-blue/30 transition-colors hover:text-nb-blue">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addRule()}
                  placeholder="Add a rule…"
                  className="flex-1 rounded-lg border border-black px-3 py-2 text-sm text-nb-blue outline-none focus:border-nb-blue focus:ring-2 focus:ring-athens-blue/20"
                />
                <button
                  type="button"
                  onClick={addRule}
                  className="rounded-lg bg-nb-blue px-3 py-2 text-white transition-colors hover:bg-nb-blue/90"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-nb-blue">Connect your data sources</h2>
                <p className="mt-1 text-sm font-light text-nb-blue/70">Athena pulls events from your tools to build your full picture.</p>
              </div>
              <ul className="space-y-3">
                {SOURCES.map((s, i) => {
                  const done = connectedCount > i;
                  const active = connectedCount === i && connectPhase === "connecting";
                  return (
                    <li key={s.id} className="flex items-center gap-3 rounded-xl border border-black bg-nb-cream px-4 py-3">
                      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white", s.color)}>
                        {s.abbr}
                      </div>
                      <span className="flex-1 text-sm font-medium text-nb-blue">{s.label}</span>
                      {done ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-nb-blue">
                          <Check className="size-3.5" /> Connected
                        </span>
                      ) : active ? (
                        <span className="flex items-center gap-1 text-xs text-nb-blue/55">
                          <Loader2 className="size-3.5 animate-spin" /> Connecting…
                        </span>
                      ) : (
                        <span className="text-xs text-nb-blue/40">Waiting…</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {connectPhase === "done" && (
                <div className="rounded-xl border border-black bg-nb-cream px-4 py-3 text-sm font-medium text-nb-blue">
                  All sources connected — 11 events imported
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-black px-8 py-5">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => (s - 1) as Step)}
              className="text-sm font-light text-nb-blue/60 hover:text-nb-blue"
            >
              Back
            </button>
          ) : <div />}
          <button
            type="button"
            disabled={step === 3 && connectPhase !== "done"}
            onClick={() => {
              if (step < 3) { setStep(s => (s + 1) as Step); }
              else { onComplete(); }
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all",
              step === 3 && connectPhase !== "done"
                ? "cursor-not-allowed bg-black/20 text-nb-blue/50"
                : "bg-nb-blue hover:bg-nb-blue/90"
            )}
          >
            {step === 3 ? "Enter Dashboard" : "Next"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
