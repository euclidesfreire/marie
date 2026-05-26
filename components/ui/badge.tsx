import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "slate"
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "green" | "amber" | "red";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        tone === "slate" && "border-slate-200 bg-slate-50 text-slate-600",
        tone === "blue" && "border-blue-200 bg-blue-50 text-senac-blue",
        tone === "green" && "border-green-200 bg-green-50 text-green-700",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "red" && "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {children}
    </span>
  );
}
