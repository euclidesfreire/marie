import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Search,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { labelFor } from "@/lib/labels";
import { calculateAge, formatDate, getCurrentUser } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function statusTone(status: string) {
  if (status === "IN_PROGRESS") return "blue";
  if (status === "FINISHED") return "green";
  if (status === "CANCELED") return "slate";
  return "amber";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [patients, activePatients, appointments, suggestions, protocols, evolutions, recentAppointments, nextAppointment] = await Promise.all([
    prisma.patient.count(),
    prisma.patient.count({ where: { status: "ACTIVE" } }),
    prisma.appointment.count({ where: { status: "IN_PROGRESS" } }),
    prisma.protocolSuggestion.count({ where: { status: "WAITING_REVIEW" } }),
    prisma.protocol.count({ where: { status: { in: ["DRAFT", "REVIEWED", "APPROVED"] } } }),
    prisma.evolution.count(),
    prisma.appointment.findMany({ include: { patient: true, professional: true }, orderBy: { date: "desc" }, take: 3 }),
    prisma.appointment.findFirst({ where: { status: "IN_PROGRESS" }, include: { patient: true }, orderBy: { date: "asc" } })
  ]);

  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());
  const metrics: { label: string; value: number; icon: LucideIcon; tone: string; detail: string }[] = [
    { label: "Atendimentos hoje", value: appointments, icon: CalendarDays, tone: "bg-blue-50 text-primary", detail: "+2 em relação a ontem" },
    { label: "Pacientes ativos", value: activePatients || patients, icon: UsersRound, tone: "bg-orange-50 text-senac-orange", detail: "+5 novos esta semana" },
    { label: "Planos em andamento", value: protocols, icon: FileText, tone: "bg-blue-50 text-senac-blue", detail: `${suggestions} aguardando revisão` },
    { label: "Evoluções pendentes", value: evolutions, icon: CheckCircle2, tone: "bg-green-50 text-success", detail: "Requerem sua atenção" }
  ];

  const shortcuts = [
    { label: "Nova avaliação", href: "/patients", icon: UsersRound },
    { label: "Novo protocolo", href: "/protocols", icon: FileText },
    { label: "Nova evolução", href: "/evolutions", icon: Activity },
    { label: "Buscar paciente", href: "/patients", icon: Search },
    { label: "Lista de espera", href: "/appointments", icon: CalendarDays },
    { label: "Relatórios", href: "/dashboard", icon: BarChart3 }
  ];

  return (
    <AppShell title="Dashboard">
      <div className="mx-auto grid max-w-[1540px] gap-6 p-4 sm:p-6 xl:grid-cols-[1fr_420px]">
        <main className="min-w-0 space-y-6">
          <section>
            <h1 className="text-2xl font-bold tracking-tight text-senac-blue">Olá, {user.name.split(" ")[0] === "Dra." ? user.name : `Dra. ${user.name}`}! <span className="text-senac-orange">👋</span></h1>
            <p className="mt-2 text-sm text-muted">Aqui está o que está acontecendo hoje na sua clínica.</p>
          </section>

          <section className="relative overflow-hidden rounded-[18px] border border-border bg-white shadow-soft">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_42%,rgba(14,86,197,0.12),transparent_18rem),radial-gradient(circle_at_88%_20%,rgba(247,148,29,0.14),transparent_14rem)]" />
            <div className="absolute right-12 top-10 hidden h-[420px] w-[420px] rounded-full border border-primary/20 lg:block" />
            <div className="absolute right-4 top-20 hidden h-[360px] w-[360px] rounded-full border border-senac-orange/35 lg:block" />
            <div className="relative grid min-h-[360px] gap-6 p-7 lg:grid-cols-[1fr_410px]">
              <div className="z-10 flex max-w-xl flex-col justify-center">
                <p className="text-lg font-semibold text-senac-blue">Bem-vinda à</p>
                <h2 className="mt-1 text-6xl font-extrabold tracking-tight text-senac-blue">Marie <span className="text-senac-orange">✦</span></h2>
                <p className="mt-4 max-w-md text-2xl font-bold leading-9 text-senac-blue">Marie apoia a análise. O profissional valida.</p>
                <p className="mt-6 max-w-md text-base leading-7 text-muted">Organize atendimentos, revise planos de cuidado e acompanhe a evolução clínica com apoio assistido, mantendo a decisão sempre nas mãos da profissional.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button variant="primary" className="bg-senac-blue hover:bg-primary-hover"><Link href="/patients">Abrir workspace</Link></Button>
                  <Button variant="accent"><Link href="/patients/new">Novo atendimento</Link></Button>
                </div>
                <p className="mt-5 rounded-full border border-blue-100 bg-white/70 px-3 py-2 text-xs font-semibold text-senac-blue">Atendimento estético assistido, com validação profissional em cada etapa.</p>
              </div>
              <div className="relative hidden min-h-[360px] items-end justify-center lg:flex">
                <Image
                  src="/images/marie-avatar.png"
                  alt="Marie, assistente de atendimento estético"
                  width={1188}
                  height={1324}
                  priority
                  className="absolute bottom-0 right-0 h-[410px] w-auto max-w-none object-contain object-bottom drop-shadow-[0_18px_24px_rgba(10,61,145,0.16)] xl:h-[440px]"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, tone, detail }) => (
              <Card key={label} className="p-5">
                <div className="flex items-start gap-4">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-3xl font-bold leading-none text-dark-accent">{value}</p>
                    <p className="mt-1 text-sm font-semibold text-senac-blue">{label}</p>
                    <p className={`mt-3 text-xs ${detail.includes("aguardando") || detail.includes("Requerem") ? "text-senac-orange" : "text-success"}`}>{detail}</p>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-bold text-senac-blue">Atendimentos recentes</h2>
              <Link href="/appointments" className="text-sm font-semibold text-primary hover:text-primary-hover">Ver todos</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F8FAFD] text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3">Paciente</th>
                    <th className="px-5 py-3">Procedimento</th>
                    <th className="px-5 py-3">Profissional</th>
                    <th className="px-5 py-3">Horário</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentAppointments.map((appointment) => (
                    <tr key={appointment.id} className="bg-white">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-senac-blue">{appointment.patient.name.slice(0, 2).toUpperCase()}</span>
                          <span>
                            <span className="block font-semibold text-dark-accent">{appointment.patient.name}</span>
                            <span className="text-xs text-muted">{calculateAge(appointment.patient.birthDate)} anos</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted">{appointment.dailyComplaint ?? "Avaliação estética"}</td>
                      <td className="px-5 py-4 text-muted">{appointment.professional.name}</td>
                      <td className="px-5 py-4 text-muted">{formatDate(appointment.date)}</td>
                      <td className="px-5 py-4"><Badge tone={statusTone(appointment.status)}>{labelFor(appointment.status)}</Badge></td>
                      <td className="px-5 py-4"><ChevronRight className="h-4 w-4 text-muted" /></td>
                    </tr>
                  ))}
                  {recentAppointments.length === 0 && (
                    <tr>
                      <td className="px-5 py-8 text-center text-muted" colSpan={6}>Nenhum atendimento registrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-senac-blue">Resumo do dia</h2>
              <Link href="/appointments" className="text-sm font-semibold text-primary">Ver calendário</Link>
            </div>
            <div className="mt-4 rounded-[14px] border border-border bg-white p-4 shadow-soft">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-primary"><CalendarDays className="h-5 w-5" /></span>
                <div>
                  <p className="font-semibold capitalize text-dark-accent">{today}</p>
                  <p className="text-sm text-muted">{appointments} atendimentos em andamento</p>
                </div>
              </div>
            </div>
            <h3 className="mt-6 text-sm font-bold text-senac-blue">Próximo atendimento</h3>
            <div className="mt-3 flex items-center justify-between rounded-[14px] border border-border bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-senac-blue">{nextAppointment?.patient.name.slice(0, 2).toUpperCase() ?? "MA"}</span>
                <div>
                  <p className="font-semibold text-dark-accent">{nextAppointment?.patient.name ?? "Sem atendimento em andamento"}</p>
                  <p className="text-sm text-muted">{nextAppointment?.dailyComplaint ?? "Agenda livre para novos atendimentos"}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-bold text-senac-blue">Atalhos rápidos</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              {shortcuts.map(({ label, href, icon: Icon }) => (
                <Link key={label} href={href} className="flex min-h-20 flex-col items-center justify-center rounded-[14px] border border-border bg-white p-3 text-center text-xs font-semibold text-senac-blue shadow-soft transition hover:border-blue-200 hover:bg-senac-blue-soft">
                  <Icon className="mb-2 h-5 w-5" />
                  {label}
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-senac-blue">Notificações</h2>
              <Link href="/dashboard" className="text-sm font-semibold text-primary">Ver todas</Link>
            </div>
            <div className="mt-4 divide-y divide-border">
              {[
                [`${suggestions} sugestões aguardando revisão`, "Planos precisam da sua análise", "bg-orange-50 text-senac-orange", ClipboardCheck],
                [`${protocols} protocolos prontos para aplicação`, "Planos foram validados", "bg-blue-50 text-primary", FileText],
                ["Reunião de equipe", "Amanhã, 09:00 - Sala 2", "bg-green-50 text-success", CalendarDays]
              ].map(([title, description, tone, Icon]) => (
                <div key={String(title)} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone as string}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-dark-accent">{title as string}</p>
                    <p className="text-sm text-muted">{description as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
