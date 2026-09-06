# BarberFox — especificação de domínio do MVP

## 1. Visão geral e limites

BarberFox atende uma única barbearia, com um único barbeiro no MVP. Clientes públicos agendam sem conta; o administrador autenticado será introduzido depois. O produto combina agendamento presencial, conteúdo comercial e registro simples de interesse em produtos.

Esta é uma especificação conceitual para a Etapa 3. Não define SQL, migrations, RLS, RPCs, tabelas físicas ou endpoints.

## 2. Entidades finais propostas

As oito entidades propostas sobrevivem à análise, com limites claros:

| Entidade | Finalidade | Observação MVP |
| --- | --- | --- |
| `services` | Catálogo de atendimentos agendáveis | Não é catálogo de combos ou adicionais. |
| `customers` | Cadastro canônico do contato recorrente | Não há login nem perfil público. |
| `appointments` | Reserva e histórico do atendimento | Centro do domínio. |
| `business_hours` | Rotina semanal recorrente | Não tem data; exceções usam bloqueios. |
| `schedule_blocks` | Indisponibilidades pontuais | Não substitui horários recorrentes. |
| `products` | Vitrine de produtos | Não tem estoque, carrinho ou venda online. |
| `promotions` | Conteúdo comercial com vigência | Não é motor de descontos. |
| `product_interests` | Interesse declarado após um agendamento | Contextualiza produto, cliente e visita. |

Não criar agora entidades para barbeiros, unidades, pagamentos, estoque, carrinhos, cupons, sessões, histórico de auditoria detalhado ou configurações genéricas. O MVP tem uma única capacidade de atendimento; uma constante de domínio basta para parâmetros globais iniciais.

## 3. Serviços

Cada serviço tem nome, descrição opcional, preço, duração em minutos e estado ativo/inativo.

- Preço é obrigatório, positivo e representado internamente em centavos inteiros; nunca por ponto flutuante.
- Duração é obrigatória, em minutos inteiros, com recomendação inicial de 15 a 240 minutos. Valores fora desse intervalo exigem revisão administrativa.
- Nome deve ser único após normalização simples (sem diferenças apenas de maiúsculas/minúsculas ou espaços externos), inclusive para serviços inativos. Isso evita catálogo ambíguo.
- Serviço inativo não aparece ao público e não pode receber novos agendamentos, mas continua referenciado pelo histórico.
- Exclusão física não é permitida quando houver histórico; o comportamento padrão é desativar. Um serviço sem qualquer uso pode ser removido administrativamente, se a etapa de banco julgar necessário.
- Alterar preço ou duração só vale para novos agendamentos. Todo agendamento preserva `service_name`, `service_price` e `duration_minutes` como snapshot, além da referência ao serviço original.

O snapshot custa pequena redundância, mas mantém comprovantes e relatórios historicamente corretos após edição ou inativação do serviço.

## 4. Clientes e dados pessoais

`customers` guarda nome atual e telefone normalizado. Telefone é obrigatório e é o identificador natural do cliente para o MVP.

- Normalizar para E.164 brasileiro (`+55` seguido de DDD e número), validando formato antes de criar ou localizar o cliente.
- Há um único cliente por telefone normalizado; variações de máscara, espaços ou pontuação não criam duplicidade.
- Ao confirmar um agendamento com telefone existente e nome não vazio diferente, atualizar o nome atual do cliente. É uma conveniência explícita, não um reconhecimento visual antecipado na interface.
- O histórico de agendamentos vem da relação com `appointments`; não duplicar uma lista dentro do cliente.
- Nome e telefone são dados privados. Telefone nunca integra listagem, busca ou resposta pública destinada a outro cliente.

## 5. Agendamentos, estados e histórico

Um `appointment` liga cliente e serviço e contém início, fim, intenção de pagamento, status e snapshots do serviço.

Estados mínimos:

```text
AGENDADO → CONCLUIDO
AGENDADO → CANCELADO
AGENDADO → NAO_COMPARECEU
```

