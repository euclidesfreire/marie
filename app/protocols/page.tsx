import Link from "next/link";
import { ArrowUpRight, FileText, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { labelFor } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProtocolsPage() {
  const protocols = await prisma.protocol.findMany({
    include: {
      patient: true,
      appointment: { include: { assessment: true } },
      steps: { orderBy: { order: "asc" } }
    },
    orderBy: { updatedAt: "desc" }
  });
  const toneForStatus = (status: string) => status === "APPLIED" || status === "APPROVED" ? "green" : status === "REVIEWED" ? "blue" : "amber";
  const sourceLabel = (source: string) => source === "AI_ASSISTED" ? "Marie AI" : "Manual";

  function protocolArea(protocol: (typeof protocols)[number]) {
    const assessedArea = protocol.appointment?.assessment?.assessedArea;
    if (assessedArea === "FACIAL" || assessedArea === "BODY" || assessedArea === "BOTH") return assessedArea;
    const text = `${protocol.title} ${protocol.indication ?? ""}`.toLowerCase();
    if (["corporal", "gordura", "celulite", "flacidez corporal", "drenagem", "detox corporal", "modelador"].some((term) => text.includes(term))) return "BODY";
    if (["facial", "pele", "acne", "melasma", "glow", "anti-idade", "peeling", "ledterapia"].some((term) => text.includes(term))) return "FACIAL";
    return "BOTH";
  }

  const groups = [
    { key: "FACIAL", title: "Faciais", description: "Protocolos para pele, acne, manchas, rejuvenescimento e revitalização." },
    { key: "BODY", title: "Corporais", description: "Tratamentos para gordura localizada, celulite, flacidez, drenagem e detox." },
    { key: "BOTH", title: "Ambos", description: "Planos que podem apoiar mais de uma área avaliada." }
  ] as const;

  return (
    <AppShell title="Protocolos e Tratamentos">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-5 rounded-[18px] border border-border bg-white p-5 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-senac-blue">Plano de cuidado</p>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-dark-accent">Protocolos e Tratamentos</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Biblioteca de protocolos assistidos pela Marie e planos aprovados para pacientes.</p>
            </div>
            <Badge tone="blue">{protocols.length} registros</Badge>
          </div>
        </div>

        <div className="space-y-6">
          {groups.map((group) => {
            const items = protocols.filter((protocol) => protocolArea(protocol) === group.key);
            if (!items.length) return null;
            return (
              <section key={group.key} className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-dark-accent">{group.title}</h2>
                  <p className="text-sm text-muted">{group.description}</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {items.map((protocol) => (
                    <Card key={protocol.id} className="flex min-h-[260px] flex-col p-4">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-dark-accent">{protocol.title}</p>
                          <p className="mt-1 text-xs text-muted">Paciente relacionado: <span className="font-medium text-foreground">{protocol.patient.name}</span></p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={toneForStatus(protocol.status)}>{labelFor(protocol.status)}</Badge>
                          <Badge tone={protocol.source === "AI_ASSISTED" ? "blue" : "slate"}>{sourceLabel(protocol.source)}</Badge>
                        </div>
                      </div>

                      <div className="grid flex-1 gap-3 text-sm">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Objetivo</p>
                          <p className="mt-1 leading-6 text-foreground">{protocol.objective || "Não informado"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Indicação</p>
                          <p className="mt-1 leading-6 text-foreground">{protocol.indication || "Não informado"}</p>
                        </div>
                        {protocol.steps.length > 0 && (
                          <div className="rounded-xl border border-border bg-[#F8FAFD] px-3 py-2">
                            <p className="flex items-center gap-2 text-xs font-semibold text-senac-blue"><Sparkles className="h-3.5 w-3.5" />{protocol.steps.length} etapas do protocolo</p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{protocol.steps.map((step) => step.title).join(" · ")}</p>
                          </div>
                        )}
                      </div>

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
                </div>
              </section>
            );
          })}
          {protocols.length === 0 && (
            <Card className="p-8 text-center">
              <p className="font-semibold text-dark-accent">Nenhum protocolo registrado ainda.</p>
              <p className="mt-1 text-sm text-muted">Os planos aprovados no workspace e os tratamentos assistidos pela Marie aparecerão aqui.</p>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
