"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarPlus, ChevronLeft, ChevronRight, FilePlus2, LayoutDashboard, Search, Settings, Sparkles, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const menu = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pacientes", href: "/patients", icon: UsersRound },
  { label: "Atendimentos", href: "/appointments", icon: CalendarPlus },
  { label: "Protocolos", href: "/protocols", icon: FilePlus2 },
  { label: "Evoluções", href: "/evolutions", icon: Activity },
  { label: "Configurações", href: "/settings", icon: Settings }
];

export function CommandSidebar({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="relative flex h-full w-full flex-col overflow-hidden border-r border-white/10 bg-senac-blue-dark text-blue-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(255,255,255,0.13),transparent_16rem),linear-gradient(160deg,rgba(255,255,255,0.08),transparent_44%),linear-gradient(145deg,transparent_0%,transparent_55%,rgba(255,255,255,0.06)_56%,transparent_57%)]" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full border border-senac-orange/40" />
      <div className="pointer-events-none absolute bottom-16 right-0 h-32 w-32 bg-[radial-gradient(circle,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:10px_10px] opacity-25" />
      <div className={`relative z-10 ${collapsed ? "p-2" : "px-8 pb-6 pt-8"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-2"}`}>
          {!collapsed && (
            <div>
              <div>
                <p className="text-2xl font-semibold leading-7 tracking-tight text-white">Marie</p>
                <p className="mt-2 text-sm leading-5 text-blue-100/85">Clínica de Estética SENAC</p>
              </div>
              <div className="mt-5 h-1 w-10 rounded-full bg-senac-orange" />
            </div>
          )}
          {collapsed && <p className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">M</p>}
          {onToggle && (
            <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-50 hover:bg-white/10 hover:text-white" onClick={onToggle}>
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
      <nav className={`relative z-10 flex-1 space-y-2 ${collapsed ? "p-2" : "px-6 py-2"}`}>
        {!collapsed && <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-100/60">Menu</p>}
        {menu.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`relative flex items-center rounded-xl font-semibold transition ${
              pathname === item.href
                ? "bg-white/14 text-white shadow-sm before:absolute before:left-0 before:h-full before:w-1 before:rounded-full before:bg-senac-orange"
                : "text-blue-50/75 hover:bg-white/10 hover:text-white"
            } ${collapsed ? "h-10 justify-center px-0 text-sm" : "h-12 gap-4 px-4 text-base"}`}
          >
            <item.icon className={collapsed ? "h-4 w-4" : "h-5 w-5"} />
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>
      <div className={`relative z-10 space-y-3 border-t border-white/10 ${collapsed ? "p-2" : "mx-6 px-0 py-6"}`}>
        {!collapsed && <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-blue-100/60">Ações rápidas</p>}
        <Button variant="primary" className={`${collapsed ? "h-10 w-full px-0" : "h-12 w-full justify-start rounded-xl px-5 text-base"} border-senac-orange bg-senac-orange font-semibold text-white hover:bg-senac-orange-strong`} title="Novo atendimento"><CalendarPlus className="h-4 w-4" />{!collapsed && "Novo atendimento"}</Button>
        <Link href="/patients/new" className={`inline-flex items-center rounded-xl border border-white/40 bg-white/8 font-semibold text-blue-50 hover:bg-white/14 ${collapsed ? "h-10 w-full justify-center px-0 text-sm" : "h-12 w-full justify-start gap-3 px-5 text-base"}`} title="Novo paciente"><FilePlus2 className="h-4 w-4" />{!collapsed && "Novo paciente"}</Link>
        <Button className={`${collapsed ? "h-10 w-full px-0" : "h-12 w-full justify-start rounded-xl px-5 text-base"} border-white/40 bg-white/8 font-semibold text-blue-50 hover:bg-white/14 hover:text-white`} title="Buscar paciente"><Search className="h-4 w-4" />{!collapsed && "Buscar paciente"}</Button>
        <div className={`rounded-xl border border-white/10 bg-white/8 text-blue-50/78 ${collapsed ? "flex justify-center p-2" : "p-2 text-xs"}`}>
          <div className={`flex items-center gap-2 font-semibold text-white ${collapsed ? "" : "mb-1"}`}><Sparkles className="h-3.5 w-3.5 text-senac-orange" />{!collapsed && "Modo assistido"}</div>
          {!collapsed && <p className="leading-4">Sugestões exigem validação profissional.</p>}
        </div>
      </div>
    </aside>
  );
}
