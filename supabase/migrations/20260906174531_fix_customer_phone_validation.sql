alter table public.customers
  drop constraint customers_phone_brazilian_e164;

alter table public.customers
  add constraint customers_phone_brazilian_e164 check (
    phone ~ '^[+]55[1-9][0-9](?:[2-5][0-9]{7}|9[0-9]{8})$'
  );
