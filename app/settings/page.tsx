import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { getCurrentUser } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  return (
    <AppShell title="Configurações">
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="mb-5 rounded-[18px] border border-border bg-white p-5 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-senac-blue">Administração</p>
          <h1 className="mt-1 text-2xl font-semibold text-dark-accent">Configurações</h1>
          <p className="text-sm text-muted">Perfil, clínica, equipe e preferências do fluxo assistido.</p>
        </div>
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-dark-accent">Perfil profissional</h2>
            <p className="text-sm text-muted">Base visual preparada para futura autenticação com Auth.js.</p>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center rounded-[14px] border border-border bg-[#F8FAFD] p-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-senac-blue text-2xl font-semibold text-white">{user.name.slice(0, 1)}</div>
              <p className="mt-3 text-sm font-semibold text-dark-accent">{user.name}</p>
              <p className="text-xs text-muted">Clínica de Estética SENAC</p>
            </div>
            <ProfileForm user={{ name: user.name, email: user.email }} />
          </CardContent>
        </Card>
        <div className="mt-4 rounded-[14px] border border-border bg-[#F8FAFD] p-4 text-sm text-muted">
          Outras configurações da clínica e equipe serão disponibilizadas quando houver suporte funcional.
        </div>
      </div>
    </AppShell>
  );
}
