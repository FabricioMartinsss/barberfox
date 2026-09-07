# Etapa 5 — serviços e horários

## Entregue

Foram criadas as áreas protegidas `/admin/services` e `/admin/hours`. Ambas usam Server Actions, o cliente SSR autenticado e JWT validado por `getClaims()` antes de cada mutação:

```text
Admin → Server Action → Supabase SSR → JWT authenticated → RLS → PostgreSQL
```

Serviços permitem listar, criar, editar, ativar e desativar; não há ação de delete. O preço é recebido no formato brasileiro (`35,00` ou `R$ 35,00`) e convertido por aritmética inteira para `price_cents`, sem persistir ponto flutuante. Duração aceita inteiros de 15 a 240 minutos.

Horários mostram os sete dias; ausência de linhas significa `Fechado`. Há criação, edição e remoção física de múltiplos intervalos. A validação server-side exige `HH:MM` e início anterior ao fim; conflitos retornados pela constraint de exclusão viram mensagem segura, sem expor SQL.

## RLS

A migration `20260906231500_grant_admin_services_and_business_hours.sql` concede a `authenticated` apenas:

| Tabela | Grants e policies |
| --- | --- |
| `services` | SELECT, INSERT, UPDATE |
| `business_hours` | SELECT, INSERT, UPDATE, DELETE |

`anon` permanece sem grants nas duas tabelas. As outras seis tabelas continuam com RLS default-deny e sem novos grants/policies. Não há service role.

`supabase/tests/admin_access.sql` usa `BEGIN`/`ROLLBACK` e confirmou remotamente anon bloqueado, authenticated autorizado somente nas operações previstas, delete de services negado e demais tabelas inacessíveis.

## Qualidade e deploy

- `npm run lint`, `npm run typecheck`, `npm run check:compat` (100%) e `npm run build` passaram.
- A migration foi aplicada ao projeto remoto e a suíte RLS passou.
- Deploy no Worker existente: `c723ba7a-4312-4de7-8a7e-4b34998b718c`, em https://barberfox.barberfox.workers.dev/.
- Sem sessão, `/admin/services` e `/admin/hours` respondem 307 para `/admin/login`.
- `/`, `/api/health` e `/api/health/supabase` continuam 200.

## Validação manual em produção

Sem usar ou solicitar senha, o proprietário validou em produção: criação, edição, desativação e reativação de serviços; múltiplos intervalos no mesmo dia; rejeição de sobreposição; edição e remoção de intervalos; e retorno de um dia sem intervalos ao estado `Fechado`. As páginas também foram verificadas em 375 px, 390 px e 430 px, sem problema relevante de responsividade. Com isso, a Etapa 5 está oficialmente concluída.

## Limites

Não foram implementados agenda, slots, appointments, customers, bloqueios, produtos, promoções ou qualquer acesso público aos dados de domínio. Os avisos não bloqueantes do build permanecem os mesmos das etapas anteriores (glob experimental, logs do Wrangler no sandbox e limitações de análise do Vinext).
