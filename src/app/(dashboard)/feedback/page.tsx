"use client";

import { Star, TrendingUp, TrendingDown, CheckCircle2, XCircle, AlertCircle, Activity, CircleDollarSign, HeartHandshake } from "lucide-react";
import { MOCK_POINTS, MOCK_METRICS, MOCK_RELATIONSHIPS } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const DAILY_FEEDBACK = {
  date: "April 17, 2026",
  overallScore: 68,
  summary:
    "Solid knowledge day, but money and health tasks were deprioritised again. Your focus blocks were interrupted by 3 unplanned Slack messages — worth creating a DND rule for deep work hours.",
  wins: [
    "Completed 2 deep work sessions (product spec, research)",
    "Consistent learning — 45 min reading block completed",
    "Mentor call with Dev — relationship score up 6pts",
  ],
  misses: [
    "Skipped workout (4th time this week → health score declining)",
    "Investor deck postponed again — money score down 15pts",
    "No family contact logged (5-day gap)",
  ],
  suggestions: [
    { Icon: Activity, text: "Schedule a 30-min walk tomorrow morning before standup to break the exercise streak." },
    { Icon: CircleDollarSign, text: "Block 60 min tomorrow at 11am exclusively for Investor Deck — move Dev Sync 30 min earlier." },
    { Icon: HeartHandshake, text: "Send one message to family today. Even a quick check-in resets the relationship clock." },
  ],
};

const WEEK_SCORES = [72, 68, 85, 55, 78, 63, 68];
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function barTone(score: number, isToday: boolean): string {
  if (isToday) return "bg-athens-blue ring-2 ring-athens-stone";
  if (score >= 70) return "bg-athens-blue";
  if (score >= 50) return "bg-athens-blue/55";
  return "bg-athens-stone";
}

export default function FeedbackPage() {
  const today = new Date();
  const dayIdx = (today.getDay() + 6) % 7;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <div>
          <h1 className="text-athens-display text-athens-blue">Daily Feedback</h1>
          <p className="text-athens-small mt-0.5 font-light text-athens-blue/70">Yesterday · {DAILY_FEEDBACK.date}</p>
        </div>

        <div className="m-2 p-2">
          <div className="border border-athens-stone bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg width="80" height="80" className="-rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#dcdbd5" strokeWidth="8" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="8"
                    strokeDasharray={`${(DAILY_FEEDBACK.overallScore / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-athens-blue">{DAILY_FEEDBACK.overallScore}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Star className="size-4 fill-athens-blue/25 text-athens-blue" aria-hidden />
                  <span className="text-sm font-semibold text-athens-blue">Overall day score</span>
                </div>
                <p className="text-sm font-light leading-relaxed text-athens-blue/85">{DAILY_FEEDBACK.summary}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="m-2 p-2">
          <div className="border border-athens-stone bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-athens-blue">This week</h3>
            <div className="flex h-20 items-end gap-2">
              {WEEK_SCORES.map((s, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={cn("w-full rounded-t-sm", barTone(s, i === dayIdx))}
                    style={{ height: `${s}%` }}
                  />
                  <span className="text-[10px] font-light text-athens-blue/55">{WEEK_DAYS[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="m-2 p-2">
            <div className="border border-athens-stone bg-athens-highlight p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-athens-blue">
                <CheckCircle2 className="size-4" aria-hidden /> Wins
              </h3>
              <ul className="space-y-2">
                {DAILY_FEEDBACK.wins.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-light text-athens-blue">
                    <div className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border border-athens-stone bg-athens-blue">
                      <div className="size-1 rounded-full bg-white" />
                    </div>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="m-2 p-2">
            <div className="border border-athens-stone bg-athens-highlight p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-athens-blue">
                <XCircle className="size-4" aria-hidden /> Misses
              </h3>
              <ul className="space-y-2">
                {DAILY_FEEDBACK.misses.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-light text-athens-blue/85">
                    <div className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border border-athens-stone bg-athens-stone">
                      <div className="size-1 rounded-full bg-athens-blue" />
                    </div>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-athens-blue">
            <AlertCircle className="size-4 text-athens-blue/70" aria-hidden /> Athena recommends
          </h3>
          <div className="space-y-3">
            {DAILY_FEEDBACK.suggestions.map((s, i) => {
              const SIcon = s.Icon;
              return (
                <div
                  key={i}
                  className="m-2 flex items-start gap-3 border border-athens-stone bg-white p-2 shadow-sm"
                >
                  <div className="m-1 flex shrink-0 items-center justify-center border border-athens-stone bg-athens-highlight p-2 text-athens-blue">
                    <SIcon className="size-5" aria-hidden />
                  </div>
                  <p className="text-sm font-light leading-relaxed text-athens-blue/90">{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-athens-blue">Metric snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(MOCK_POINTS).map(([k, v]) => (
              <div
                key={k}
                className="m-2 flex items-center gap-3 border border-athens-stone bg-white p-2 shadow-sm"
              >
                <div className="flex-1 p-2">
                  <div className="text-xs font-semibold capitalize text-athens-blue">{k}</div>
                  <div className="text-sm font-bold text-athens-blue">
                    {v.value}/{v.max}
                  </div>
                </div>
                {v.trend === "up" ? (
                  <TrendingUp className="size-4 text-athens-blue" />
                ) : (
                  <TrendingDown className="size-4 text-athens-blue/50" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="m-2 border border-athens-stone bg-athens-highlight p-4 text-athens-small font-light text-athens-blue/75">
          Streak context: {MOCK_METRICS.streakDays} day run · relationships sampled: {MOCK_RELATIONSHIPS.length} ties.
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
