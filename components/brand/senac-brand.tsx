import Image from "next/image";
import { cn } from "@/lib/utils";

const senacLogoUrl = "https://logodownload.org/wp-content/uploads/2014/10/senac-logo-4-1.png";

export function SenacBrand({ compact = false, large = false, className }: { compact?: boolean; large?: boolean; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", large && "block", compact && "justify-center", className)}>
      <span className={cn("flex shrink-0 items-center justify-center bg-transparent", large ? "mb-8 h-20 w-36" : "h-10 w-10 rounded-2xl border border-white/15 bg-white shadow-sm")}>
        <Image src={senacLogoUrl} alt="Senac" width={large ? 144 : 32} height={large ? 84 : 24} className="object-contain" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className={cn("block font-semibold tracking-tight text-white", large ? "text-2xl leading-7" : "text-base leading-5")}>Marie</span>
          <span className={cn("mt-0.5 block truncate leading-4 text-blue-100/85", large ? "text-sm" : "text-[11px]")}>Clínica de Estética SENAC</span>
        </span>
      )}
    </div>
  );
}
