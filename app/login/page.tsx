import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-xl font-semibold">Marie</h1>
          <p className="text-sm text-muted">Atendimento estético assistido por IA</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">Autenticação simplificada para o MVP. O sistema usa a profissional padrão criada no seed.</p>
          <Button variant="primary" className="w-full"><Link href="/dashboard">Entrar</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
