# Supabase Setup Guide

## Step 1 — Create a Supabase project

1. Go to https://supabase.com and sign up (free)
2. Click **New Project**
3. Name it: `music-player`
4. Set a database password (save it somewhere)
5. Choose a region close to you
6. Click **Create new project** and wait ~1 minute

---

## Step 2 — Create the songs table

1. In your Supabase project, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Paste this SQL and click **Run**:

```sql
create table songs (
  id bigint generated always as identity primary key,
  title text not null,
  artist text not null,
  album text,
  duration text,
  file_url text not null,
  cover_url text,
  category text default 'pop',
  year int,
  created_at timestamp with time zone default now()
);

-- Allow public read access
alter table songs enable row level security;

create policy "Public read" on songs
  for select using (true);

create policy "Public insert" on songs
  for insert with check (true);

create policy "Public update" on songs
  for update using (true);

create policy "Public delete" on songs
  for delete using (true);
```

---

## Step 3 — Create Storage buckets

1. Click **Storage** in the left sidebar
2. Click **New bucket**, name it: `music`, check **Public bucket** → Create
3. Click **New bucket** again, name it: `covers`, check **Public bucket** → Create

For each bucket, set the storage policy:
1. Click the bucket → **Policies** → **New policy** → **For full customization**
2. Policy name: `Public access`
3. Allowed operations: SELECT, INSERT, UPDATE, DELETE
4. Target roles: Leave empty (public)
5. USING expression: `true`
6. Save

---

## Step 4 — Get your API keys

1. Click **Project Settings** (gear icon, bottom left)
2. Click **API**
3. Copy:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **anon public** key (long string under "Project API keys")

---

## Step 5 — Add env vars to Netlify

1. Go to your Netlify site → **Site configuration** → **Environment variables**
2. Add these three variables:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Your Project URL from step 4 |
| `VITE_SUPABASE_ANON_KEY` | Your anon key from step 4 |
| `VITE_ADMIN_PASSWORD` | Any password you want for the admin panel |

3. Click **Save** after each one

---

## Step 6 — Redeploy

In Netlify → **Deploys** → **Trigger deploy** → **Deploy site**

Your site will rebuild with Supabase connected. Go to `/admin`, enter your password, and start uploading songs!