- `AGENDADO` é o único estado inicial.
- Estados finais não voltam a `AGENDADO` e não transitam entre si no MVP.
- Um concluído não é cancelado. Uma correção administrativa é feita cancelando o agendamento incorreto enquanto ele ainda está agendado e criando outro; após finalização, o erro deve ser anotado operacionalmente, não reescrito.
- Não haverá tabela de histórico de transições nesta versão. `created_at`, `updated_at` e `status_changed_at` são suficientes; uma auditoria detalhada será reconsiderada se houver necessidade operacional real.
- Agendamentos não são excluídos normalmente.

### Intenção de pagamento

O campo deve se chamar conceitualmente `intended_payment_method`, pois não prova pagamento. É obrigatório na confirmação pública e possui conjunto fechado: `PIX`, `DINHEIRO` ou `CARTAO`. Não haverá valor pago, gateway, comprovante ou estado financeiro nesta fase.

## 6. Datas, horário de funcionamento e slots

### Timezone

A timezone oficial é `America/Fortaleza`.

- O cliente escolhe data e hora nessa timezone.
- A geração de agenda usa data local, hora local e dia da semana local.
- Instantes de início e fim de agendamentos são persistidos como instantes com timezone, normalmente UTC, e convertidos para Fortaleza na exibição.
- Intervalos recorrentes de funcionamento são horários locais, não timestamps.

### Horários recorrentes

`business_hours` representa faixas semanais por dia da semana. Um dia pode ter zero, uma ou mais faixas; ausência de faixa significa fechado. Almoço é a ausência entre duas faixas, por exemplo, 08:00–12:00 e 14:00–19:00. Não há data nessa entidade.

As faixas de um mesmo dia não podem se sobrepor nem se tocar de modo ambíguo; a administração deve ordená-las e mantê-las estritamente válidas.

### Geração de slots

A regra inicial é uma grade fixa de 30 minutos, reiniciada no começo de cada faixa de funcionamento. Assim, em 14:00–19:00, os candidatos são 14:00, 14:30, 15:00 e assim por diante. Um candidato só é exibido se todo o período do serviço couber na faixa permitida.

Esta escolha é mais previsível para clientes e para a operação do que uma grade que muda conforme a duração de cada serviço. `slot_interval_minutes = 30` é uma regra global do MVP, não uma entidade ou tela de configuração. Só deve virar configuração persistida quando houver necessidade real de operação.

### Buffer

Não há buffer no MVP. A duração do serviço é o período reservado e o próximo slot pode começar exatamente no seu fim. Se a operação precisar de preparação/limpeza, a solução inicial será aumentar a duração do serviço; um buffer global ou por serviço é deliberadamente adiado.

## 7. Disponibilidade, bloqueios e limites públicos

Um horário é disponível apenas se, na timezone oficial:

```text
início e fim estão em uma mesma faixa de business_hours
AND não cruza pausa entre faixas
AND não cruza schedule_block
AND não cruza appointment não cancelado
AND inicia na grade de 30 minutos
AND inicia pelo menos 60 minutos no futuro
AND está dentro dos próximos 30 dias
```

Horários no passado nunca aparecem. A antecedência mínima recomendada é 60 minutos e o horizonte recomendado é 30 dias; ambos são regras globais do MVP, não configurações expostas.

Todos os agendamentos com status diferente de `CANCELADO` ocupam seu intervalo. Na operação normal, apenas `AGENDADO` ocupará tempo futuro, mas a regra conservadora impede sobreposição caso um status final seja atribuído indevidamente a uma data futura. Cancelamento libera o slot.

### Bloqueios

`schedule_blocks` contém início e fim locais convertidos para instantes, com motivo opcional. Pode cobrir parte do dia ou o dia inteiro; um bloqueio de dia inteiro ocupa todas as faixas daquela data.

- Início deve ser anterior ao fim.
- Bloqueios sobrepostos são rejeitados para manter a agenda administrativa compreensível.
- Criar ou editar um bloqueio que conflita com agendamento não cancelado é rejeitado. Nunca cancela clientes automaticamente.
- O administrador precisa resolver explicitamente o agendamento antes de salvar o bloqueio.
- Bloqueios futuros podem ser editados ou removidos fisicamente; bloqueios passados não devem ser reescritos no MVP.

## 8. Concorrência e prevenção de double booking

A consulta de disponibilidade é apenas uma prévia. A confirmação de um agendamento precisa de garantia no banco para sobreviver a duas confirmações simultâneas.

