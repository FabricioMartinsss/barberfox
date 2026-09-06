# Etapa 1 — Integração inicial com Supabase

## Objetivo

Comprovar a integração técnica entre Next.js, vinext, Cloudflare Workers e Supabase, sem criar schema, dados de domínio, autenticação ou credenciais administrativas.

## Arquitetura

```text
Next.js
↓
vinext
↓
Cloudflare Workers
↓
Supabase
```

## Implementação atual

- `@supabase/supabase-js` é o SDK oficial isomórfico que realiza as chamadas ao Supabase.
- `@supabase/ssr` fornece `createBrowserClient` e `createServerClient`, preparando os clientes separados para autenticação SSR futura baseada em cookies, sem implementar sessão ou proteção de rotas nesta etapa.
- `lib/supabase/client.ts` é exclusivo para Client Components.
- `lib/supabase/server.ts` é destinado a Server Components, Server Actions e Route Handlers. O adaptador de cookies já segue o contrato SSR atual; nenhuma autenticação foi implementada.
- `app/api/health/supabase` executará `auth.getUser()` com um token de teste fixo e inválido. A documentação do SDK confirma que essa chamada consulta o servidor Auth. O endpoint só responderá `status: "ok"` para a rejeição autenticada esperada (`bad_jwt`), provando comunicação real sem criar tabela, usuário ou dado de negócio.

## Configuração segura

As únicas variáveis necessárias são públicas e usam os nomes atuais do Supabase:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

`.env.example` contém apenas placeholders. `.env.local` e `.dev.vars*` permanecem ignorados pelo Git. Não há `service_role`, chave secreta, token administrativo ou credencial de banco no código, no Wrangler ou na documentação.

No Cloudflare Workers, a compatibilidade `nodejs_compat` já ativa permite que bindings sejam lidos em `process.env`. Os dois valores foram configurados como bindings protegidos do Worker, não em `wrangler.jsonc`; apesar de serem públicos no cliente, isso mantém a configuração por ambiente fora do repositório. Como são `NEXT_PUBLIC_*`, também precisam estar disponíveis para o build/deploy que gera o bundle do navegador.

O primeiro deploy desta etapa mostrou que a configuração redirecionada gerada pelo vinext não enumera as Variables do Dashboard. Sem proteção, o Wrangler pode removê-las ao publicar. Por isso `wrangler.jsonc` usa `keep_vars: true`; os bindings atuais também foram restaurados como secrets do Worker, que o Wrangler preserva em deploys posteriores. Nenhum valor é registrado no repositório ou nesta documentação.

## Validação atual

- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run check:compat`: aprovado, 6 itens suportados e zero problemas.
- `npm run build`: aprovado.
- Dependências instaladas: `@supabase/supabase-js@2.115.0` e `@supabase/ssr@0.12.6`.
- Smoke local: `/`, `/api/health`, CSS e 404 aprovados. `/api/health/supabase` retornou `200` com `{ "status": "ok", "service": "supabase" }` e `Cache-Control: no-store`.
- Prova de conexão local: `auth.getUser("stage-1-connectivity-probe")` retornou a rejeição autenticada esperada `bad_jwt`. A documentação oficial informa que `getUser()` realiza uma requisição ao servidor Auth; portanto, a resposta confirma comunicação real do SDK com Supabase sem criar tabela, schema, usuário ou dado de domínio.
- Deploy concluído no Worker existente `barberfox`, versão `301d3a59-17d7-4e14-b75a-3a95eb903492`, disponível em https://barberfox.barberfox.workers.dev/.
- Smoke remoto: `/` respondeu 200, CSS respondeu 200 (`text/css`, com Tailwind), `/api/health` respondeu 200 e `/api/health/supabase` respondeu 200 com `{ "status": "ok", "service": "supabase" }`. Isso comprova o caminho Cloudflare Worker → Supabase. O `wrangler tail` não registrou exceções durante as requisições.

## Segurança

- `.env.local` está presente apenas localmente, é ignorado pelo Git e não aparece em `git status`.
- `.env.example` mantém somente placeholders.
- Uma busca nos arquivos versionáveis não encontrou `service_role`, `SUPABASE_SECRET`, `sb_secret_`, token Cloudflare ou credencial real.
- O código browser e server usa exclusivamente a Publishable Key. Nenhuma chave administrativa, senha de banco, migration, schema, tabela ou funcionalidade de negócio foi criada.

## Limitações conhecidas

- O build mantém os avisos existentes da Etapa 0: `glob` experimental no Node, classificação estática limitada do vinext e gravação de logs do Wrangler bloqueada pelo sandbox. Nenhum deles bloqueia a compilação.
- O deploy informa que `next/image` continua sem otimização de imagens e emite avisos internos `INEFFECTIVE_DYNAMIC_IMPORT` do vinext/Vite. Não há imagem na aplicação atual e os avisos não bloquearam o deploy ou os smoke tests.
- Neste host, clientes Node/PowerShell têm limitação de handshake TLS para a URL `https://*.workers.dev`, já registrada na Etapa 0. Os smoke tests remotos foram executados pela rota HTTP que atinge o mesmo Worker; a home HTTPS segue acessível no navegador publicado.
