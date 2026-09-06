# Barberfox

Aplicação web de uma barbearia local, desenvolvida incrementalmente. Esta entrega cobre somente a **Etapa 0: fundação técnica**.

## Requisitos

- Node.js 22.16.0 (versão usada nesta validação; consulte `.nvmrc`).
- npm 10.9.2 ou compatível.
- Conta Cloudflare com acesso a Workers para publicar.

## Executar

```powershell
npm ci
npm run dev
```

Abra a URL exibida pelo servidor. A página inicial é somente uma validação técnica; `/api/health` retorna JSON com horário do servidor e sem cache.

## Verificar

```powershell
npm run check:compat
npm run lint
npm run typecheck
npm run build
npm.cmd run preview -- --port=4173
```

O build usa vinext/Vite e a integração Cloudflare, não `next build`. `preview` permite verificar o artefato de produção localmente.

## Publicar no Cloudflare Workers

```powershell
npx wrangler login
npx wrangler whoami
npm run deploy
```

Confirme a conta de destino. O nome do Worker está em `wrangler.jsonc`. Depois do deploy, abra a URL retornada e `/api/health`. Login e tokens ficam fora do repositório. Esta etapa não exige variáveis Supabase.

## Organização e decisões

Consulte [docs/etapa-0.md](docs/etapa-0.md) para o escopo, versões, decisões e resultados da validação. As versões resolvidas ficam em `package-lock.json`.

O cliente final não terá conta. Agendamento determinístico, Supabase e área administrativa serão implementados em etapas posteriores, mediante revisão das respectivas especificações.

Commit sugerido: `chore: configura fundação técnica com vinext e Cloudflare Workers`.

Status: validações locais concluídas; deploy remoto pendente de autenticação Cloudflare.

Smoke de produção local: `npm run smoke -- http://localhost:4173`.