Para a Etapa 3, a estratégia recomendada é:

1. calcular início e fim no servidor, a partir do serviço e das regras de agenda;
2. em uma única transação/RPC de criação, revalidar horário de funcionamento, bloqueios, antecedência e horizonte;
3. usar uma exclusion constraint PostgreSQL sobre intervalo temporal com limite inferior inclusivo e superior exclusivo (`[início, fim)`), aplicada a agendamentos não cancelados;
4. tratar a violação da constraint como conflito de disponibilidade, sem tentar resolver pela interface.

Ranges temporais e exclusion constraints são a ferramenta PostgreSQL adequada para impedir sobreposição de intervalos de durações diferentes; `UNIQUE` por horário inicial não cobre o caso 14:00–15:00 versus 14:30–15:10. A documentação oficial descreve ranges como apropriados para agenda e constraints de exclusão como mecanismo para não sobreposição. [PostgreSQL: Range Types](https://www.postgresql.org/docs/current/rangetypes.html)

Bloqueios vivem em outra entidade, portanto a transação também deve validar explicitamente conflitos entre bloqueio e agendamento. Para o único barbeiro do MVP não é necessário escopo adicional; se houver múltiplos barbeiros no futuro, a mesma garantia deverá ser limitada por barbeiro.

Não haverá reagendamento direto. Administrativamente, reagendar significa cancelar o agendamento ainda agendado e criar outro. Isso evita reescrever intervalo e snapshots históricos.

## 9. Produtos, promoções e interesses

### Produtos

Produto é vitrine comercial, com nome, descrição curta opcional, preço obrigatório positivo em centavos, imagem opcional e ativo/inativo.

- Imagem não é obrigatória: produto sem imagem continua publicável.
- Não há estoque, carrinho, pedido, pagamento online ou venda registrada.
- Produto inativo sai da vitrine, mas permanece em interesses anteriores.
- Exclusão física é evitada quando houver interesse registrado; preferir inativação.

### Promoções

Promoção é conteúdo comercial, não cálculo financeiro. Tem título, descrição, início, fim, ativo e imagem opcional. Só é pública quando ativa e dentro da vigência; início deve ser anterior ou igual ao fim. Não há cupom, percentual, preço promocional estruturado ou ligação obrigatória a produto.

### Interesse em produto

`product_interests` referencia `appointment_id` e `product_id`; o cliente é obtido pelo agendamento. Essa escolha responde à pergunta útil ao barbeiro: qual produto interessou a qual cliente depois de qual visita.

- Uma combinação agendamento + produto só pode existir uma vez.
- Repetir o clique é idempotente, sem criar duplicidade.
- O cliente não terá remoção pública nesta versão, pois não há autenticação para provar autoria. O administrador poderá excluir registro feito por engano.
- Produto posteriormente inativo continua visível no histórico de interesse administrativo.

## 10. Política de exclusão e datas

| Entidade | Política |
| --- | --- |
| Serviços | Inativar; não excluir quando houver histórico. |
| Clientes | Não excluir no fluxo normal; avaliar retenção/anonimização em etapa de privacidade futura. |
| Agendamentos | Nunca excluir no fluxo normal. |
| Horários recorrentes | Editáveis; mudança vale para disponibilidade futura. |
| Bloqueios | Exclusão física somente de futuros. |
| Produtos | Inativar quando houver interesse. |
| Promoções | Inativar; exclusão física permitida se não houver valor histórico. |
| Interesses | Exclusão administrativa de registro incorreto permitida. |

`created_at` e `updated_at` pertencem a serviços, clientes, agendamentos, bloqueios, produtos, promoções e interesses. Em agendamentos, `status_changed_at` registra a última transição sem criar auditoria excessiva.

## 11. Responsabilidades e segurança conceitual

| Operação | Público | Admin futuro |
| --- | --- | --- |
| Ler serviços/produtos/promoções ativos | Sim | Sim |
| Consultar disponibilidade | Sim, sem dados de terceiros | Sim |
| Criar agendamento e interesse associado | Sim, com validação | Sim |
| Ler clientes, telefones e agenda completa | Não | Sim |
| Alterar status, serviços, horários e bloqueios | Não | Sim |
| Administrar produtos, promoções e interesses | Não | Sim |

Nome e telefone são dados pessoais. Respostas públicas devem conter somente o mínimo necessário para a própria confirmação do cliente e nunca permitir enumeração de clientes, telefones ou agenda administrativa. A Etapa 3 deverá transformar essa divisão de responsabilidades em regras de acesso, mas não há RLS nesta etapa.

## 12. Casos de teste de domínio para as próximas etapas

1. Dado serviço de 60 minutos e só 40 minutos antes do fim da faixa, o horário não é oferecido.
2. Dado serviço de 40 minutos, faixa 14:00–19:00 e grade de 30 minutos, 14:00 e 14:30 são candidatos; 18:30 não é se terminar após 19:00.
3. Dado almoço entre 12:00 e 14:00, nenhum serviço que comece antes e termine depois de 12:00 é oferecido.
4. Dado bloqueio 10:00–12:00, nenhum candidato que interseccione esse intervalo é oferecido.
5. Dado agendamento 14:00–15:00, tentativa concorrente para 14:30–15:10 falha na confirmação.
6. Dado agendamento cancelado às 15:00, o intervalo pode voltar a ser oferecido se cumprir as demais regras.
7. Dado agendamento concluído ou não comparecido, ele não pode voltar para agendado no MVP.
8. Dado serviço Corte por R$ 35 e alteração posterior para R$ 40, agendamento antigo mantém snapshot de R$ 35.
9. Dado serviço inativado, ele deixa de aparecer publicamente, mas seus agendamentos históricos preservam referência e snapshot.
10. Dado mesmo telefone com máscara diferente, o sistema identifica um só cliente normalizado.
11. Dado mesmo telefone e novo nome, a confirmação atualiza o nome atual sem duplicar cliente.
12. Dado bloqueio proposto sobre agendamento não cancelado, a operação é rejeitada e nada é cancelado automaticamente.
13. Dado horário a menos de 60 minutos do instante atual em Fortaleza, ele não aparece.
14. Dado dia a mais de 30 dias, ele não aparece.
15. Dado dois cliques no mesmo produto após o mesmo agendamento, existe apenas um interesse.
16. Dado produto inativado, interesses já registrados permanecem consultáveis pelo admin.
17. Dada promoção inativa ou fora da vigência, ela não aparece na área pública.
18. Dado endpoint público de disponibilidade, ele não devolve telefone, lista de clientes ou outros agendamentos.

## 13. Decisões tomadas

- Uma barbearia e um barbeiro; não modelar capacidade múltipla agora.
- Preço em centavos inteiros e snapshots de serviço no agendamento.
- Telefone brasileiro normalizado como identificador natural único de cliente.
- Quatro estados de agendamento, com transições unidirecionais a partir de `AGENDADO`.
- Intenção de pagamento obrigatória, sem pagamento pelo sistema.
- Rotina semanal com múltiplas faixas, timezone `America/Fortaleza`, grade de 30 minutos, sem buffer.
- Antecedência mínima de 60 minutos e horizonte de 30 dias.
- Bloqueio conflitante é rejeitado; nunca cancela automaticamente.
- Garantia de não sobreposição no PostgreSQL, complementada por transação/RPC para as regras entre entidades.
- Sem reagendamento direto, estoque, e-commerce, motor promocional ou auditoria detalhada.

## 14. Decisões que precisamos confirmar com o barbeiro

Estas decisões não bloqueiam a modelagem inicial, mas precisam de confirmação antes da experiência pública final:

1. A grade fixa de 30 minutos, a antecedência de 60 minutos e o horizonte de 30 dias são adequados para a operação?
2. A duração máxima de 240 minutos cobre todos os serviços reais?
3. O telefone do cliente pode atualizar automaticamente o nome atual no cadastro quando o nome informado mudar?
4. Quais horários recorrentes reais, dias fechados e pausas devem iniciar o catálogo?
5. Cartão representa crédito, débito ou ambos para a comunicação com o cliente? O MVP mantém a categoria única até essa decisão.
6. Existe alguma necessidade operacional de buffer entre atendimentos que não possa ser representada na duração do serviço?
7. Há regra de cancelamento, atraso ou cobrança que deva aparecer ao cliente antes da confirmação? Não será inventada sem orientação comercial.
