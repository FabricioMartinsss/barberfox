# Etapa 3 — modelo físico do banco e migrations

## Resultado

Etapa concluída em 2026-09-06. O esquema físico do MVP foi aplicado ao projeto Supabase vinculado por migrations versionadas, sem criar dados de domínio permanentes, endpoints, interface, autenticação ou regras de agendamento na aplicação.

## Migrations aplicadas

| Migration | Finalidade |
| --- | --- |
| `20260906173804_create_barberfox_mvp_schema.sql` | Cria o esquema inicial, tipos, tabelas, índices, triggers, RLS e constraints temporais. |
| `20260906174531_fix_customer_phone_validation.sql` | Corrige a expressão regular de telefone brasileiro após a suíte de invariantes revelar que a forma inicial não aceitava um telefone E.164 válido. A migration original foi preservada; não foi reescrita após ser aplicada remotamente. |

`npx supabase migration list` confirmou as duas migrations presentes local e remotamente. `npx supabase db push --dry-run` confirmou que não há migration pendente.

## Modelo aplicado

As oito tabelas do domínio são `services`, `customers`, `appointments`, `business_hours`, `schedule_blocks`, `products`, `promotions` e `product_interests`.

- Todas usam chave primária UUID gerada pelo banco (`gen_random_uuid()`).
- Valores monetários usam `integer` em centavos, sempre positivos; não há valores monetários em ponto flutuante.
- Agendamentos, bloqueios e vigência de promoções usam `timestamptz`. Os horários recorrentes usam dia da semana e `time without time zone`, pois representam horário local em `America/Fortaleza`.
- `appointments` mantém referência ao serviço e snapshots obrigatórios de nome, preço em centavos e duração. As referências de serviço, cliente, produto e agendamento usam `ON DELETE RESTRICT` para preservar histórico.
- `appointment_status` aceita `AGENDADO`, `CONCLUIDO`, `CANCELADO` e `NAO_COMPARECEU`; `intended_payment_method` aceita `PIX`, `DINHEIRO` e `CARTAO`.
- Há checks para nomes não vazios, preço, duração de 15 a 240 minutos, telefone E.164 brasileiro, intervalos válidos e imagens/motivos opcionais não vazios.
- O telefone do cliente é único; nome de serviço é único após `lower(btrim(name))`; interesse em produto é único por par agendamento-produto.

Não foram inseridos horários, serviços, clientes, produtos, promoções, agendamentos ou qualquer seed de domínio.

## Agenda e integridade

O banco impede double booking em `appointments` com uma exclusion constraint GiST sobre `tstzrange(starts_at, ends_at, '[)')`. Portanto o início é inclusivo, o fim é exclusivo e dois agendamentos adjacentes são permitidos. A constraint é parcial para `status <> 'CANCELADO'`: qualquer estado não cancelado ocupa o intervalo, e o cancelamento libera a faixa. Não foi usado `UNIQUE(starts_at)`.

`schedule_blocks` possui uma exclusion constraint própria, também com intervalo `[)`, para rejeitar bloqueios sobrepostos. `business_hours` permite várias faixas por dia e usa uma exclusão por dia da semana que rejeita sobreposição e também intervalos adjacentes/tangentes.

A extensão `btree_gist` foi habilitada somente para possibilitar a igualdade de `weekday` junto da exclusão GiST das faixas recorrentes. A validação entre `schedule_blocks` e `appointments` continua deliberadamente fora de uma constraint entre tabelas: deverá ocorrer na transação/RPC de criação/edição da etapa que implementar agenda, conforme a especificação de domínio.

## Segurança

RLS está habilitado nas oito tabelas e não há policies nesta etapa. Os privilégios de tabela foram revogados de `anon` e `authenticated`; o estado efetivo é default deny até que uma etapa posterior introduza operações públicas/admin explicitamente autorizadas. Funções internas de trigger também não concedem execução a `public`.

Nenhuma chave de serviço foi adicionada ou usada pela aplicação. `.env.local` permanece ignorado pelo Git e não aparece em `git status`; `.env.example` não recebeu valores reais. As variáveis públicas previamente configuradas não foram impressas ou copiadas para arquivos versionáveis.

## Validação de banco

A suíte reproduzível `supabase/tests/schema_invariants.sql` foi executada no banco remoto com:

```powershell
npx supabase db query --linked --file supabase/tests/schema_invariants.sql
```

Ela executa tudo em `BEGIN`/`ROLLBACK`, portanto não deixa dados de teste. Foram validados: RLS e ausência de policies nas oito tabelas, extensão `btree_gist`, constraints temporais, telefone único, checks de preço/duração/intervalo, enums, interesse idempotente, bloqueios sobrepostos, faixas recorrentes adjacentes, double booking sobreposto, adjacência de agendamentos e liberação do período ao cancelar. Também foi validado que `anon` não lê `services`.

O ambiente local não possui Docker ou Podman, logo `supabase start`/`supabase db reset` local não pôde ser executado. As migrations foram aplicadas e testadas no projeto remoto vinculado; para reproduzir em uma máquina com o runtime local disponível, usar `npx supabase start`, `npx supabase db reset` e o comando da suíte acima.

## Aplicação existente

Nenhum código de aplicação foi alterado nesta etapa. Após as migrations, os smoke tests locais retornaram 200 para `/`, `/api/health` e `/api/health/supabase`, além de 404 para rota inexistente. O Worker já publicado em [barberfox.barberfox.workers.dev](https://barberfox.barberfox.workers.dev/) também respondeu:

| Rota | Resultado |
| --- | --- |
| `/` | 200 |
| `/api/health` | 200 |
| `/api/health/supabase` | 200, com `{ "status": "ok", "service": "supabase" }` |
| `/etapa-3-inexistente` | 404 |

Isso preserva a conexão Worker → Supabase validada na Etapa 1, sem expor credenciais nem conceder acesso às novas tabelas.

## Qualidade

| Comando | Resultado |
| --- | --- |
| `npm run lint` | passou sem warnings |
| `npm run typecheck` | passou |
| `npm run check:compat` | 100% compatível (6 suportados, 0 parciais, 0 problemas) |
| `npm run build` | passou |

Warnings conhecidos: o Node reporta `glob` como experimental; no ambiente sandbox do Windows o Wrangler não conseguiu gravar seu arquivo de debug em `AppData`, embora o build tenha concluído com sucesso. O Vinext também ainda não classifica estaticamente as rotas dinâmicas que usam `headers()`/`cookies()`; isso é um aviso da ferramenta e não impediu o build ou os smoke tests.

## Limites deliberados

Não foram implementados schema de autenticação adicional, frontend, APIs de domínio, geração de slots, seed operacional, serviço de backend com service role, RPC de criação de agendamento, nem políticas públicas ou administrativas. Essas decisões pertencem às etapas posteriores.
