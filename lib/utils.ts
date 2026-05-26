import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { prisma } from "@/lib/prisma";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getCurrentUser() {
  let user = await prisma.user.findFirst({ where: { email: "profissional@marie.app" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Dra. Marina Costa",
        email: "profissional@marie.app",
        role: "PROFESSIONAL"
      }
    });
  }
  return user;
}

export function calculateAge(date: Date | string) {
  const birth = new Date(date);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function formatDate(date?: Date | string | null) {
  if (!date) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(date));
}

export async function parseJson<T>(request: Request, fallback: T) {
  try {
    return (await request.json()) as T;
  } catch {
    return fallback;
  }
}

export function apiError(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Não foi possível processar a solicitação.";
  return Response.json({ error: message }, { status });
}
