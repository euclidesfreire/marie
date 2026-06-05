# Deploy do Marie na Vercel

Este projeto esta preparado para deploy na Vercel com PostgreSQL externo.

## 1. Banco PostgreSQL

Crie um banco PostgreSQL acessivel pela Vercel, por exemplo:

- Neon
- Supabase
- Vercel Postgres
- Railway
- Render

Copie a connection string e configure no projeto da Vercel:

```bash
DATABASE_URL="postgresql://user:password@host:5432/marie?schema=public"
```

## 2. Build na Vercel

O arquivo `vercel.json` usa:

```bash
npm run vercel-build
```

Esse comando executa:

```bash
prisma generate
prisma migrate deploy
next build
```

Assim, o Prisma Client e as migrations sao preparados durante o build.

## 3. Dados demo atuais

Os dados atuais da demo ficam em `prisma/seed.ts`.

Para popular o banco remoto com a base demo:

```bash
DATABASE_URL="postgresql://user:password@host:5432/marie?schema=public" npm run db:demo
```

O seed limpa os dados atuais antes de criar a demo. Use somente em ambiente de demonstracao, preview ou em uma base nova.

## 4. Deploy via CLI

Com o projeto conectado na Vercel:

```bash
vercel
vercel --prod
```

Depois do primeiro deploy, rode o seed no banco remoto uma vez:

```bash
DATABASE_URL="postgresql://user:password@host:5432/marie?schema=public" npm run db:seed
```

## 5. Checklist

- `DATABASE_URL` configurada na Vercel.
- Banco PostgreSQL externo criado.
- `npm run build` passa localmente.
- `npm run db:demo` roda em banco limpo/remoto quando quiser carregar a demo.
- A tela `/protocols` usa o catalogo da Marie AI, nao depende de dados salvos por paciente.
