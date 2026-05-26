# Marie

Atendimento estetico assistido por IA.

Marie e um MVP para profissionais de estetica registrarem pacientes, anamneses, atendimentos, avaliacoes, sugestoes de protocolo, validacoes profissionais, protocolos finais e evolucoes clinicas.

Neste momento a IA e mockada. A arquitetura ja esta preparada para um servico externo futuro: a Marie sugere acoes estruturadas, o profissional confirma, e somente depois os dados sao gravados.

## Stack

- Next.js com App Router
- TypeScript e React
- Route Handlers do Next.js
- Prisma ORM
- PostgreSQL
- Zod
- TailwindCSS
- Lucide React

## Como rodar localmente

1. Instale dependencias:

```bash
npm install
```

2. Configure o ambiente:

```bash
cp .env.example .env
```

Edite `DATABASE_URL` apontando para seu PostgreSQL.

3. Gere o Prisma Client:

```bash
npx prisma generate
```

4. Rode a migration inicial:

```bash
npx prisma migrate dev --name init
```

5. Popule dados de exemplo:

```bash
npx prisma db seed
```

6. Inicie o projeto:

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Prisma Studio

```bash
npx prisma studio
```

## Rotas principais

- `/login`
- `/dashboard`
- `/patients`
- `/patients/new`
- `/patients/[id]`
- `/patients/[id]/workspace`
- `/appointments`
- `/protocols`
- `/settings`

## IA futura

O arquivo `lib/ai/marie-client.ts` define:

- `MarieContextPayload`
- `MarieAction`
- `MarieResponse`
- `sendMessageToMarie(payload)`

No MVP, `sendMessageToMarie` retorna respostas simuladas e acoes estruturadas. O endpoint `/api/marie/actions/execute` aplica apenas acoes confirmadas pelo profissional e registra tudo em `MarieActionLog`.

Principio do produto:

> Marie sugere. O profissional valida. O atendimento evolui.

## Deploy na Vercel

1. Crie um banco PostgreSQL acessivel pela Vercel.
2. Configure a variavel `DATABASE_URL` no projeto da Vercel.
3. Garanta que `npm run build` rode `prisma generate`.
4. Execute migrations no ambiente apropriado:

```bash
npx prisma migrate deploy
```

5. Opcionalmente rode o seed em ambiente de preview ou desenvolvimento:

```bash
npx prisma db seed
```

O projeto nao usa recursos incompatíveis com serverless. O Prisma Client usa singleton em desenvolvimento e funciona no ambiente da Vercel.
