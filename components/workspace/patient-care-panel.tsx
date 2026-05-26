"use client";

import { CareTabs } from "@/components/workspace/care-tabs";
import { PatientSummaryCard } from "@/components/workspace/patient-summary-card";
import type { MarieAction } from "@/lib/ai/marie-client";

export function PatientCarePanel({
  data,
  activeTab,
  setActiveTab,
  draftAction,
  clearDraftAction,
  mobile = false
}: {
  data: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  draftAction?: MarieAction | null;
  clearDraftAction?: () => void;
  mobile?: boolean;
}) {
  return (
    <aside className={`flex h-full min-h-0 flex-col bg-white ${mobile ? "" : "border-l border-border"}`}>
      <PatientSummaryCard patient={data.patient} appointment={data.currentAppointment} />
      <CareTabs data={data} activeTab={activeTab} setActiveTab={setActiveTab} draftAction={draftAction} clearDraftAction={clearDraftAction} />
    </aside>
  );
}
