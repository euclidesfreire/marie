import { Activity, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { marieTreatmentKnowledge, treatmentConcernOptions, type MarieProtocolKey } from "@/lib/ai/marie-knowledge-base";
import { proceduresForCategory } from "@/lib/ai/marie-procedure-catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function protocolTone(area: string) {
  return area === "FACIAL" ? "blue" : "amber";
}

function procedureSummary(key: MarieProtocolKey) {
  const protocol = marieTreatmentKnowledge[key];
  const catalog = proceduresForCategory(key, protocol.area);
  const byRole = catalog.reduce<Record<string, number>>((summary, procedure) => {
    summary[procedure.role] = (summary[procedure.role] ?? 0) + 1;
    return summary;
  }, {});

  return { catalog, byRole };
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    manual: "manual",
    equipment: "equipamento",
    peeling: "peeling",
    electrotherapy: "eletroterapia",
    laser_light: "luz/laser",
    massage: "massagem",
    thermal: "térmico",
    homecare: "home care"
  };
  return labels[role] ?? role;
}

export default async function ProtocolsPage() {
  const appliedProtocols = await prisma.protocol.findMany({
    select: { title: true, status: true },
    where: { status: { in: ["APPROVED", "APPLIED", "REVIEWED"] } }
  });

  const appliedByTitle = appliedProtocols.reduce<Record<string, number>>((summary, protocol) => {
    const text = protocol.title.toLowerCase();
    for (const item of treatmentConcernOptions) {
      const labelTokens = item.label.toLowerCase().split(/[ /]+/).filter((token) => token.length > 4);
      if (labelTokens.some((token) => text.includes(token))) {
        summary[item.value] = (summary[item.value] ?? 0) + 1;
      }
    }
    return summary;
  }, {});

  const groups = [
    {
      key: "FACIAL",
      title: "Tratamentos faciais",
      description: "Protocolos mapeados na Marie para acne, manchas, rejuvenescimento, olheiras, flacidez e terapias faciais."
    },
    {
      key: "BODY",
      title: "Tratamentos corporais",
      description: "Protocolos mapeados na Marie para gordura localizada, estrias, celulite, flacidez, clareamento corporal e relaxamento."
    }
  ] as const;

  return (
    <AppShell title="Protocolos e Tratamentos">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="mb-5 rounded-[18px] border border-border bg-white p-5 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-senac-blue">Biblioteca Marie</p>
          <div className="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-dark-accent">Protocolos e Tratamentos</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
                Catálogo dos tratamentos e procedimentos possíveis que a Marie usa para sugerir planos. A Marie sugere; a profissional valida.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="blue">{treatmentConcernOptions.filter((item) => item.area === "FACIAL").length} faciais</Badge>
              <Badge tone="amber">{treatmentConcernOptions.filter((item) => item.area === "BODY").length} corporais</Badge>
              <Badge tone="green">{appliedProtocols.length} planos em pacientes</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {groups.map((group) => {
            const items = treatmentConcernOptions.filter((item) => item.area === group.key);

            return (
              <section key={group.key} className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-dark-accent">{group.title}</h2>
                  <p className="text-sm text-muted">{group.description}</p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {items.map((item) => {
                    const protocol = marieTreatmentKnowledge[item.value];
                    const { catalog, byRole } = procedureSummary(item.value);
                    const appliedCount = appliedByTitle[item.value] ?? 0;

                    return (
                      <Card key={item.value} className="flex min-h-[420px] flex-col p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{item.description}</p>
                            <h3 className="mt-1 text-lg font-semibold text-dark-accent">{item.label}</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge tone={protocolTone(protocol.area)}>{protocol.area === "FACIAL" ? "Facial" : "Corporal"}</Badge>
                            <Badge tone="blue">Marie AI</Badge>
                            {appliedCount > 0 && <Badge tone="green">{appliedCount} em uso</Badge>}
                          </div>
                        </div>

                        <div className="mt-4 grid flex-1 gap-4">
                          <div>
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-senac-blue">
                              <Sparkles className="h-3.5 w-3.5" /> Objetivo
                            </p>
                            <p className="mt-1 text-sm leading-6 text-foreground">{protocol.objective}</p>
                          </div>

                          <div>
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-senac-blue">
                              <Activity className="h-3.5 w-3.5" /> Procedimentos mapeados
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {protocol.techniques.map((technique) => (
                                <span key={technique} className="rounded-full border border-border bg-[#F8FAFD] px-3 py-1 text-xs font-medium text-foreground">
                                  {technique}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-border bg-[#F8FAFD] p-3">
                              <p className="text-xs font-semibold text-dark-accent">Equipamentos/recursos</p>
                              <p className="mt-1 text-xs leading-5 text-muted">{protocol.equipments.join(", ")}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-[#F8FAFD] p-3">
                              <p className="text-xs font-semibold text-dark-accent">Tipos no catálogo</p>
                              <p className="mt-1 text-xs leading-5 text-muted">
                                {Object.entries(byRole).map(([role, count]) => `${count} ${roleLabel(role)}`).join(" · ") || `${catalog.length} procedimentos`}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                            <p className="flex items-center gap-2 text-xs font-semibold text-warning">
                              <AlertTriangle className="h-3.5 w-3.5" /> Contraindicações e cautelas
                            </p>
                            <p className="mt-1 text-xs leading-5 text-amber-900">{protocol.contraindications.join(", ")}</p>
                          </div>

                          <div className="rounded-xl border border-green-200 bg-green-50/70 p-3">
                            <p className="flex items-center gap-2 text-xs font-semibold text-success">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Cuidados pós
                            </p>
                            <p className="mt-1 text-xs leading-5 text-green-900">{protocol.homeCare.join(", ")}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
