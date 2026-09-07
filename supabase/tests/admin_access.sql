begin;

set local role anon;

do $$
begin
  begin
    perform 1 from public.services;
    raise exception 'anon conseguiu listar services';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.services (name, price_cents, duration_minutes)
    values ('Serviço anon', 3500, 40);
    raise exception 'anon conseguiu criar service';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform 1 from public.business_hours;
    raise exception 'anon conseguiu listar business_hours';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.business_hours (weekday, starts_at, ends_at)
    values (1, '08:00', '12:00');
    raise exception 'anon conseguiu criar business_hours';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
set local role authenticated;

do $$
declare
  service_id uuid;
  hour_id uuid;
  protected_table text;
begin
  insert into public.services (name, description, price_cents, duration_minutes)
  values ('Serviço de acesso', 'Teste transacional', 3500, 40)
  returning id into service_id;

  perform 1 from public.services where id = service_id;

  update public.services
  set name = 'Serviço de acesso editado', active = false
  where id = service_id;

  begin
    delete from public.services where id = service_id;
    raise exception 'authenticated conseguiu remover service';
  exception when insufficient_privilege then
    null;
  end;

  insert into public.business_hours (weekday, starts_at, ends_at)
  values (2, '08:00', '12:00')
  returning id into hour_id;

  perform 1 from public.business_hours where id = hour_id;

  update public.business_hours
  set starts_at = '08:30', ends_at = '12:30'
  where id = hour_id;

  delete from public.business_hours where id = hour_id;

  foreach protected_table in array array[
    'customers', 'appointments', 'schedule_blocks', 'products', 'promotions', 'product_interests'
  ] loop
    begin
      execute format('select 1 from public.%I', protected_table);
      raise exception 'authenticated conseguiu listar %', protected_table;
    exception when insufficient_privilege then
      null;
    end;
  end loop;
end;
$$;

reset role;
rollback;
