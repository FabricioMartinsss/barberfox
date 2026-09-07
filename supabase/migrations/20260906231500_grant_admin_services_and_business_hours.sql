-- O MVP possui um único administrador: todo JWT autenticado recebe somente os
-- acessos administrativos necessários nesta etapa. Anon permanece sem acesso.

grant select, insert, update on table public.services to authenticated;
grant select, insert, update, delete on table public.business_hours to authenticated;

revoke all on table public.services from anon;
revoke all on table public.business_hours from anon;

create policy services_authenticated_select
on public.services
for select
to authenticated
using (true);

create policy services_authenticated_insert
on public.services
for insert
to authenticated
with check (true);

create policy services_authenticated_update
on public.services
for update
to authenticated
using (true)
with check (true);

create policy business_hours_authenticated_select
on public.business_hours
for select
to authenticated
using (true);

create policy business_hours_authenticated_insert
on public.business_hours
for insert
to authenticated
with check (true);

create policy business_hours_authenticated_update
on public.business_hours
for update
to authenticated
using (true)
with check (true);

create policy business_hours_authenticated_delete
on public.business_hours
for delete
to authenticated
using (true);
