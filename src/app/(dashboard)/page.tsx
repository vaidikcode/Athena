"use client";

import { useState } from "react";
import { Flame, Zap } from "lucide-react";
import { loadSessionUser } from "@/lib/client/user-session";
import { MOCK_METRICS } from "@/lib/mock/data";
import { ConsistencyGraph } from "@/components/dashboard/ConsistencyGraph";
import { VitalStats } from "@/components/dashboard/VitalStats";
import { PointsGrid } from "@/components/dashboard/PointsGrid";
import { RelationshipsPanel } from "@/components/dashboard/RelationshipsPanel";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { DataSourcesPanel } from "@/components/dashboard/DataSourcesPanel";
import { MetricModal } from "@/components/dashboard/MetricModal";

type ModalState = { metric: string; value: number; max: number } | null;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const user = typeof window !== "undefined" ? loadSessionUser() : null;
  const name = user?.displayName ?? "there";
  const [modal, setModal] = useState<ModalState>(null);

  const openModal = (metric: string, value: number, max: number) => setModal({ metric, value, max });

  return (
    <>
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-y-auto px-5 py-5 space-y-5 bg-nb-cream">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border-[3px] border-black bg-nb-yellow shadow-nb mt-0.5 shrink-0">
                <Zap className="size-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black tracking-tight">
                  {greeting()}, {name}
                </h1>
                <p className="text-sm font-bold text-black/50 mt-0.5">Your schedule overview for today.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border-[3px] border-black bg-nb-yellow px-3.5 py-1.5 shrink-0 shadow-nb-sm">
              <Flame className="size-4 text-black shrink-0" />
              <span className="text-sm font-black text-black">{MOCK_METRICS.streakDays} day streak</span>
            </div>
          </div>

          <ConsistencyGraph />
          <VitalStats onMetricClick={openModal} />
          <PointsGrid onMetricClick={openModal} />
          <RelationshipsPanel onMetricClick={openModal} />
          <DataSourcesPanel />
          <div className="h-6" />
        </div>

        {/* Right — calendar */}
        <div className="w-72 shrink-0 overflow-y-auto border-l-[3px] border-black bg-white px-4 py-5">
          <CalendarWidget />
        </div>
      </div>

      {modal && (
        <MetricModal
          metric={modal.metric}
          value={modal.value}
          max={modal.max}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
