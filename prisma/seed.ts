import { PrismaClient, type AppointmentStep, type AppointmentStepStatus, type AssessmentArea, type ProtocolStatus } from "@prisma/client";

const prisma = new PrismaClient();

const stepOrder: AppointmentStep[] = ["PREPARATION", "ANAMNESIS", "ASSESSMENT", "CARE_PLAN", "EXECUTION", "EVOLUTION", "COMPLETION"];

type DemoProtocolStep = {
  title: string;
  description: string;
  product?: string;
  duration?: string;
  notes?: string;
};

type DemoProtocol = {
  patientId: string;
  appointmentId?: string;
  title: string;
  objective: string;
  indication: string;
  contraindications: string;
  postProcedureCare: string;
  status: ProtocolStatus;
  source?: "AI_ASSISTED" | "MANUAL";
  steps: DemoProtocolStep[];
};

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function stepStatesFor(currentStep: AppointmentStep, needsReview: AppointmentStep[] = []) {
  const currentIndex = stepOrder.indexOf(currentStep);

  return stepOrder.map((step, index) => {
    let status: AppointmentStepStatus = "PENDING";
    if (index < currentIndex) status = "COMPLETED";
    if (step === currentStep) status = "CURRENT";
    if (needsReview.includes(step)) status = "NEEDS_REVIEW";

    return {
      step,
      status,
      completedAt: status === "COMPLETED" ? daysFromNow(-2) : null,
      reopenedAt: status === "NEEDS_REVIEW" ? daysFromNow(-1) : null,
      reviewedAt: status === "COMPLETED" ? daysFromNow(-1) : null,
      notes: status === "NEEDS_REVIEW" ? "Etapa marcada para revisão após ajuste no atendimento." : null
    };
  });
}

async function clearDatabase() {
  await prisma.marieActionLog.deleteMany();
  await prisma.marieMessage.deleteMany();
  await prisma.marieSuggestion.deleteMany();
  await prisma.appointmentFollowUp.deleteMany();
  await prisma.clinicalNote.deleteMany();
  await prisma.evolution.deleteMany();
  await prisma.protocolStep.deleteMany();
  await prisma.protocol.deleteMany();
  await prisma.appointmentExecution.deleteMany();
  await prisma.technicalAdjustment.deleteMany();
  await prisma.professionalValidation.deleteMany();
  await prisma.protocolSuggestion.deleteMany();
  await prisma.appointmentStepState.deleteMany();
  await prisma.aestheticAssessment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.anamnesis.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
}

async function createStepStates(appointmentId: string, currentStep: AppointmentStep, needsReview: AppointmentStep[] = []) {
  await prisma.appointmentStepState.createMany({
    data: stepStatesFor(currentStep, needsReview).map((state) => ({ ...state, appointmentId }))
  });
}

async function createProtocol(data: DemoProtocol) {
  const protocol = await prisma.protocol.create({
    data: {
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      title: data.title,
      objective: data.objective,
      indication: data.indication,
      contraindications: data.contraindications,
      postProcedureCare: data.postProcedureCare,
      source: data.source ?? "AI_ASSISTED",
      status: data.status
    }
  });

  await prisma.protocolStep.createMany({
    data: data.steps.map((step, index) => ({
      protocolId: protocol.id,
      order: index + 1,
      title: step.title,
      description: step.description,
      product: step.product,
      duration: step.duration,
      notes: step.notes
    }))
  });

  return protocol;
}

async function addMarieConversation(patientId: string, appointmentId: string, professionalId: string, items: Array<{ role: "USER" | "ASSISTANT" | "SYSTEM"; content: string }>) {
  await prisma.marieMessage.createMany({
    data: items.map((item) => ({ ...item, patientId, appointmentId }))
  });

  await prisma.marieActionLog.create({
    data: {
      patientId,
      appointmentId,
      professionalId,
      actionType: "REVIEW_CONTRAINDICATIONS",
      targetEntity: "AestheticAssessment",
      status: "CONFIRMED",
      payload: { source: "demo", note: "Marie revisou riscos e lembrou que a decisao final e profissional." },
      result: { warning: "Revisao exibida como apoio, sem aplicar conduta automaticamente." },
      confirmedAt: daysFromNow(-1)
    }
  });
}

