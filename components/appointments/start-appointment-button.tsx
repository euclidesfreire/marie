"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StartAppointmentButton({ patientId, hasInProgress, inProgressId }: { patientId: string; hasInProgress: boolean; inProgressId?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function start() {
    if (hasInProgress && inProgressId) {
      setMessage("Este paciente já possui um atendimento em andamento.");
      return;
    }
    const response = await fetch(`/api/patients/${patientId}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" })
    });
    if (!response.ok) return setMessage("Não foi possível iniciar o atendimento.");
    const appointment = await response.json();
    router.push(`/patients/${patientId}/workspace?appointmentId=${appointment.id}`);
  }

  return (
    <div className="space-y-2">
      <Button variant="primary" className="w-full" disabled={isPending} onClick={() => startTransition(() => void start())}>
        <Play className="h-4 w-4" />
        Iniciar atendimento
      </Button>
      {message && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p>{message}</p>
          {inProgressId && <Button size="sm" className="mt-2" onClick={() => router.push(`/patients/${patientId}/workspace?appointmentId=${inProgressId}`)}>Continuar atendimento</Button>}
        </div>
      )}
    </div>
  );
}
