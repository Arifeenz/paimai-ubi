-- Create a table for public profiles link to auth.users
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  business_name text,
  business_type text,
  description text,
  signature_menu text,
  history text,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(business_name) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- Create a table for documents (Knowledge Base)
create table documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  filename text not null,
  content text, -- Text content extracted from file or typed directly
  file_path text, -- Path in Supabase Storage (if applicable)
  file_type text -- 'pdf', 'text', 'input'
);

-- RLS for documents
alter table documents enable row level security;

create policy "Users can view own documents." on documents
  for select using ((select auth.uid()) = user_id);

create policy "Users can insert own documents." on documents
  for insert with check ((select auth.uid()) = user_id);

create policy "Users can update own documents." on documents
  for update using ((select auth.uid()) = user_id);

create policy "Users can delete own documents." on documents
  for delete using ((select auth.uid()) = user_id);

-- Storage bucket for documents (optional, but good for PDFs)
-- insert into storage.buckets (id, name) values ('documents', 'documents');
-- create policy "Authenticated can upload documents" on storage.objects for insert to authenticated with check (bucket_id = 'documents');
-- create policy "Authenticated can select documents" on storage.objects for select to authenticated using (bucket_id = 'documents');
