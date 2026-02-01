-- Create a table to store influencer customizations
create table if not exists public.influencer_settings (
  influencer_id text not null,
  base_prompt text,
  system_prompt text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint influencer_settings_pkey primary key (influencer_id)
);

-- Enable Row Level Security (RLS)
alter table public.influencer_settings enable row level security;

-- Create policies (assuming public access for this demo, or authenticated if user login exists)
-- For now, we'll allow anyone to read/write since we don't have user auth visible in this slice
create policy "Allow public access"
  on public.influencer_settings
  for all
  using (true)
  with check (true);
