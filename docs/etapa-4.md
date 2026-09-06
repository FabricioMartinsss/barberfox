# Etapa 4 — autenticação administrativa

## Arquitetura adotada

```text
/admin/login
  ↓ Server Action (signInWithPassword)
Supabase Auth
  ↓ cookies SSR
proxy.ts atualiza e propaga sessão
  ↓ getClaims() no servidor
/admin e /admin/*
```

O login usa `supabase.auth.signInWithPassword()` em uma Server Action. A senha é recebida apenas no POST, não é armazenada, registrada em log ou incluída em qualquer resposta. Falhas de validação e do Supabase levam à mesma mensagem: `Email ou senha inválidos.`

O cliente browser (`lib/supabase/client.ts`) permanece disponível para componentes de navegador. O cliente server (`lib/supabase/server.ts`) usa o adaptador de cookies de `@supabase/ssr`, permitindo que Server Actions escrevam cookies de sessão. Não há token gerenciado manualmente nem `localStorage` como fonte de autenticação administrativa.

## Sessão SSR e proteção

`proxy.ts` é a convenção correta para Next.js 16. Ele chama `lib/supabase/proxy.ts`, que executa `getClaims()` para permitir refresh e propaga os cookies atualizados tanto à requisição SSR quanto à resposta do navegador.

O Proxy não é a única proteção: o layout do grupo protegido em `/admin` também executa `getClaims()` no servidor em toda navegação. Somente uma claim válida com `sub` permite renderizar a área administrativa. `getSession()` não é usado para autorizar, pois um cookie/sessão lido localmente não valida a identidade. Visitantes em `/admin` ou em qualquer subrota recebem redirect para `/admin/login`; a página de login redireciona uma sessão válida para `/admin`, evitando loop.

O grupo de rotas protegido inclui uma captura de subrotas inexistentes. Assim, o visitante é redirecionado antes de observar a rota; um usuário autenticado recebe o 404 normal dessa subrota.

## Modelo de autorização MVP

Nesta fase, qualquer usuário válido do Supabase Auth é administrador BarberFox. Essa decisão é deliberada: há um único barbeiro, signup público por email foi desabilitado manualmente no Supabase e o administrador foi criado manualmente com email confirmado. Não foram criadas roles, permissões, perfis administrativos ou RBAC.

Esse modelo não deve ser mantido se houver múltiplos funcionários, clientes autenticados ou multi-tenant. Nessa evolução, será necessário autorizar explicitamente cada recurso e introduzir papéis/perfis apropriados.

## Segurança

- Não há rota ou botão de cadastro; signup público está desabilitado no Supabase Dashboard.
- Não há senha, token, `service_role` ou chave administrativa em código, logs ou arquivos versionados.
- O erro de login não revela se o email existe.
- `next`/redirect arbitrário não foi implementado, portanto não há vetor de open redirect nesta fase.
- As oito tabelas de domínio continuam com RLS enabled, sem policies e com default deny. Autenticação não abriu acesso a dados de domínio.
- Supabase Auth oferece rate limits nativos. Não foi adicionada infraestrutura própria de rate limiting; CAPTCHA e limites mais restritos podem ser avaliados antes de uma exposição pública maior.

## Validações executadas

| Validação | Local | Publicado |
| --- | --- | --- |
| `GET /admin` sem sessão | 307 → `/admin/login` | 307 → `/admin/login` |
| Subrota `/admin/*` sem sessão | 307 → `/admin/login` | 307 → `/admin/login` |
| Página `/admin/login` | 200, formulário SSR | 200, formulário SSR |
| Credenciais inválidas | Mensagem genérica, sem 500 | Mensagem genérica, sem 500 |
| Login com administrador confirmado | — | aprovado manualmente |
| Refresh e nova navegação SSR autenticada | — | aprovados manualmente |
| `/admin/login` com sessão ativa | — | redirect para `/admin` aprovado manualmente |
| Logout e bloqueio após logout | — | aprovados manualmente |
| `/`, `/api/health`, `/api/health/supabase`, CSS | 200 | 200 |
| Logs do Worker | — | requisições registradas como `Ok`, sem exceções |

`scripts/auth-smoke.mjs` automatiza os redirects de visitante e a renderização do formulário sem exigir credenciais. Foi executado localmente e contra `http://barberfox.barberfox.workers.dev` (mesmo Worker; este host possui uma limitação conhecida de TLS em clientes Node/PowerShell). O navegador também validou a página HTTPS publicada e a mensagem de credenciais inválidas.

Foram aprovados `npm run lint`, `npm run typecheck`, `npm run check:compat` (100% compatível, inclusive `proxy.ts`) e `npm run build`.

## Validação autenticada em produção

Por segurança, a senha do administrador não foi solicitada nem utilizada pela automação. O proprietário validou manualmente em produção, sem compartilhar credenciais: login com administrador, abertura de `/admin`, refresh com sessão preservada, redirect de `/admin/login` autenticado para `/admin`, logout e novo bloqueio de `/admin` após logout. Com isso, o ciclo Browser → Cloudflare Worker → Next SSR → cookies → Supabase Auth foi confirmado e a Etapa 4 está oficialmente concluída.

## Warnings conhecidos

O build mantém avisos não bloqueantes já conhecidos: `glob` experimental no Node, tentativa de gravação de debug do Wrangler bloqueada pelo sandbox Windows, `next/image` sem otimização e avisos `INEFFECTIVE_DYNAMIC_IMPORT` do Vinext/Vite. Nenhum impediu build, deploy ou smoke tests.
