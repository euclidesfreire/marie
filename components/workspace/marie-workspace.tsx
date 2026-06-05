"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, Stethoscope } from "lucide-react";
import type { MarieAction } from "@/lib/ai/marie-client";
import { Button } from "@/components/ui/button";
import { CommandSidebar } from "@/components/workspace/command-sidebar";
import { MarieChat } from "@/components/workspace/marie-chat";
import { PatientCarePanel } from "@/components/workspace/patient-care-panel";
import { careTabToStep, getMarieActionTargetStep, stepToCareTab } from "@/lib/ai/marie-action-drafts";

export function MarieWorkspace({ data }: { data: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => data.currentAppointment ? stepToCareTab(data.currentAppointment.currentStep) : "Preparação");
  const [mobileView, setMobileView] = useState<"assistant" | "care">("assistant");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [draftAction, setDraftAction] = useState<MarieAction | null>(null);
  const activeStep = data.currentAppointment ? careTabToStep(activeTab) : "PREPARATION";

  function editAction(action: MarieAction) {
    setDraftAction(action);
    setActiveTab(stepToCareTab(getMarieActionTargetStep(action, data.currentAppointment?.currentStep ?? "ANAMNESIS")));
    setMobileView("care");
  }

  return (
    <div className="h-[calc(100dvh-64px)] overflow-hidden bg-background">
      <div className="flex h-full min-h-0 overflow-hidden">
        <div className={`hidden h-full shrink-0 transition-[width] duration-200 lg:block ${sidebarCollapsed ? "w-[72px]" : "w-[300px]"}`}>
          <CommandSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
        </div>
        <main className="hidden min-w-0 flex-1 border-l border-white/10 lg:block">
          <MarieChat data={data} currentStep={activeStep} onApplied={() => router.refresh()} onEditAction={editAction} />
        </main>
        <div className="hidden h-full w-[560px] shrink-0 bg-white shadow-[-18px_0_44px_rgba(10,61,145,0.08)] xl:w-[620px] 2xl:w-[640px] lg:block">
          <PatientCarePanel data={data} activeTab={activeTab} setActiveTab={setActiveTab} draftAction={draftAction} clearDraftAction={() => setDraftAction(null)} />
        </div>

        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col lg:hidden">
          <div className="flex items-center gap-2 border-b border-border bg-white px-3 py-2 shadow-sm">
            <Button size="icon" variant="ghost" onClick={() => setSidebarOpen(true)}><Menu className="h-4 w-4" /></Button>
            <button onClick={() => setMobileView("assistant")} className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${mobileView === "assistant" ? "bg-senac-blue text-white" : "text-muted"}`}>Assistente</button>
            <button onClick={() => setMobileView("care")} className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${mobileView === "care" ? "bg-senac-blue text-white" : "text-muted"}`}><Stethoscope className="mr-1 inline h-4 w-4" />Atendimento</button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {mobileView === "assistant" && <MarieChat data={data} currentStep={activeStep} onApplied={() => router.refresh()} onEditAction={editAction} />}
            {mobileView === "care" && <PatientCarePanel data={data} activeTab={activeTab} setActiveTab={setActiveTab} draftAction={draftAction} clearDraftAction={() => setDraftAction(null)} mobile />}
          </div>
        </div>
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/30 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="h-full w-[284px] max-w-[82vw]" onClick={(event) => event.stopPropagation()}>
            <CommandSidebar />
          </div>
        </div>
      )}
    </div>
  );
}
