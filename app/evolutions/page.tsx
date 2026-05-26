import { AppShell } from "@/components/layout/app-shell";
import { EvolutionTimeline } from "@/components/evolutions/evolution-timeline";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EvolutionsPage() {
  const [patients, evolutions] = await Promise.all([
    prisma.patient.findMany({ orderBy: { name: "asc" } }),
    prisma.evolution.findMany({ include: { patient: true, appointment: true }, orderBy: { createdAt: "desc" } })
  ]);

  return (
    <AppShell title="Evoluções">
      <div className="mx-auto max-w-5xl p-6">
        <EvolutionTimeline patients={patients} evolutions={evolutions} />
      </div>
    </AppShell>
  );
}
