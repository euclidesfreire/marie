import Link from "next/link";
import Image from "next/image";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const senacLogoUrl = "https://logodownload.org/wp-content/uploads/2014/10/senac-logo-4-1.png";

export function Topbar({
  status,
  context,
  professional,
  onMenuClick
}: {
  status?: string;
  context?: string;
  professional?: string;
  onMenuClick?: () => void;
}) {
  return (
    <header className="grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-white/95 px-4 shadow-[0_1px_10px_rgba(15,23,42,0.03)] backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        {onMenuClick && <Button size="icon" variant="ghost" className="lg:hidden" onClick={onMenuClick}><Menu className="h-4 w-4" /></Button>}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src={senacLogoUrl} alt="Senac" width={74} height={42} className="object-contain" />
        </Link>
      </div>
      <div className="hidden items-center gap-3 text-sm text-muted md:flex">
        <span className="font-semibold text-dark-accent">{context ?? "Workspace clínico"}</span>
        {status && <span className="text-slate-300">•</span>}
        {status && <span className="font-medium text-primary">{status}</span>}
      </div>
      <div className="flex justify-end">
        {professional ? (
          <div className="flex items-center gap-4">
            <button className="relative hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-senac-blue shadow-sm hover:bg-senac-blue-soft sm:flex">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-senac-orange text-[9px] font-bold text-white">3</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-senac-blue text-sm font-semibold text-white shadow-sm">
                {professional.slice(0, 1)}
              </span>
              <span className="hidden leading-4 sm:inline">
                <span className="block font-semibold text-dark-accent">{professional}</span>
                <span className="text-muted">Esteticista</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-senac-blue sm:block" />
            </div>
          </div>
        ) : (
          status ? <Badge tone="slate">{status}</Badge> : <span className="hidden text-xs font-medium text-muted sm:inline">Clínica de Estética SENAC</span>
        )}
      </div>
    </header>
  );
}
