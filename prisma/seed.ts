import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.marieActionLog.deleteMany();
  await prisma.marieMessage.deleteMany();
  await prisma.clinicalNote.deleteMany();
  await prisma.evolution.deleteMany();
  await prisma.protocolStep.deleteMany();
  await prisma.protocol.deleteMany();
  await prisma.appointmentExecution.deleteMany();
  await prisma.technicalAdjustment.deleteMany();
  await prisma.professionalValidation.deleteMany();
  await prisma.protocolSuggestion.deleteMany();
  await prisma.aestheticAssessment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.anamnesis.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const professional = await prisma.user.create({
    data: {
      name: "Dra. Marina Costa",
      email: "profissional@marie.app",
      role: "PROFESSIONAL"
    }
  });

  const ana = await prisma.patient.create({
    data: {
      professionalId: professional.id,
      name: "Ana Silva",
      birthDate: new Date("1992-08-14"),
      phone: "(11) 98888-0101",
      email: "ana.silva@example.com",
      gender: "Feminino",
      document: "123.456.789-00",
      notes: "Paciente busca abordagem natural e progressiva.",
      status: "ACTIVE"
    }
  });

  await prisma.patient.createMany({
    data: [
      {
        professionalId: professional.id,
        name: "Beatriz Ramos",
        birthDate: new Date("1987-02-21"),
        phone: "(11) 97777-0202",
        email: "beatriz@example.com",
        gender: "Feminino",
        status: "ACTIVE"
      },
      {
        professionalId: professional.id,
        name: "Carolina Mendes",
        birthDate: new Date("1995-11-03"),
        phone: "(11) 96666-0303",
        email: "carolina@example.com",
        gender: "Feminino",
        status: "ACTIVE"
      }
    ]
  });

  const anamnesis = await prisma.anamnesis.create({
    data: {
      patientId: ana.id,
      chiefComplaint: "Fotoenvelhecimento e perda de firmeza mandibular",
      treatmentGoal: "Melhorar textura, luminosidade e sustentacao com plano progressivo.",
      allergies: "Nega alergias conhecidas.",
      medications: "Suplementacao eventual de vitamina D.",
      preExistingConditions: "Sem doencas pre-existentes relevantes relatadas.",
      previousProcedures: "Limpeza de pele e peeling superficial ha mais de 8 meses.",
      skinType: "Mista",
      skinSensitivity: "Sensibilidade leve em regiao malar.",
      contraindications: "Evitar procedimentos agressivos em periodos de sensibilidade ativa.",
      habits: "Uso irregular de fotoprotecao; rotina de skincare inconsistente.",
      notes: "Orientar fotoprotecao e preparo de barreira antes de procedimentos intensivos."
    }
  });

  const appointment = await prisma.appointment.create({
    data: {
      patientId: ana.id,
      professionalId: professional.id,
      date: new Date(),
      dailyComplaint: anamnesis.chiefComplaint,
      evaluation: "Linhas finas, textura irregular e flacidez leve em contorno mandibular.",
      conduct: "Iniciar plano conservador com foco em barreira cutanea, estimulo gradual e acompanhamento.",
      status: "IN_PROGRESS",
      currentStep: "EVOLUTION",
      startedAt: new Date()
    }
  });

  await prisma.aestheticAssessment.create({
    data: {
      appointmentId: appointment.id,
      assessedArea: "FACIAL",
      professionalAnalysis: "Paciente com sinais iniciais de fotoenvelhecimento, boa resposta esperada a plano progressivo.",
      skinCondition: "Pele mista, textura irregular e opacidade leve.",
      bodyCondition: "Nao avaliado neste atendimento.",
      perceivedRisks: "Sensibilidade cutanea e baixa adesao a fotoprotecao.",
      technicalNotes: "Priorizar preparo da pele antes de ativos mais intensos."
    }
  });

  const suggestion = await prisma.protocolSuggestion.create({
    data: {
      patientId: ana.id,
      appointmentId: appointment.id,
      source: "MANUAL",
      title: "Plano facial progressivo para firmeza e luminosidade",
      objective: "Melhorar luminosidade, textura e firmeza mandibular com baixo risco irritativo.",
      area: "FACIAL",
      suggestedActives: "Niacinamida, peptideos, acido mandelico em baixa concentracao.",
      suggestedTechniques: "Higienizacao, preparo de barreira, peeling suave e LED vermelho.",
      suggestedEquipments: "LED vermelho; radiofrequencia apenas apos revisao.",
      contraindications: "Suspender em caso de dermatite ativa ou sensibilizacao importante.",
      warnings: "Validar fotoprotecao e tolerancia antes de intensificar.",
      status: "WAITING_REVIEW"
    }
  });

  await prisma.professionalValidation.create({
    data: {
      suggestionId: suggestion.id,
      professionalId: professional.id,
      decision: "APPROVED_WITH_ADJUSTMENTS",
      justification: "A proposta e adequada, mas deve iniciar com concentracoes mais baixas.",
      criticalAnalysis: "Evitar sobretratamento e reforcar adesao domiciliar."
    }
  });

  await prisma.technicalAdjustment.create({
    data: {
      suggestionId: suggestion.id,
      changedField: "suggestedActives",
      previousValue: "Acido mandelico",
      newValue: "Acido mandelico em baixa concentracao",
      reason: "Reduzir risco de sensibilizacao."
    }
  });

  const protocol = await prisma.protocol.create({
    data: {
      patientId: ana.id,
      appointmentId: appointment.id,
      title: "Protocolo final facial de luminosidade e firmeza",
      objective: "Estimular renovacao suave e suporte de firmeza com seguranca.",
      indication: "Fotoenvelhecimento inicial, textura irregular e perda leve de firmeza.",
      contraindications: "Dermatite ativa, sensibilidade intensa, alergia a componentes utilizados.",
      postProcedureCare: "Fotoprotecao rigorosa, evitar acidos por 48 horas e manter hidratacao reparadora.",
      source: "AI_ASSISTED",
      status: "APPROVED"
    }
  });

  await prisma.protocolStep.createMany({
    data: [
      {
        protocolId: protocol.id,
        order: 1,
        title: "Higienizacao e preparo",
        description: "Limpeza suave e avaliacao da barreira cutanea.",
        product: "Gel de limpeza suave",
        duration: "8 min",
        notes: "Observar vermelhidao inicial."
      },
      {
        protocolId: protocol.id,
        order: 2,
        title: "Renovacao controlada",
        description: "Aplicacao de ativo renovador em baixa concentracao.",
        product: "Acido mandelico leve",
        duration: "5 min",
        notes: "Remover se houver ardor intenso."
      },
      {
        protocolId: protocol.id,
        order: 3,
        title: "Fotobiomodulacao",
        description: "LED vermelho para suporte reparador.",
        product: "LED vermelho",
        duration: "15 min",
        notes: "Registrar resposta imediata."
      }
    ]
  });

  await prisma.appointmentExecution.create({
    data: {
      appointmentId: appointment.id,
      procedurePerformed: "Higienização, renovação controlada e LED vermelho conforme protocolo aprovado.",
      productsUsed: "Gel de limpeza suave, ácido mandélico leve e hidratante reparador.",
      equipmentParameters: "LED vermelho por 15 minutos.",
      duration: "45 minutos",
      professionalNotes: "Boa tolerância durante a execução.",
      incidents: "Sem intercorrências.",
      postCareGiven: "Fotoproteção rigorosa e pausa de ativos irritantes por 48 horas."
    }
  });

  await prisma.evolution.createMany({
    data: [
      {
        patientId: ana.id,
        appointmentId: appointment.id,
        summary: "Paciente orientada sobre fotoprotecao e preparo da pele antes do protocolo.",
        patientResponse: "Relata compreensao e disponibilidade para ajustar rotina domiciliar.",
        professionalNotes: "Reforcar adesao e avaliar sensibilidade no retorno.",
        adjustmentsMade: "Plano mantido em abordagem conservadora.",
        nextSteps: "Retorno em 21 dias para reavaliacao."
      },
      {
        patientId: ana.id,
        appointmentId: appointment.id,
        summary: "Sem intercorrencias registradas no acompanhamento inicial.",
        patientResponse: "Boa tolerancia aos cuidados orientados.",
        professionalNotes: "Pode evoluir para estimulo mais intenso se mantiver tolerancia.",
        nextSteps: "Revisar anamnese e resposta cutanea."
      }
    ]
  });

  await prisma.clinicalNote.createMany({
    data: [
      {
        patientId: ana.id,
        professionalId: professional.id,
        content: "Paciente prefere resultados progressivos e naturais.",
        origin: "PROFESSIONAL"
      },
      {
        patientId: ana.id,
        professionalId: professional.id,
        content: "Marie pode futuramente cruzar historico, anamnese e protocolo para apoiar revisoes.",
        origin: "AI"
      }
    ]
  });

  await prisma.marieMessage.create({
    data: {
      patientId: ana.id,
      appointmentId: appointment.id,
      role: "ASSISTANT",
      content: "Como posso apoiar este atendimento?"
    }
  });
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
