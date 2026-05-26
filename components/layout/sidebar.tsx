"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarDays, FileCheck2, HelpCircle, LayoutDashboard, LogOut, Search, Settings, Sparkles, UserPlus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Pacientes", icon: UsersRound },
  { href: "/appointments", label: "Atendimentos", icon: CalendarDays },
  { href: "/protocols", label: "Protocolos", icon: FileCheck2 },
  { href: "/evolutions", label: "Evoluções", icon: Activity },
  { href: "/settings", label: "Configurações", icon: Settings }
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="relative flex h-full w-full shrink-0 flex-col overflow-hidden bg-senac-blue-dark px-6 py-8 text-blue-50 lg:w-[300px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.13),transparent_18rem),linear-gradient(160deg,rgba(255,255,255,0.08),transparent_44%),linear-gradient(145deg,transparent_0%,transparent_54%,rgba(255,255,255,0.06)_55%,transparent_56%)]" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full border border-senac-orange/40" />
      <div className="pointer-events-none absolute bottom-16 right-0 h-32 w-32 bg-[radial-gradient(circle,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:10px_10px] opacity-25" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <div className="mb-7 px-1">
        <div>
          <p className="text-2xl font-semibold leading-7 tracking-tight text-white">Marie</p>
          <p className="mt-2 text-sm leading-5 text-blue-100/85">Clínica de Estética SENAC</p>
        </div>
        <div className="mt-5 h-1 w-10 rounded-full bg-senac-orange" />
      </div>
      <nav className="space-y-2">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-100/60">Menu</p>
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={`relative flex h-12 items-center gap-4 rounded-xl px-4 text-base font-semibold transition ${
              pathname === item.href
                ? "bg-white/14 text-white shadow-sm before:absolute before:left-0 before:h-full before:w-1 before:rounded-full before:bg-senac-orange"
                : "text-blue-50/78 hover:bg-white/10 hover:text-white"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-blue-100/60">Ações rápidas</p>
        <Button className="h-12 w-full justify-start rounded-xl border-senac-orange bg-senac-orange px-5 text-base font-semibold text-white hover:bg-senac-orange-strong" variant="primary">
          <CalendarDays className="h-4 w-4" />Novo atendimento
        </Button>
        <Link
          href="/patients/new"
          onClick={onNavigate}
          className="inline-flex h-12 w-full items-center justify-start gap-3 rounded-xl border border-white/40 bg-white/8 px-5 text-base font-semibold text-blue-50 hover:bg-white/14"
        >
          <UserPlus className="h-4 w-4" />Novo paciente
        </Link>
        <Button className="h-12 w-full justify-start rounded-xl border-white/40 bg-white/8 px-5 text-base font-semibold text-blue-50 hover:bg-white/14 hover:text-white">
          <Search className="h-4 w-4" />Buscar paciente
        </Button>
        <div className="rounded-xl border border-white/10 bg-white/8 p-3 text-xs text-blue-50/78">
          <div className="mb-1 flex items-center gap-2 font-semibold text-white"><Sparkles className="h-3.5 w-3.5 text-senac-orange" />Modo assistido</div>
          <p className="leading-4">Marie apoia, a validação é sempre profissional.</p>
        </div>
      </div>
      <div className="mt-auto grid gap-1 border-t border-white/10 pt-3 text-sm">
        <button className="flex h-8 items-center gap-2 rounded-xl px-2 text-left text-blue-50/70 hover:bg-white/10 hover:text-white"><HelpCircle className="h-4 w-4" />Ajuda</button>
        <button className="flex h-8 items-center gap-2 rounded-xl px-2 text-left text-blue-50/70 hover:bg-white/10 hover:text-white"><LogOut className="h-4 w-4" />Sair</button>
      </div>
      </div>
    </aside>
  );
}
