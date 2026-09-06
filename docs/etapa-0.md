# Etapa 0 — Fundação técnica

## Escopo

Validar uma página App Router, TypeScript estrito, Tailwind, build vinext e execução Cloudflare Workers. Sem domínio, banco, autenticação ou funcionalidades da barbearia.

## Estado inicial

Repositório Git existente, branch main, remote origin no GitHub, README apenas e árvore limpa. Node 22.16.0 e npm 10.9.2 disponíveis.

## Decisão

Usar App Router do Next.js com vinext e Vite para execução e build destinados a Workers. vinext reimplementa as APIs do Next.js; não é um adaptador do resultado de next build. A alternativa OpenNext adapta esse resultado, mas a documentação Cloudflare recomenda vinext para projetos novos. A escolha segue o briefing e deve ser revalidada nas próximas etapas por estar em beta.

Dependências principais consultadas no npm: Next.js 16.3.4, vinext 1.0.0-beta.9, @vinext/cloudflare 1.0.0-beta.7, Vite 8.2.2, Tailwind 4.3.3, Wrangler 4.129.0 e React 19.2.8. TypeScript permanece em 5.9, uma escolha conservadora para esta base; a versão latest consultada era 7.0.2. O lockfile registra as versões efetivamente instaladas.

## Estrutura

- app/: layout, página mínima, CSS e endpoint técnico /api/health.
- Configurações na raiz: TypeScript, ESLint, Next, Vite e Wrangler.
- docs/: escopo, decisões e evidências da etapa.

Não criar pastas vazias para módulos futuros.

## Critérios de aceite

- [x] Dependências instaladas (auditoria npm: zero vulnerabilidades).
- [x] Verificação de compatibilidade vinext: 5 itens suportados, sem problemas.
- [x] Lint sem avisos.
- [x] Typecheck.
- [x] Build para Workers.
- [x] Página, CSS, endpoint dinâmico e 404 validados no desenvolvimento (3000) e no Worker compilado (4173).
- [x] Primeiro deploy e verificação remota.

## Fontes oficiais

- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://github.com/cloudflare/vinext
- https://github.com/cloudflare/vinext/tree/main/examples/app-router-cloudflare

## Próximo marco

Parar ao final da Etapa 0. Supabase depende de uma nova etapa solicitada pelo usuário.


## Revisão e limitações encontradas

- Verificação HTTP reproduzível: `npm run smoke` (porta 3000) e `npm run smoke -- http://localhost:4173` (preview).
- Página inspecionada no navegador em 375 px e 430 px, com conferência adicional de largura em 390 px; sem erros ou avisos no console capturado.
- ESLint 9.39.5 fixado: o npm informa fim de suporte. ESLint 10.10.0 foi avaliado, mas plugins transitivos de `eslint-config-next@16.3.4` (import, react, jsx-a11y) ainda declaram suporte apenas até ESLint 9. Não foram usados overrides ou legacy-peer-deps para ignorar isso.
- `typescript-eslint@8.69.0` exige TypeScript >=4.8.4 e <6.1.0, justificando TypeScript 5.9.3.
- O inicializador oficial foi executado com `--platform=cloudflare --cdn-cache=data-cache --data-cache=none --image-optimization=none`. Sem bindings KV ou Images; apenas ASSETS para arquivos públicos.
- O build informa classificação estática desconhecida para `/`. Trata-se de uma limitação declarada do analisador vinext; página e endpoint foram testados no runtime.
- Node 22.16.0 emite aviso sobre `glob` experimental. Não impediu build ou execução.
- O sandbox do agente impediu inicialmente gravações internas do Wrangler em AppData. A execução local funcionou com permissão adequada; nenhuma mudança de código foi necessária para esse problema.
- Em PowerShell, usar `npm.cmd run preview -- --port=4173` para preservar argumentos encaminhados ao Wrangler.
- O primeiro deploy remoto foi concluído em 2026-09-06, com a versão `671453a3-598b-4979-971e-cd37875be6fa` ativa a 100%. URL pública: https://barberfox.barberfox.workers.dev/.
- Smoke test remoto do Worker: pela rota que alcançou o runtime (`http://barberfox.barberfox.workers.dev/`), a página respondeu 200 (`text/html`), o CSS publicado `/_next/static/css/index.DTBeluuF.css` respondeu 200 (`text/css`) e contém as classes Tailwind esperadas, `/api/health` respondeu 200 com `Cache-Control: no-store` e o JSON `{ status: "ok", application: "barberfox", stage: 0 }`, e uma rota inexistente respondeu 404. O script `npm run smoke -- http://barberfox.barberfox.workers.dev/` passou integralmente.
- A home também foi carregada no navegador publicado em HTTPS e inspecionada em 375 px, 390 px e 430 px: título, conteúdo e CSS foram renderizados sem overflow horizontal; o console não registrou erros ou avisos.
- Diagnóstico do 502/HTTPS relatado: não houve exceção registrada no `wrangler tail`, e os metadados da versão confirmam um handler `fetch` com o binding `ASSETS`. Neste host, clientes que usam Schannel/OpenSSL (PowerShell, curl e Node) falharam no handshake TLS para `https://barberfox.barberfox.workers.dev/` com alerta TLS 40/`ERR_SSL_VERSION_OR_CIPHER_MISMATCH`, antes de receber uma resposta HTTP. A mesma aplicação respondeu 200 via HTTP e foi renderizada pelo navegador publicado em HTTPS. Portanto não há evidência de erro de runtime ou de incompatibilidade vinext/Workers; a limitação observada é de conectividade TLS do cliente/ambiente e deve ser reavaliada de outra rede se voltar a ocorrer. Nenhuma alteração de código ou novo deploy foi necessária.
- Validação final após o deploy: `npm run lint`, `npm run typecheck`, `npm run check:compat` (100% compatível; 5 suportados, 0 problemas) e `npm run build` passaram.
- Nenhuma migration, integração Supabase, funcionalidade de negócio, commit ou push foi realizada.
