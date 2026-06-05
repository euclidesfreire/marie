import { Badge } from "@/components/ui/badge";
import { labelFor } from "@/lib/labels";
import { calculateAge } from "@/lib/utils";

export function PatientSummaryCard({ patient, appointment, compact = false }: { patient: any; appointment?: any; compact?: boolean }) {
  return (
    <div className={`border-b border-border bg-white ${compact ? "px-3 py-2" : "p-4 2xl:p-5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-senac-blue">Paciente</p>
          <h2 className={`${compact ? "text-base" : "mt-1 text-lg"} font-semibold tracking-tight text-dark-accent`}>{patient.name}</h2>
          <p className={`${compact ? "text-xs" : "mt-0.5 text-sm"} text-muted`}>{calculateAge(patient.birthDate)} anos</p>
        </div>
        <Badge tone={appointment?.status === "IN_PROGRESS" ? "amber" : appointment?.status === "FINISHED" ? "green" : "slate"}>{appointment ? labelFor(appointment.status) : "Sem atendimento"}</Badge>
      </div>
    </div>
  );
}
