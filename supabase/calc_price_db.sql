-- ============================================================
-- ตารางเก็บฐานข้อมูลราคาวัสดุ + อัตราค่าบริการ ของหน้า Calculator
-- เก็บเป็นแถวเดียว (id = 'default') แล้ว sync ข้ามเครื่องผ่าน Supabase realtime
--
-- วิธีใช้: เปิด Supabase Dashboard > SQL Editor แล้วรันสคริปต์นี้ 1 ครั้ง
-- ถ้ายังไม่รัน หน้า Calculator จะทำงานปกติโดยเก็บค่าไว้ใน localStorage เครื่องนั้น
-- ============================================================

create table if not exists public.calc_price_db (
  id            text primary key,
  materials     jsonb not null default '[]'::jsonb,
  service_rates jsonb not null default '[]'::jsonb,
  client_id     text,
  updated_at    timestamptz not null default now()
);

-- ระบบไม่มี auth: เปิดให้ role anon และ authenticated อ่าน/เขียนได้
alter table public.calc_price_db enable row level security;

drop policy if exists "calc_price_db access" on public.calc_price_db;
create policy "calc_price_db access"
  on public.calc_price_db
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- เปิด realtime ให้ตารางนี้ (เพิ่มเฉพาะเมื่อยังไม่ได้เพิ่ม จึงรันซ้ำได้ไม่ error)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'calc_price_db'
  ) then
    alter publication supabase_realtime add table public.calc_price_db;
  end if;
end $$;
