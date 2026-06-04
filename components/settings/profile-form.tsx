"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileForm({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email")
        })
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Não foi possível salvar o perfil.");
        return;
      }
      setMessage("Perfil profissional atualizado.");
      router.refresh();
    });
  }

  return (
    <form action={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-medium text-foreground">
        Nome
        <Input name="name" defaultValue={user.name} required />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-foreground">
        E-mail
        <Input name="email" type="email" defaultValue={user.email} required />
      </label>
      <p className="text-xs leading-5 text-muted sm:col-span-2">Telefone e especialidade serão disponibilizados quando houver suporte no perfil profissional.</p>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" variant="primary" disabled={isPending}><Save className="h-4 w-4" />{isPending ? "Salvando..." : "Salvar alterações"}</Button>
        {message && <p className={`text-sm ${message.includes("atualizado") ? "text-success" : "text-danger"}`}>{message}</p>}
      </div>
    </form>
  );
}
