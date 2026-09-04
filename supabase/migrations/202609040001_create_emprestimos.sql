create table if not exists public.emprestimos (
  id text primary key,
  nome text not null,
  pessoa text not null,
  data text not null,
  status text not null check (status in ('andamento', 'devolucao', 'concluido', 'aguardando', 'negociacao', 'recusado')),
  emoji text not null default '🛠️',
  cor text not null default 'from-amber-100 to-orange-200',
  created_at timestamptz not null default now()
);

alter table public.emprestimos enable row level security;

drop policy if exists "emprestimos_select_publico" on public.emprestimos;
create policy "emprestimos_select_publico"
on public.emprestimos for select
to anon
using (true);

truncate table public.emprestimos;
insert into public.emprestimos (id, nome, pessoa, data, status, emoji, cor)
values ('furadeira-impacto', 'Furadeira de Impacto', 'Ana L.', 'Até 05 Nov 2026', 'devolucao', '🛠️', 'from-amber-100 to-orange-200');
