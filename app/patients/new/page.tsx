import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PatientForm } from "@/components/patients/patient-form";

export default function NewPatientPage() {
  return (
    <AppShell title="Pacientes">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <Card>
          <CardHeader>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-senac-blue">Cadastro</p>
            <h1 className="mt-1 text-xl font-semibold text-dark-accent">Novo paciente</h1>
            <p className="text-sm text-muted">Crie o cadastro base para iniciar anamnese e atendimentos.</p>
          </CardHeader>
          <CardContent><PatientForm /></CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
