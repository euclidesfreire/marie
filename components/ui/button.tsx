import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "accent";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "secondary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "border-primary bg-primary text-white shadow-sm hover:bg-primary-hover",
        variant === "secondary" && "border-border bg-white text-foreground shadow-sm hover:border-slate-300 hover:bg-[#F8FAFD]",
        variant === "ghost" && "border-transparent bg-transparent text-muted hover:bg-blue-50 hover:text-senac-blue",
        variant === "danger" && "border-danger bg-danger text-white hover:bg-red-700",
        variant === "success" && "border-success bg-success text-white hover:bg-green-700",
        variant === "accent" && "border-senac-orange bg-senac-orange text-white hover:bg-senac-orange-strong",
        size === "sm" && "h-8 rounded-[10px] px-3",
        size === "md" && "h-10 rounded-xl px-4",
        size === "icon" && "h-9 w-9 rounded-xl",
        className
      )}
      {...props}
    />
  );
}
