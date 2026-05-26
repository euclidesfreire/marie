import { prisma } from "@/lib/prisma";
import { apiError, getCurrentUser, parseJson } from "@/lib/utils";
import { executeMarieActionSchema } from "@/lib/validations";
import { appointmentFinishData, appointmentStartData, completeStepAndMaybeAdvance, ensureAppointmentSteps } from "@/lib/care-flow";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const parsed = executeMarieActionSchema.safeParse(await parseJson(request, {}));
  if (!parsed.success) return apiError(parsed.error);

  const { patientId, appointmentId, action } = parsed.data;
  let targetEntity: string | undefined;
  let targetId: string | undefined;
  let result: unknown = { message: "Prévia registrada. Nenhum dado clínico alterado." };

  try {
    const appointment = appointmentId ? await prisma.appointment.findUnique({ where: { id: appointmentId } }) : null;
    const actionStep = (appointment?.currentStep ?? "CARE_PLAN") as any;

    if (action.type === "CREATE_PROTOCOL_SUGGESTION") {
      const payload = action.payload as any;
      const suggestion = await prisma.protocolSuggestion.create({
        data: {
          patientId,
          appointmentId: appointmentId ?? payload.appointmentId ?? null,
          source: "AI",
          title: payload.title ?? "Sugestao assistida de protocolo",
          objective: payload.objective ?? null,
          area: payload.area ?? "FACIAL",
          suggestedActives: payload.suggestedActives ?? null,
          suggestedTechniques: payload.suggestedTechniques ?? null,
          suggestedEquipments: payload.suggestedEquipments ?? null,
          contraindications: payload.contraindications ?? null,
          warnings: payload.warnings ?? null,
          status: "WAITING_REVIEW"
        }
      });
      targetEntity = "ProtocolSuggestion";
      targetId = suggestion.id;
      result = suggestion;
    }

    await prisma.marieSuggestion.create({
      data: {
        patientId,
        appointmentId: appointmentId ?? null,
        step: actionStep,
        type: action.type,
        title: action.title ?? action.type,
        content: action.description ?? null,
        payload: action.payload as object,
        status: "APPLIED",
        appliedAt: new Date()
      }
    });

    if (action.type === "CREATE_EVOLUTION") {
      const payload = action.payload as any;
      const evolution = await prisma.evolution.create({
        data: {
          patientId,
          appointmentId: appointmentId ?? payload.appointmentId ?? null,
          summary: payload.summary ?? "Evolução criada pela Marie para revisão profissional.",
          patientResponse: payload.patientResponse ?? null,
          professionalNotes: payload.professionalNotes ?? null,
          adjustmentsMade: payload.adjustmentsMade ?? null,
          nextSteps: payload.nextSteps ?? null
        }
      });
      targetEntity = "Evolution";
      targetId = evolution.id;
      result = evolution;
    }

    if (action.type === "CREATE_CLINICAL_NOTE") {
      const payload = action.payload as any;
      const note = await prisma.clinicalNote.create({
        data: {
          patientId,
          professionalId: user.id,
          origin: "AI",
          content: payload.content ?? "Nota assistida criada pela Marie."
        }
      });
      targetEntity = "ClinicalNote";
      targetId = note.id;
      result = note;
    }

    if (action.type === "UPDATE_APPOINTMENT_NOTES") {
      if (!appointmentId) return apiError(new Error("appointmentId é obrigatório para atualizar atendimento."));
      const payload = action.payload as any;
      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          conduct: payload.conduct ?? undefined,
          evaluation: payload.evaluation ?? undefined
        }
      });
      targetEntity = "Appointment";
      targetId = appointment.id;
      result = appointment;
    }

    if (action.type === "START_APPOINTMENT") {
      const appointment = appointmentId
        ? await prisma.appointment.update({ where: { id: appointmentId }, data: appointmentStartData() })
        : await prisma.appointment.create({ data: { patientId, professionalId: user.id, ...appointmentStartData() } });
      await ensureAppointmentSteps(appointment.id, appointment.currentStep);
      targetEntity = "Appointment";
      targetId = appointment.id;
      result = appointment;
    }

    if (action.type === "FINISH_APPOINTMENT") {
      if (!appointmentId) return apiError(new Error("appointmentId é obrigatório para finalizar atendimento."));
      const appointment = await prisma.appointment.update({ where: { id: appointmentId }, data: appointmentFinishData() });
      targetEntity = "Appointment";
      targetId = appointment.id;
      result = appointment;
    }

    if (action.type === "SEND_SUGGESTION_TO_VALIDATION") {
      const suggestion = await prisma.protocolSuggestion.findFirst({ where: { patientId, appointmentId: appointmentId ?? undefined }, orderBy: { createdAt: "desc" } });
      if (!suggestion) return apiError(new Error("Nenhuma sugestão encontrada para enviar à validação."));
      const updated = await prisma.protocolSuggestion.update({ where: { id: suggestion.id }, data: { status: "WAITING_REVIEW" } });
      if (appointmentId) await completeStepAndMaybeAdvance(appointmentId, "CARE_PLAN");
      targetEntity = "ProtocolSuggestion";
      targetId = updated.id;
      result = updated;
    }

    if (action.type === "APPROVE_SUGGESTION") {
      const suggestion = await prisma.protocolSuggestion.findFirst({ where: { patientId, appointmentId: appointmentId ?? undefined }, orderBy: { createdAt: "desc" } });
      if (!suggestion) return apiError(new Error("Nenhuma sugestão encontrada para aprovar."));
      const validation = await prisma.professionalValidation.upsert({
        where: { suggestionId: suggestion.id },
        create: { suggestionId: suggestion.id, professionalId: user.id, decision: "APPROVED", justification: "Aprovado via ação confirmada da Marie." },
        update: { decision: "APPROVED", justification: "Aprovado via ação confirmada da Marie." }
      });
      await prisma.protocolSuggestion.update({ where: { id: suggestion.id }, data: { status: "APPROVED" } });
      const protocol = await prisma.protocol.create({
        data: {
          patientId,
          appointmentId: appointmentId ?? suggestion.appointmentId,
          title: suggestion.title,
          objective: suggestion.objective,
          indication: suggestion.suggestedTechniques,
          contraindications: suggestion.contraindications,
          postProcedureCare: suggestion.warnings,
          source: suggestion.source === "AI" ? "AI_ASSISTED" : "MANUAL",
          status: "APPROVED"
        }
      });
      if (appointmentId) await completeStepAndMaybeAdvance(appointmentId, "CARE_PLAN", "EXECUTION");
      targetEntity = "Protocol";
      targetId = protocol.id;
      result = { validation, protocol };
    }

    if (action.type === "CREATE_FINAL_PROTOCOL") {
      const suggestion = await prisma.protocolSuggestion.findFirst({ where: { patientId, appointmentId: appointmentId ?? undefined }, orderBy: { createdAt: "desc" } });
      if (!suggestion) return apiError(new Error("Nenhuma sugestão encontrada para criar protocolo final."));
      const protocol = await prisma.protocol.create({
        data: {
          patientId,
          appointmentId: appointmentId ?? suggestion.appointmentId,
          title: suggestion.title,
          objective: suggestion.objective,
          indication: suggestion.suggestedTechniques,
          contraindications: suggestion.contraindications,
          postProcedureCare: suggestion.warnings,
          source: suggestion.source === "AI" ? "AI_ASSISTED" : "MANUAL",
          status: "APPROVED"
        }
      });
      if (appointmentId) await completeStepAndMaybeAdvance(appointmentId, "CARE_PLAN", "EXECUTION");
      targetEntity = "Protocol";
      targetId = protocol.id;
      result = protocol;
    }

    const log = await prisma.marieActionLog.create({
      data: {
        patientId,
        appointmentId: appointmentId ?? null,
        professionalId: user.id,
        actionType: action.type,
        targetEntity,
        targetId,
        status: "APPLIED",
        payload: action.payload as object,
        result: result as object,
        confirmedAt: new Date()
      }
    });

    return Response.json({ ok: true, log, result });
  } catch (error) {
    await prisma.marieActionLog.create({
      data: {
        patientId,
        appointmentId: appointmentId ?? null,
        professionalId: user.id,
        actionType: action.type,
        status: "FAILED",
        payload: action.payload as object,
        result: { error: error instanceof Error ? error.message : "Erro desconhecido" }
      }
    });
    return apiError(error);
  }
}