async function main() {
  await clearDatabase();

  const professional = await prisma.user.create({
    data: {
      name: "Aluno Senac",
      email: "estetica@senac.br",
      role: "PROFESSIONAL"
    }
  });

  const larissa = await prisma.patient.create({
    data: {
      professionalId: professional.id,
      name: "Larissa Oliveira",
      birthDate: new Date("2001-04-12"),
      phone: "(91) 98821-1001",
      email: "larissa.oliveira@example.com",
      gender: "Feminino",
      document: "001.223.445-10",
      notes: "Paciente jovem, busca controle de oleosidade com rotina simples.",
      status: "ACTIVE"
    }
  });

  await prisma.anamnesis.create({
    data: {
      patientId: larissa.id,
      chiefComplaint: "Cravos, oleosidade intensa e algumas lesoes inflamadas na zona T.",
      treatmentGoal: "Controlar oleosidade, reduzir comedoes e melhorar textura sem sensibilizar.",
      allergies: "Nega alergias conhecidas.",
      medications: "Nao usa medicação continua.",
      preExistingConditions: "Sem condicoes relevantes relatadas.",
      previousProcedures: "Limpeza de pele ha cerca de 6 meses.",
      skinType: "Acneica",
      skinSensitivity: "Moderada",
      contraindications: "Uso recente de acidos em casa; evitar procedimento agressivo se houver ardor.",
      habits: "Rotina irregular de skincare e fotoprotecao.",
      notes: "Confirmar uso de acidos, frequencia de filtro solar e tolerancia antes de peelings."
    }
  });

  const larissaAppointment = await prisma.appointment.create({
    data: {
      patientId: larissa.id,
      professionalId: professional.id,
      date: daysFromNow(0),
      dailyComplaint: "Acne e oleosidade",
      evaluation: "Comedoes em zona T, oleosidade difusa e algumas lesoes inflamadas leves.",
      conduct: "Preparar sugestao de plano de cuidado para revisao profissional.",
      status: "IN_PROGRESS",
      currentStep: "CARE_PLAN",
      startedAt: daysFromNow(0)
    }
  });
  await createStepStates(larissaAppointment.id, "CARE_PLAN");
  await prisma.aestheticAssessment.create({
    data: {
      appointmentId: larissaAppointment.id,
      assessedArea: "FACIAL",
      primaryTreatmentConcern: "facial_acne",
      primaryFinding: "Comedões/cravos",
      mainFinding: "Comedões/cravos",
      photoprotection: "Usa irregularmente",
      sunExposure: "Moderada",
      acidUse: "Sim",
      acidRetinoidUse: "Sim",
      sensitizingMedication: "Não",
      structuredContraindications: "Uso recente de ácidos",
      structuredHabits: "Exposição solar frequente",
      professionalAnalysis: "Acne comedoniana com oleosidade predominante e sensibilidade moderada.",
      skinCondition: "Pele acneica, oleosa e com textura irregular.",
      bodyCondition: "Nao avaliado.",
      perceivedRisks: "Sensibilizacao por uso recente de acidos.",
      technicalNotes: "Priorizar limpeza, alta frequencia e fotobiomodulacao; avaliar peeling apenas se houver tolerancia."
    }
  });

  const larissaSuggestion = await prisma.protocolSuggestion.create({
    data: {
      patientId: larissa.id,
      appointmentId: larissaAppointment.id,
      source: "AI",
      title: "Preencher plano de cuidado para acne e oleosidade",
      objective: "Apoiar controle de oleosidade, reducao de comedoes e melhora gradual da textura.",
      area: "FACIAL",
      suggestedActives: "Niacinamida, ativos calmantes e seborreguladores conforme avaliacao profissional.",
      suggestedTechniques: "Higienizacao, limpeza de pele com extracao se indicada, peeling ultrassonico, alta frequencia e fotobiomodulacao.",
      suggestedEquipments: "Peeling ultrassonico, alta frequencia e LED/fotobiomodulacao.",
      contraindications: "Confirmar uso de acidos, sensibilidade ativa, alergias e uso de isotretinoina.",
      warnings: "Sugestao simulada para apoio ao profissional. A decisao final deve ser validada pelo profissional responsavel.",
      status: "WAITING_REVIEW"
    }
  });

  await addMarieConversation(larissa.id, larissaAppointment.id, professional.id, [
    { role: "USER", content: "Marie, gere um plano inicial para acne e oleosidade." },
    { role: "ASSISTANT", content: "Pelo registro atual, a indicacao principal e acne. Preparei uma sugestao conservadora considerando uso recente de acidos e sensibilidade moderada." }
  ]);

  await prisma.marieActionLog.create({
    data: {
      patientId: larissa.id,
      appointmentId: larissaAppointment.id,
      professionalId: professional.id,
      actionType: "CREATE_PROTOCOL_SUGGESTION",
      targetEntity: "ProtocolSuggestion",
      targetId: larissaSuggestion.id,
      status: "APPLIED",
      payload: { title: larissaSuggestion.title, requiresConfirmation: true },
      result: { suggestionId: larissaSuggestion.id, status: larissaSuggestion.status },
      confirmedAt: daysFromNow(0)
    }
  });

  const helena = await prisma.patient.create({
    data: {
      professionalId: professional.id,
      name: "Helena Duarte",
      birthDate: new Date("1988-09-26"),
      phone: "(91) 98144-2202",
      email: "helena.duarte@example.com",
      gender: "Feminino",
      document: "002.334.556-20",
      notes: "Paciente refere manchas recorrentes e exposicao solar frequente.",
      status: "ACTIVE"
    }
  });

  await prisma.anamnesis.create({
    data: {
      patientId: helena.id,
      chiefComplaint: "Manchas faciais em região malar, piora apos sol.",
      treatmentGoal: "Uniformizar tom da pele com seguranca e rotina de fotoprotecao.",
      allergies: "Relata ardor com alguns cosmeticos perfumados.",
      medications: "Anticoncepcional oral.",
      preExistingConditions: "Melasma referido, sem laudo dermatologico recente.",
      previousProcedures: "Peeling superficial ha 1 ano.",
      skinType: "Mista",
      skinSensitivity: "Alta",
      contraindications: "Fotoprotecao irregular e exposicao solar frequente.",
      habits: "Exposicao solar no trajeto diario; usa filtro apenas alguns dias.",
      notes: "Antes de clareadores, reforcar fotoprotecao e barreira cutanea."
    }
  });

  const helenaAppointment = await prisma.appointment.create({
    data: {
      patientId: helena.id,
      professionalId: professional.id,
      date: daysFromNow(1),
      dailyComplaint: "Melasma e manchas",
      evaluation: "Manchas difusas em malares, pele sensivel e fotoprotecao irregular.",
      conduct: "Revisar riscos antes de plano clareador.",
      status: "IN_PROGRESS",
      currentStep: "ASSESSMENT",
      startedAt: daysFromNow(0)
    }
  });
  await createStepStates(helenaAppointment.id, "ASSESSMENT");
  await prisma.aestheticAssessment.create({
    data: {
      appointmentId: helenaAppointment.id,
      assessedArea: "FACIAL",
      primaryTreatmentConcern: "facial_clareamento",
      primaryFinding: "Melasma",
      mainFinding: "Melasma",
      photoprotection: "Usa irregularmente",
      sunExposure: "Frequente",
      acidUse: "Não",
      acidRetinoidUse: "Não",
      sensitizingMedication: "Não",
      structuredContraindications: "Sensibilidade intensa",
      structuredHabits: "Exposição solar frequente",
      professionalAnalysis: "Caso clareador exige cautela por exposicao solar e sensibilidade.",
      skinCondition: "Pele mista, sensivel, hipercromia difusa.",
      bodyCondition: "Nao avaliado.",
      perceivedRisks: "Risco de irritacao e piora de hipercromia se houver agressividade.",
      technicalNotes: "Evitar promessa de resultado; iniciar com orientacao e preparo."
    }
  });

  const helenaSuggestion = await prisma.protocolSuggestion.create({
    data: {
      patientId: helena.id,
      appointmentId: helenaAppointment.id,
      source: "AI",
      title: "Plano clareador conservador para melasma",
      objective: "Organizar cuidado progressivo com foco em barreira cutanea e fotoprotecao.",
      area: "FACIAL",
      suggestedActives: "Ativos clareadores suaves e hidratantes reparadores conforme avaliacao.",
      suggestedTechniques: "Fototerapia, microcorrentes e peeling ultrassonico apenas se houver tolerancia.",
      suggestedEquipments: "Fototerapia e recursos suaves; evitar agressividade inicial.",
      contraindications: "Exposicao solar frequente, fotoprotecao irregular e sensibilidade alta.",
      warnings: "A conduta depende de validacao profissional e adesao rigorosa a fotoprotecao.",
      status: "REJECTED"
    }
  });
  await prisma.professionalValidation.create({
    data: {
      suggestionId: helenaSuggestion.id,
      professionalId: professional.id,
      decision: "REJECTED",
      justification: "Paciente ainda nao aderiu a fotoprotecao diaria.",
      criticalAnalysis: "Antes de protocolo clareador, reforcar orientacao e revisar rotina domiciliar."
    }
  });

  const beatriz = await prisma.patient.create({
    data: {
      professionalId: professional.id,
      name: "Beatriz Ramos",
      birthDate: new Date("1985-05-18"),
      phone: "(91) 98455-3303",
      email: "beatriz.ramos@example.com",
      gender: "Feminino",
      document: "003.445.667-30",
      notes: "Paciente busca rejuvenescimento progressivo com aspecto natural.",
      status: "ACTIVE"
    }
  });
  await prisma.anamnesis.create({
    data: {
      patientId: beatriz.id,
      chiefComplaint: "Fotoenvelhecimento, perda de viço e flacidez leve.",
      treatmentGoal: "Melhorar firmeza, luminosidade e textura sem downtime importante.",
      allergies: "Nega alergias.",
      medications: "Nao usa medicamentos sensibilizantes.",
      preExistingConditions: "Sem condicoes relevantes.",
      previousProcedures: "Limpeza de pele e LEDterapia anterior com boa tolerancia.",
      skinType: "Mista",
      skinSensitivity: "Baixa",
      contraindications: "Nenhuma informada.",
      habits: "Usa fotoprotecao diariamente; ingestao de agua moderada.",
      notes: "Boa candidata para protocolo progressivo de firmeza facial."
    }
  });

  const beatrizAppointment = await prisma.appointment.create({
    data: {
      patientId: beatriz.id,
      professionalId: professional.id,
      date: daysFromNow(-10),
      dailyComplaint: "Fotoenvelhecimento e flacidez leve",
      evaluation: "Linhas finas, textura irregular e leve perda de firmeza mandibular.",
      conduct: "Protocolo aplicado e evolucao registrada.",
      status: "FINISHED",
      currentStep: "COMPLETION",
      startedAt: daysFromNow(-10),
      finishedAt: daysFromNow(-9)
    }
  });
  await createStepStates(beatrizAppointment.id, "COMPLETION");
  await prisma.aestheticAssessment.create({
    data: {
      appointmentId: beatrizAppointment.id,
      assessedArea: "FACIAL",
      primaryTreatmentConcern: "facial_rejuvenescimento",
      primaryFinding: "Linhas finas",
      mainFinding: "Linhas finas",
      photoprotection: "Usa diariamente",
      sunExposure: "Baixa",
      acidUse: "Não",
      acidRetinoidUse: "Não",
      sensitizingMedication: "Não",
      structuredContraindications: "Nenhuma informada",
      structuredHabits: "Nenhum relevante informado",
      professionalAnalysis: "Fotoenvelhecimento leve com boa adesao domiciliar.",
      skinCondition: "Pele mista, hidratacao preservada, linhas finas.",
      bodyCondition: "Nao avaliado.",
      perceivedRisks: "Baixo risco com protocolo gradual.",
      technicalNotes: "Registrar resposta a LED e radiofrequencia."
    }
  });

  const mariana = await prisma.patient.create({
    data: {
      professionalId: professional.id,
      name: "Mariana Alves",
      birthDate: new Date("1993-01-30"),
      phone: "(91) 98266-4404",
      email: "mariana.alves@example.com",
      gender: "Feminino",
      document: "004.556.778-40",
      notes: "Queixa corporal inicial, sem atendimento iniciado.",
      status: "ACTIVE"
    }
  });
  await prisma.anamnesis.create({
    data: {
      patientId: mariana.id,
      chiefComplaint: "Gordura localizada em abdomen e flancos.",
      treatmentGoal: "Melhorar contorno corporal e acompanhar medidas.",
      allergies: "Nega alergias.",
      medications: "Nao informado.",
      preExistingConditions: "Sem condicoes relatadas.",
      previousProcedures: "Nunca realizou procedimento corporal.",
      skinType: "Nao informado",
      skinSensitivity: "Nao informado",
      contraindications: "Confirmar gestacao, marca-passo e alteracoes cardiacas antes de eletroterapias.",
      habits: "Sedentarismo e baixa ingestao de agua.",
      notes: "Atendimento em rascunho para completar anamnese corporal."
    }
  });
  const marianaAppointment = await prisma.appointment.create({
    data: {
      patientId: mariana.id,
      professionalId: professional.id,
      date: daysFromNow(3),
      dailyComplaint: "Gordura localizada",
      status: "DRAFT",
      currentStep: "ANAMNESIS"
    }
  });
  await createStepStates(marianaAppointment.id, "ANAMNESIS");
  await prisma.aestheticAssessment.create({
    data: {
      appointmentId: marianaAppointment.id,
      assessedArea: "BODY",
      primaryTreatmentConcern: "corporal_gordura",
      primaryFinding: "Abdômen",
      mainFinding: "Abdômen",
      structuredContraindications: "Nenhuma informada",
      structuredHabits: "Baixa ingestão de água, Sedentarismo",
      professionalAnalysis: "Aguardando avaliacao corporal completa.",
      bodyCondition: "Adiposidade localizada em abdomen e flancos referida.",
      perceivedRisks: "Dados ainda insuficientes para validar eletroterapias.",
      technicalNotes: "Registrar medidas, fotos autorizadas e habitos."
    }
  });

  const juliana = await prisma.patient.create({
    data: {
      professionalId: professional.id,
      name: "Juliana Santos",
      birthDate: new Date("1990-12-07"),
      phone: "(91) 98377-5505",
      email: "juliana.santos@example.com",
      gender: "Feminino",
      document: "005.667.889-50",
      notes: "Atendimento reaberto para revisar plano corporal apos sensibilidade local.",
      status: "ACTIVE"
    }
  });
  await prisma.anamnesis.create({
    data: {
      patientId: juliana.id,
      chiefComplaint: "Celulite em coxas, flacidez leve e retencao hidrica.",
      treatmentGoal: "Melhorar aspecto da celulite, firmeza e conforto corporal.",
      allergies: "Nega alergias.",
      medications: "Anticoncepcional oral.",
      preExistingConditions: "Tendencia a edema no fim do dia.",
      previousProcedures: "Drenagem linfatica previa com boa resposta.",
      skinType: "Nao se aplica",
      skinSensitivity: "Moderada",
      contraindications: "Avaliar sensibilidade local e alteracoes vasculares.",
      habits: "Baixa ingestao de agua e sedentarismo.",
      notes: "Plano deve priorizar drenagem, acompanhamento e progressao gradual."
    }
  });
  const julianaAppointment = await prisma.appointment.create({
    data: {
      patientId: juliana.id,
      professionalId: professional.id,
      date: daysFromNow(-4),
      dailyComplaint: "Celulite e flacidez corporal",
      evaluation: "Fibro edema geloide em coxas, retencao hidrica e flacidez leve.",
      conduct: "Atendimento reaberto para revisar execucao e ajustar plano.",
      status: "REOPENED",
      currentStep: "EXECUTION",
      startedAt: daysFromNow(-5),
      reopenedAt: daysFromNow(-1),
      reopenReason: "Complementar registro de execucao e revisar sensibilidade local."
    }
  });
  await createStepStates(julianaAppointment.id, "EXECUTION", ["CARE_PLAN"]);
  await prisma.aestheticAssessment.create({
    data: {
      appointmentId: julianaAppointment.id,
      assessedArea: "BODY",
      primaryTreatmentConcern: "corporal_celulite",
      primaryFinding: "Retenção hídrica",
      mainFinding: "Retenção hídrica",
      structuredContraindications: "Alterações vasculares/circulatórias",
      structuredHabits: "Baixa ingestão de água, Sedentarismo",
      professionalAnalysis: "Celulite edematosa com flacidez associada.",
      bodyCondition: "Retencao hidrica em membros inferiores, sensibilidade moderada.",
      perceivedRisks: "Cautela com manobras intensas e recursos termicos.",
      technicalNotes: "Priorizar drenagem e registrar resposta."
    }
  });

  const carla = await prisma.patient.create({
    data: {
      professionalId: professional.id,
      name: "Carla Nunes",
      birthDate: new Date("1979-07-22"),
      phone: "(91) 98588-6606",
      email: "carla.nunes@example.com",
      gender: "Feminino",
      document: "006.778.990-60",
      notes: "Paciente em manutencao, retorna para acompanhar evolucao facial.",
      status: "ACTIVE"
    }
  });
  await prisma.anamnesis.create({
    data: {
      patientId: carla.id,
      chiefComplaint: "Manutencao de viço, textura e hidratacao facial.",
      treatmentGoal: "Manter luminosidade e acompanhar resposta aos protocolos suaves.",
      allergies: "Alergia a fragrancias fortes.",
      medications: "Anti-hipertensivo controlado.",
      preExistingConditions: "Hipertensao controlada.",
      previousProcedures: "Glow facial, LEDterapia e drenagem facial.",
      skinType: "Seca / alípica",
      skinSensitivity: "Moderada",
      contraindications: "Evitar produtos perfumados; monitorar sensibilidade.",
      habits: "Boa adesao a fotoprotecao e hidratacao domiciliar.",
      notes: "Paciente responde bem a abordagens hidratantes e LED."
    }
  });
  const carlaAppointment = await prisma.appointment.create({
    data: {
      patientId: carla.id,
      professionalId: professional.id,
      date: daysFromNow(-20),
      dailyComplaint: "Manutencao e retorno",
      evaluation: "Pele mais luminosa, sem intercorrencias, hidratação ainda irregular em regioes laterais.",
      conduct: "Registrar evolucao e programar retorno.",
      status: "FINISHED",
      currentStep: "COMPLETION",
      startedAt: daysFromNow(-20),
      finishedAt: daysFromNow(-20)
    }
  });
  await createStepStates(carlaAppointment.id, "COMPLETION");
  await prisma.aestheticAssessment.create({
    data: {
      appointmentId: carlaAppointment.id,
      assessedArea: "FACIAL",
      primaryTreatmentConcern: "facial_outras",
      primaryFinding: "Revitalização",
      mainFinding: "Revitalização",
      photoprotection: "Usa diariamente",
      sunExposure: "Baixa",
      acidUse: "Não",
      acidRetinoidUse: "Não",
      sensitizingMedication: "Sim, outro medicamento sensibilizante",
      structuredContraindications: "Alergias",
      structuredHabits: "Nenhum relevante informado",
      professionalAnalysis: "Paciente em manutencao com boa resposta a revitalizacao.",
      skinCondition: "Pele seca, sensibilidade moderada, boa luminosidade pos cuidado.",
      perceivedRisks: "Alergia a fragrancias fortes.",
      technicalNotes: "Evitar fragrancias e manter abordagem hidratante."
    }
  });

  const protocolAssignments = [
    {
      patientId: larissa.id,
      appointmentId: larissaAppointment.id,
      title: "Limpeza de Pele Profunda",
      objective: "Promover higienizacao profunda, controle de comedoes e preparo seguro da pele.",
      indication: "Peles com cravos, oleosidade, textura irregular e necessidade de extracao profissional.",
      contraindications: "Pele sensibilizada intensa, feridas abertas, isotretinoina recente ou alergias nao avaliadas.",
      postProcedureCare: "Fotoprotecao, evitar acidos por 48 horas e manter hidratacao leve.",
      status: "REVIEWED" as ProtocolStatus,
      steps: [
        { title: "Higienizacao inicial", description: "Limpeza suave e avaliacao da integridade da pele.", product: "Gel de limpeza", duration: "8 min", notes: "Observar sensibilidade." },
        { title: "Emoliencia e extracao", description: "Preparar com emoliente e realizar extracao profissional quando indicada.", product: "Emoliente", duration: "20 min", notes: "Evitar extracao agressiva." },
        { title: "Alta frequencia", description: "Aplicar alta frequencia como suporte pos-extracao.", product: "Alta Frequencia", duration: "5 min", notes: "Validar tolerancia." }
      ]
    },
    {
      patientId: larissa.id,
      appointmentId: larissaAppointment.id,
      title: "Protocolo Acne Control",
      objective: "Auxiliar controle de oleosidade, comedoes e inflamacao aparente.",
      indication: "Acne comedoniana, oleosidade e lesoes leves, com validacao profissional.",
      contraindications: "Roacutan/isotretinoina, uso recente de acidos com sensibilidade, alergias ou pele lesionada.",
      postProcedureCare: "Filtro solar, hidratacao leve e pausa de ativos irritantes por 48 horas.",
      status: "APPROVED" as ProtocolStatus,
      steps: [
        { title: "Peeling ultrassonico", description: "Remocao suave de impurezas e preparo da superficie.", product: "Peeling ultrassonico", duration: "10 min" },
        { title: "Alta Frequencia", description: "Recurso de suporte para pele acneica apos limpeza.", product: "Alta Frequencia", duration: "5 min" },
        { title: "Fotobiomodulacao", description: "LED/fotobiomodulacao para apoio a reparacao.", product: "LED azul/vermelho conforme avaliacao", duration: "15 min" }
      ]
    },
    {
      patientId: helena.id,
      appointmentId: helenaAppointment.id,
      title: "Protocolo Clareador / Melasma Control",
      objective: "Apoiar uniformizacao do tom com abordagem conservadora e foco em fotoprotecao.",
      indication: "Melasma, manchas solares e hipercromias faciais com avaliacao profissional.",
      contraindications: "Exposicao solar intensa sem fotoprotecao, pele sensibilizada, gestacao sem validacao e alergias.",
      postProcedureCare: "Fotoprotecao rigorosa, evitar sol direto e manter barreira cutanea.",
      status: "REVIEWED" as ProtocolStatus,
      steps: [
        { title: "Preparo de barreira", description: "Higienizacao e hidratacao reparadora antes de clareadores.", product: "Hidratante reparador", duration: "10 min" },
        { title: "Fototerapia", description: "Recurso luminoso de apoio conforme avaliacao.", product: "Fototerapia", duration: "15 min" },
        { title: "Orientacao de fotoprotecao", description: "Reforco de rotina diaria e reaplicacao.", product: "Filtro solar", duration: "5 min" }
      ]
    },
    {
      patientId: carla.id,
      appointmentId: carlaAppointment.id,
      title: "Protocolo Glow e Hidratação",
      objective: "Melhorar luminosidade, conforto e hidratacao da pele.",
      indication: "Pele opaca, seca, desidratada ou em manutencao facial.",
      contraindications: "Alergias a cosmeticos, dermatite ativa ou sensibilidade intensa.",
      postProcedureCare: "Manter hidratacao reparadora, fotoprotecao e evitar esfoliacao domiciliar imediata.",
      status: "APPLIED" as ProtocolStatus,
      steps: [
        { title: "Revitalizacao facial", description: "Higienizacao e preparo para hidratacao profunda.", product: "Gel de limpeza suave", duration: "8 min" },
        { title: "Eletroporacao", description: "Aplicar ativo hidratante conforme tolerancia.", product: "Ativo hidratante", duration: "12 min" },
        { title: "LED Terapia", description: "Finalizacao com LED para conforto e reparacao.", product: "LED vermelho", duration: "15 min" }
      ]
    },
    {
      patientId: beatriz.id,
      appointmentId: beatrizAppointment.id,
      title: "Protocolo Anti-idade / Firmeza Facial",
      objective: "Apoiar firmeza, viço e melhora gradual de linhas finas.",
      indication: "Fotoenvelhecimento leve, linhas finas e perda de firmeza facial.",
      contraindications: "Marca-passo, gestacao, alteracoes cardiacas e sensibilidade intensa para recursos termicos/eletroterapicos.",
      postProcedureCare: "Fotoprotecao, hidratacao e evitar ativos irritantes no mesmo dia.",
      status: "APPLIED" as ProtocolStatus,
      steps: [
        { title: "Microcorrentes", description: "Estimulo suave conforme avaliacao profissional.", product: "Microcorrentes", duration: "10 min" },
        { title: "Radiofrequencia", description: "Recurso termico para firmeza quando nao houver contraindicação.", product: "Radiofrequência", duration: "15 min" },
        { title: "LED Terapia", description: "Suporte reparador e finalizacao.", product: "LED vermelho", duration: "15 min" }
      ]
    },
    {
      patientId: helena.id,
      title: "Peeling Químico Superficial",
      objective: "Promover renovacao superficial controlada conforme avaliacao profissional.",
      indication: "Textura irregular, acne leve, manchas e rejuvenescimento superficial.",
      contraindications: "Roacutan/isotretinoina, gestacao sem validacao, pele sensibilizada, exposicao solar intensa ou feridas.",
      postProcedureCare: "Fotoprotecao rigorosa, pausa de acidos e hidratacao reparadora.",
      status: "REVIEWED" as ProtocolStatus,
      steps: [
        { title: "Avaliacao de tolerancia", description: "Revisar fototipo, sensibilidade e historico de reacao.", duration: "5 min" },
        { title: "Aplicacao controlada", description: "Aplicar peeling superficial pelo tempo definido pela profissional.", product: "Peeling quimico superficial", duration: "Conforme protocolo interno" },
        { title: "Neutralizacao/finalizacao", description: "Finalizar conforme produto e orientar cuidados.", product: "Hidratante reparador", duration: "8 min" }
      ]
    },
    {
      patientId: carla.id,
      title: "LEDterapia Facial",
      objective: "Apoiar reparacao, conforto e revitalizacao facial.",
      indication: "Pele sensibilizada, manutencao, acne leve ou suporte pos-procedimento.",
      contraindications: "Fotossensibilidade medicamentosa ou condicao nao avaliada.",
      postProcedureCare: "Manter rotina orientada e observar resposta nas proximas 24 horas.",
      status: "APPROVED" as ProtocolStatus,
      steps: [
        { title: "Preparo da pele", description: "Higienizar e proteger areas sensiveis.", product: "Gel de limpeza", duration: "5 min" },
        { title: "Aplicacao de LED", description: "Selecionar cor conforme objetivo profissional.", product: "LED Terapia", duration: "15 min" }
      ]
    },
    {
      patientId: mariana.id,
      appointmentId: marianaAppointment.id,
      title: "Protocolo Gordura Localizada",
      objective: "Apoiar melhora de contorno corporal com acompanhamento de medidas e habitos.",
      indication: "Gordura localizada em abdomen, flancos ou culote sem contraindicações relevantes.",
      contraindications: "Gestacao, marca-passo, alteracoes cardiacas e contraindicações para eletroterapia ou recursos termicos.",
      postProcedureCare: "Hidratacao, atividade fisica orientada, acompanhamento de medidas e sem promessa de reducao.",
      status: "REVIEWED" as ProtocolStatus,
      steps: [
        { title: "Registro de medidas", description: "Medir regiao e registrar fotos autorizadas quando aplicavel.", duration: "8 min" },
        { title: "Endermoterapia ou massagem modeladora", description: "Manobras conforme tolerancia e avaliacao.", product: "Creme corporal", duration: "20 min" },
        { title: "Ultrassom cavitacional", description: "Recurso apenas se validado pela profissional.", product: "Ultrassom cavitacional", duration: "Conforme protocolo interno" }
      ]
    },
    {
      patientId: juliana.id,
      appointmentId: julianaAppointment.id,
      title: "Protocolo Celulite Control",
      objective: "Apoiar melhora do aspecto da celulite, retencao e conforto corporal.",
      indication: "Celulite edematosa ou fibrotica com plano progressivo.",
      contraindications: "Alteracoes vasculares, sensibilidade local intensa, gestacao ou contraindicação para recursos eletroterapicos.",
      postProcedureCare: "Hidratacao, observar sensibilidade e acompanhar resposta tecidual.",
      status: "APPROVED" as ProtocolStatus,
      steps: [
        { title: "Drenagem preparatoria", description: "Manobras leves para conforto e retencao.", product: "Creme neutro", duration: "20 min" },
        { title: "Endermoterapia", description: "Aplicar conforme tolerancia local.", product: "Endermoterapia", duration: "15 min" },
        { title: "Ondas de choque", description: "Opcional conforme avaliacao e disponibilidade.", product: "Ondas de choque", duration: "Conforme protocolo interno" }
      ]
    },
    {
      patientId: juliana.id,
      title: "Protocolo Flacidez Corporal",
      objective: "Apoiar firmeza e tonificacao corporal com progressao segura.",
      indication: "Flacidez corporal leve, pos-emagrecimento ou associada a gordura localizada.",
      contraindications: "Marca-passo, gestacao, alteracoes cardiacas e sensibilidade relevante.",
      postProcedureCare: "Hidratacao, registro evolutivo e evitar sobreposicao de recursos no mesmo dia.",
      status: "REVIEWED" as ProtocolStatus,
      steps: [
        { title: "Radiofrequencia corporal", description: "Recurso termico conforme validacao.", product: "Radiofrequência corporal", duration: "Conforme protocolo interno" },
        { title: "Corrente russa/aussie", description: "Estimulo de tonificacao se nao houver contraindicação.", product: "Corrente russa ou aussie", duration: "Conforme protocolo interno" },
        { title: "Fotobiomodulacao", description: "Suporte ao tecido conforme objetivo.", product: "Fotobiomodulação", duration: "15 min" }
      ]
    },
    {
      patientId: juliana.id,
      title: "Drenagem Linfática Manual",
      objective: "Auxiliar conforto, retorno linfatico e reducao de sensacao de retencao.",
      indication: "Retencao hidrica, acompanhamento corporal e relaxamento.",
      contraindications: "Processos infecciosos, trombose suspeita, alteracoes circulatorias sem avaliacao.",
      postProcedureCare: "Ingestao de agua e observar resposta nas proximas horas.",
      status: "APPROVED" as ProtocolStatus,
      source: "MANUAL" as const,
      steps: [
        { title: "Preparacao", description: "Avaliar edema, conforto e sinais de alerta.", duration: "5 min" },
        { title: "Manobras linfaticas", description: "Executar sequencia manual conforme regiao.", product: "Creme neutro", duration: "40 min" }
      ]
    },
    {
      patientId: mariana.id,
      title: "Protocolo Detox Corporal",
      objective: "Apoiar sensacao de leveza e cuidado corporal com recursos de relaxamento.",
      indication: "Retencao, rotina de autocuidado e manutencao corporal.",
      contraindications: "Sensibilidade ao calor, gestacao sem validacao e alteracoes circulatorias.",
      postProcedureCare: "Hidratacao, repouso relativo e acompanhar resposta.",
      status: "REVIEWED" as ProtocolStatus,
      steps: [
        { title: "Esfoliacao suave", description: "Preparar pele conforme tolerancia.", product: "Esfoliante corporal suave", duration: "10 min" },
        { title: "Manta termica", description: "Aplicar apenas com validacao e monitoramento.", product: "Manta térmica", duration: "Conforme protocolo interno" },
        { title: "Finalizacao relaxante", description: "Manobras suaves e orientacao.", product: "Creme corporal", duration: "15 min" }
      ]
    },
    {
      patientId: mariana.id,
      title: "Protocolo Modelador Corporal",
      objective: "Apoiar contorno corporal por manobras e acompanhamento progressivo.",
      indication: "Contorno corporal, gordura localizada e manutencao estetica.",
      contraindications: "Dor local, hematomas, alteracoes vasculares e gestacao sem validacao.",
      postProcedureCare: "Hidratacao e observar sensibilidade local.",
      status: "APPROVED" as ProtocolStatus,
      steps: [
        { title: "Avaliacao da regiao", description: "Registrar area, medidas e tolerancia.", duration: "8 min" },
        { title: "Massagem modeladora", description: "Manobras modeladoras conforme tolerancia.", product: "Creme corporal", duration: "30 min" },
        { title: "Orientacao final", description: "Cuidados domiciliares e acompanhamento.", duration: "5 min" }
      ]
    }
  ];

  const createdProtocols = [];
  for (const item of protocolAssignments) {
    createdProtocols.push(await createProtocol(item));
  }

  const beatrizSuggestion = await prisma.protocolSuggestion.create({
    data: {
      patientId: beatriz.id,
      appointmentId: beatrizAppointment.id,
      source: "AI",
      title: "Plano anti-idade com firmeza gradual",
      objective: "Melhorar firmeza e luminosidade com recursos progressivos.",
      area: "FACIAL",
      suggestedActives: "Peptideos, hidratantes reparadores e antioxidantes conforme avaliacao.",
      suggestedTechniques: "Microcorrentes, radiofrequencia validada e LED Terapia.",
      suggestedEquipments: "Microcorrentes, radiofrequencia e LED.",
      contraindications: "Validar ausencia de marca-passo, gestacao e alteracoes cardiacas.",
      warnings: "Marie sugere. O profissional valida. O atendimento evolui.",
      status: "APPROVED"
    }
  });
  await prisma.professionalValidation.create({
    data: {
      suggestionId: beatrizSuggestion.id,
      professionalId: professional.id,
      decision: "APPROVED",
      justification: "Paciente sem contraindicações e com boa adesao.",
      criticalAnalysis: "Manter acompanhamento e registrar resposta."
    }
  });

  const julianaSuggestion = await prisma.protocolSuggestion.create({
    data: {
      patientId: juliana.id,
      appointmentId: julianaAppointment.id,
      source: "AI",
      title: "Plano corporal para celulite com retenção",
      objective: "Combinar drenagem, endermoterapia e acompanhamento evolutivo.",
      area: "BODY",
      suggestedActives: "Ativos firmadores e drenantes conforme protocolo da clinica.",
      suggestedTechniques: "Drenagem, endermoterapia e ondas de choque se houver tolerancia.",
      suggestedEquipments: "Endermoterapia e ondas de choque.",
      contraindications: "Atenção a alteracoes vasculares/circulatorias.",
      warnings: "Evitar intensidade excessiva em sensibilidade local.",
      status: "ADJUSTED"
    }
  });
  await prisma.professionalValidation.create({
    data: {
      suggestionId: julianaSuggestion.id,
      professionalId: professional.id,
      decision: "APPROVED_WITH_ADJUSTMENTS",
      justification: "Iniciar com drenagem e reduzir intensidade da endermoterapia.",
      criticalAnalysis: "Plano ajustado por sensibilidade e retencao."
    }
  });
  await prisma.technicalAdjustment.create({
    data: {
      suggestionId: julianaSuggestion.id,
      changedField: "suggestedTechniques",
      previousValue: "Endermoterapia e ondas de choque na primeira sessao.",
      newValue: "Drenagem inicial, endermoterapia leve e reavaliacao antes de ondas de choque.",
      reason: "Reduzir risco de desconforto por sensibilidade local."
    }
  });

  await prisma.appointmentExecution.createMany({
    data: [
      {
        appointmentId: beatrizAppointment.id,
        procedurePerformed: "Microcorrentes, radiofrequencia validada e LED vermelho conforme protocolo aprovado.",
        productsUsed: "Gel condutor, hidratante reparador e fotoprotecao.",
        equipmentParameters: "Parametros registrados conforme protocolo interno e tolerancia da paciente.",
        duration: "55 minutos",
        professionalNotes: "Boa tolerancia, sem queixa de ardor.",
        incidents: "Sem intercorrencias.",
        postCareGiven: "Fotoprotecao e hidratacao nas proximas 48 horas."
      },
      {
        appointmentId: julianaAppointment.id,
        procedurePerformed: "Drenagem linfatica manual e endermoterapia leve em coxas.",
        productsUsed: "Creme corporal neutro.",
        equipmentParameters: "Endermoterapia em intensidade conservadora conforme tolerancia.",
        duration: "50 minutos",
        professionalNotes: "Sensibilidade leve em regiao lateral de coxa.",
        incidents: "Sem intercorrencias relevantes.",
        postCareGiven: "Hidratacao e observacao de sensibilidade."
      },
      {
        appointmentId: carlaAppointment.id,
        procedurePerformed: "Revitalizacao facial com eletroporacao hidratante e LED vermelho.",
        productsUsed: "Ativo hidratante sem fragrancia e hidratante reparador.",
        equipmentParameters: "LED vermelho por 15 minutos; eletroporacao conforme protocolo interno.",
        duration: "45 minutos",
        professionalNotes: "Boa tolerancia, sem vermelhidao persistente.",
        incidents: "Sem intercorrencias.",
        postCareGiven: "Manter hidratacao e evitar produtos perfumados."
      }
    ]
  });

  const beatrizEvolution = await prisma.evolution.create({
    data: {
      patientId: beatriz.id,
      appointmentId: beatrizAppointment.id,
      summary: "Paciente apresentou boa tolerancia ao protocolo anti-idade, sem intercorrencias.",
      patientResponse: "Relata pele mais luminosa e confortavel.",
      professionalNotes: "Manter progressao gradual e reavaliar firmeza em retorno.",
      adjustmentsMade: "Protocolo mantido, sem intensificacao nesta sessao.",
      nextSteps: "Retorno em 21 dias para reavaliar resposta.",
      returnDate: daysFromNow(21)
    }
  });

  const julianaEvolution = await prisma.evolution.create({
    data: {
      patientId: juliana.id,
      appointmentId: julianaAppointment.id,
      summary: "Resposta inicial favoravel a drenagem, com sensibilidade leve apos endermoterapia.",
      patientResponse: "Relata sensacao de leveza, mas desconforto discreto em coxa lateral.",
      professionalNotes: "Reduzir intensidade e priorizar drenagem na proxima sessao.",
      adjustmentsMade: "Plano de cuidado marcado para revisao.",
      nextSteps: "Reavaliar sensibilidade antes de ondas de choque.",
      returnDate: daysFromNow(14)
    }
  });

  const carlaEvolution = await prisma.evolution.create({
    data: {
      patientId: carla.id,
      appointmentId: carlaAppointment.id,
      summary: "Manutencao facial realizada com boa resposta imediata.",
      patientResponse: "Paciente percebe pele mais macia e iluminada.",
      professionalNotes: "Evitar fragrancias e manter hidratacao domiciliar.",
      adjustmentsMade: "Mantida abordagem hidratante e LED.",
      nextSteps: "Retorno de acompanhamento em 30 dias.",
      returnDate: daysFromNow(30)
    }
  });

  await prisma.appointmentFollowUp.createMany({
    data: [
      {
        appointmentId: beatrizAppointment.id,
        patientId: beatriz.id,
        date: daysFromNow(21),
        type: "RETURN",
        summary: "Retorno programado para avaliar firmeza e tolerancia.",
        patientResponse: "Aguardando retorno.",
        professionalNotes: "Comparar luminosidade, textura e firmeza.",
        adjustments: "Possivel progressao se mantiver boa tolerancia.",
        nextSteps: "Registrar nova evolucao.",
        status: "OPEN"
      },
      {
        appointmentId: carlaAppointment.id,
        patientId: carla.id,
        date: daysFromNow(30),
        type: "EVOLUTION_CHECK",
        summary: "Acompanhamento de manutencao facial.",
        patientResponse: "Paciente orientada a observar hidratacao e conforto.",
        professionalNotes: "Revisar resposta a ativos sem fragrancia.",
        adjustments: "Manter ou ajustar intervalo.",
        nextSteps: "Definir nova sessao de manutencao.",
        status: "OPEN"
      },
      {
        appointmentId: julianaAppointment.id,
        patientId: juliana.id,
        date: daysFromNow(14),
        type: "PROTOCOL_REVIEW",
        summary: "Revisao de protocolo corporal por sensibilidade local.",
        professionalNotes: "Validar se endermoterapia deve seguir leve.",
        adjustments: "Evitar ondas de choque ate nova avaliacao.",
        nextSteps: "Atualizar plano de cuidado.",
        status: "OPEN"
      }
    ]
  });

  await prisma.clinicalNote.createMany({
    data: [
      { patientId: larissa.id, professionalId: professional.id, content: "Priorizar educacao sobre fotoprotecao e pausa de acidos antes de procedimentos mais intensos.", origin: "PROFESSIONAL" },
      { patientId: helena.id, professionalId: professional.id, content: "Marie alertou que fotoprotecao irregular reduz seguranca de plano clareador.", origin: "AI" },
      { patientId: juliana.id, professionalId: professional.id, content: "Atendimento reaberto para completar execucao e revisar plano corporal.", origin: "PROFESSIONAL" }
    ]
  });

  await addMarieConversation(helena.id, helenaAppointment.id, professional.id, [
    { role: "USER", content: "Marie, revise contraindicações antes de pensar em clareamento." },
    { role: "ASSISTANT", content: "Atenção: exposição solar frequente, fotoproteção irregular e sensibilidade alta pedem plano mais conservador. Eu priorizaria barreira cutânea antes de clareadores." }
  ]);

  await addMarieConversation(juliana.id, julianaAppointment.id, professional.id, [
    { role: "USER", content: "Marie, ajuste o plano de celulite porque houve sensibilidade." },
    { role: "ASSISTANT", content: "Eu manteria drenagem como base e deixaria endermoterapia em intensidade leve. Ondas de choque devem aguardar nova avaliação profissional." }
  ]);

  await prisma.marieActionLog.createMany({
    data: [
      {
        patientId: beatriz.id,
        appointmentId: beatrizAppointment.id,
        professionalId: professional.id,
        actionType: "CREATE_FINAL_PROTOCOL",
        targetEntity: "Protocol",
        targetId: createdProtocols.find((protocol) => protocol.title.includes("Anti-idade"))?.id,
        status: "APPLIED",
        payload: { source: "demo", requiresConfirmation: true },
        result: { protocolStatus: "APPLIED" },
        confirmedAt: daysFromNow(-10)
      },
      {
        patientId: beatriz.id,
        appointmentId: beatrizAppointment.id,
        professionalId: professional.id,
        actionType: "CREATE_EVOLUTION",
        targetEntity: "Evolution",
        targetId: beatrizEvolution.id,
        status: "APPLIED",
        payload: { summary: "Evolucao gerada como rascunho e validada pela profissional." },
        result: { evolutionId: beatrizEvolution.id },
        confirmedAt: daysFromNow(-9)
      },
      {
        patientId: carla.id,
        appointmentId: carlaAppointment.id,
        professionalId: professional.id,
        actionType: "CREATE_EVOLUTION",
        targetEntity: "Evolution",
        targetId: carlaEvolution.id,
        status: "APPLIED",
        payload: { summary: "Retorno de manutencao validado pela profissional." },
        result: { evolutionId: carlaEvolution.id },
        confirmedAt: daysFromNow(-20)
      },
      {
        patientId: juliana.id,
        appointmentId: julianaAppointment.id,
        professionalId: professional.id,
        actionType: "CREATE_EVOLUTION",
        targetEntity: "Evolution",
        targetId: julianaEvolution.id,
        status: "CONFIRMED",
        payload: { summary: "Evolucao sugerida pela Marie para revisao." },
        result: { evolutionId: julianaEvolution.id },
        confirmedAt: daysFromNow(-1)
      }
    ]
  });

  console.log("Seed demo Marie concluido.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
