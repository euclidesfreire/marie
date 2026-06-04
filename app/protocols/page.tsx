import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { labelFor } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProtocolsPage() {
  const protocols = await prisma.protocol.findMany({ include: { patient: true }, orderBy: { updatedAt: "desc" } });
  const toneForStatus = (status: string) => status === "APPLIED" || status === "APPROVED" ? "green" : status === "REVIEWED" ? "blue" : "amber";

  return (
    <AppShell title="Protocolos">
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="mb-5 rounded-[18px] border border-border bg-white p-5 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-senac-blue">Plano de cuidado</p>
          <h1 className="mt-1 text-2xl font-semibold text-dark-accent">Protocolos</h1>
          <p className="text-sm text-muted">Protocolos finais aprovados e planos em revisão profissional.</p>
        </div>
        <div className="grid gap-3">
          {protocols.map((protocol) => (
            <Card key={protocol.id} className="p-4">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-dark-accent">{protocol.title}</p>
                <Badge tone={toneForStatus(protocol.status)}>{labelFor(protocol.status)}</Badge>
              </div>
              <p className="text-sm text-muted">{protocol.patient.name}</p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                <Link href={`/patients/${protocol.patientId}/workspace${protocol.appointmentId ? `?appointmentId=${protocol.appointmentId}` : ""}`} className="inline-flex h-9 items-center gap-2 rounded-xl border border-primary bg-primary px-3 text-sm font-medium text-white transition hover:bg-primary-hover">
                  <ArrowUpRight className="h-4 w-4" />Abrir workspace
                </Link>
                <Link href={`/patients/${protocol.patientId}`} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground transition hover:bg-[#F8FAFD]">
                  <FileText className="h-4 w-4" />Ver prontuário
                </Link>
              </div>
            </Card>
          ))}
          {protocols.length === 0 && <Card className="p-8 text-center text-sm text-muted">Nenhum protocolo registrado.</Card>}
        </div>
      </div>
    </AppShell>
  );
}
