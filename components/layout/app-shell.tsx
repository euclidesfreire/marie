"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children, status, title = "Dashboard" }: { children: React.ReactNode; status?: string; title?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Topbar context={title} status={status} onMenuClick={() => setOpen(true)} />
      <div className="flex min-h-[calc(100vh-64px)]">
        <div className="hidden shrink-0 lg:block">
          <Sidebar />
        </div>
        <main className="w-full min-w-0">{children}</main>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[1px] lg:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-[284px] max-w-[82vw]" onClick={(event) => event.stopPropagation()}>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
