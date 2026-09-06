begin;

do $$
declare
  customer_a uuid;
  customer_b uuid;
  service_a uuid;
  product_a uuid;
  appointment_a uuid;
  appointment_b uuid;
begin
  if (
    select count(*)
    from pg_tables
    where schemaname = 'public'
      and tablename in (
        'services', 'customers', 'appointments', 'business_hours',
        'schedule_blocks', 'products', 'promotions', 'product_interests'
      )
      and rowsecurity
  ) <> 8 then
    raise exception 'RLS não está habilitado em todas as tabelas do domínio';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'services', 'customers', 'appointments', 'business_hours',
        'schedule_blocks', 'products', 'promotions', 'product_interests'
      )
  ) then
    raise exception 'uma policy inesperada removeu o default deny da Etapa 3';
  end if;

  if not exists (
    select 1
    from pg_extension extension
    join pg_namespace extension_schema on extension_schema.oid = extension.extnamespace
    where extension.extname = 'btree_gist'
      and extension_schema.nspname = 'extensions'
  ) then
    raise exception 'extensão btree_gist não está habilitada no schema extensions';
  end if;

  if (
    select count(*)
    from pg_constraint
    where conname in (
      'appointments_no_overlapping_occupied_intervals',
      'schedule_blocks_no_overlap',
      'business_hours_no_overlap_or_touch'
    )
  ) <> 3 then
    raise exception 'constraints temporais esperadas não foram encontradas';
  end if;

  insert into public.customers (name, phone)
  values ('Cliente A', '+5585999999999')
  returning id into customer_a;

  begin
    insert into public.customers (name, phone)
    values ('Cliente duplicado', '+5585999999999');
    raise exception 'telefone duplicado foi aceito';
  exception when unique_violation then
    null;
  end;

  insert into public.customers (name, phone)
  values ('Cliente B', '+5585988888888')
  returning id into customer_b;

  begin
    insert into public.services (name, price_cents, duration_minutes)
    values ('Preço inválido', 0, 30);
    raise exception 'preço inválido foi aceito';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.services (name, price_cents, duration_minutes)
    values ('Duração inválida', 1000, 0);
    raise exception 'duração inválida foi aceita';
  exception when check_violation then
    null;
  end;

  insert into public.services (name, price_cents, duration_minutes)
  values ('Corte de teste', 3500, 60)
  returning id into service_a;

  begin
    insert into public.appointments (
      customer_id, service_id, service_name_snapshot,
      service_price_cents_snapshot, service_duration_minutes_snapshot,
      starts_at, ends_at, intended_payment_method
    ) values (
      customer_a, service_a, 'Corte de teste', 3500, 60,
      '2030-01-01 15:00:00-03', '2030-01-01 14:00:00-03', 'PIX'
    );
    raise exception 'intervalo inválido de agendamento foi aceito';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.appointments (
      customer_id, service_id, service_name_snapshot,
      service_price_cents_snapshot, service_duration_minutes_snapshot,
      starts_at, ends_at, intended_payment_method
    ) values (
      customer_a, service_a, 'Corte de teste', 3500, 60,
      '2030-01-01 14:00:00-03', '2030-01-01 15:00:00-03',
      'INVALIDO'::public.intended_payment_method
    );
    raise exception 'forma de pagamento inválida foi aceita';
  exception when invalid_text_representation then
    null;
  end;

  begin
    insert into public.appointments (
      customer_id, service_id, service_name_snapshot,
      service_price_cents_snapshot, service_duration_minutes_snapshot,
      starts_at, ends_at, intended_payment_method, status
    ) values (
      customer_a, service_a, 'Corte de teste', 3500, 60,
      '2030-01-01 14:00:00-03', '2030-01-01 15:00:00-03', 'PIX',
      'INVALIDO'::public.appointment_status
    );
    raise exception 'status inválido foi aceito';
  exception when invalid_text_representation then
    null;
  end;

  insert into public.appointments (
    customer_id, service_id, service_name_snapshot,
    service_price_cents_snapshot, service_duration_minutes_snapshot,
    starts_at, ends_at, intended_payment_method
  ) values (
    customer_a, service_a, 'Corte de teste', 3500, 60,
    '2030-01-01 14:00:00-03', '2030-01-01 15:00:00-03', 'PIX'
  ) returning id into appointment_a;

  begin
    insert into public.appointments (
      customer_id, service_id, service_name_snapshot,
      service_price_cents_snapshot, service_duration_minutes_snapshot,
      starts_at, ends_at, intended_payment_method
    ) values (
      customer_b, service_a, 'Corte de teste', 3500, 60,
      '2030-01-01 14:30:00-03', '2030-01-01 15:30:00-03', 'CARTAO'
    );
    raise exception 'double booking sobreposto foi aceito';
  exception when exclusion_violation then
    null;
  end;

  insert into public.appointments (
    customer_id, service_id, service_name_snapshot,
    service_price_cents_snapshot, service_duration_minutes_snapshot,
    starts_at, ends_at, intended_payment_method
  ) values (
    customer_b, service_a, 'Corte de teste', 3500, 60,
    '2030-01-01 15:00:00-03', '2030-01-01 16:00:00-03', 'DINHEIRO'
  ) returning id into appointment_b;

  update public.appointments
  set status = 'CANCELADO'
  where id = appointment_a;

  insert into public.appointments (
    customer_id, service_id, service_name_snapshot,
    service_price_cents_snapshot, service_duration_minutes_snapshot,
    starts_at, ends_at, intended_payment_method
  ) values (
    customer_a, service_a, 'Corte de teste', 3500, 60,
    '2030-01-01 14:00:00-03', '2030-01-01 15:00:00-03', 'PIX'
  );

  begin
    insert into public.schedule_blocks (starts_at, ends_at)
    values ('2030-01-02 16:00:00-03', '2030-01-02 15:00:00-03');
    raise exception 'bloqueio com intervalo inválido foi aceito';
  exception when check_violation then
    null;
  end;

  insert into public.schedule_blocks (starts_at, ends_at, reason)
  values ('2030-01-02 14:00:00-03', '2030-01-02 16:00:00-03', 'Teste');

  begin
    insert into public.schedule_blocks (starts_at, ends_at)
    values ('2030-01-02 15:00:00-03', '2030-01-02 17:00:00-03');
    raise exception 'bloqueios sobrepostos foram aceitos';
  exception when exclusion_violation then
    null;
  end;

  insert into public.products (name, price_cents)
  values ('Pomada de teste', 2500)
  returning id into product_a;

  insert into public.product_interests (appointment_id, product_id)
  values (appointment_b, product_a);

  begin
    insert into public.product_interests (appointment_id, product_id)
    values (appointment_b, product_a);
    raise exception 'interesse duplicado foi aceito';
  exception when unique_violation then
    null;
  end;

  insert into public.business_hours (weekday, starts_at, ends_at)
  values (1, '08:00', '12:00');

  begin
    insert into public.business_hours (weekday, starts_at, ends_at)
    values (1, '12:00', '14:00');
    raise exception 'intervalos recorrentes adjacentes foram aceitos';
  exception when exclusion_violation then
    null;
  end;
end;
$$;

set local role anon;

do $$
begin
  perform 1 from public.services;
  raise exception 'anon conseguiu ler tabela protegida';
exception when insufficient_privilege then
  null;
end;
$$;

reset role;
rollback;
