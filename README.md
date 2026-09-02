# Tuque Task Manager

Internal task manager. Next.js (App Router) on Vercel, Supabase for auth/database. See [MILESTONES.md](MILESTONES.md) for the build plan and [asana-feature-reference.md](asana-feature-reference.md) for the full feature scope.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project at [supabase.com](https://supabase.com), then copy `.env.local.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```
   Both values are in your Supabase project's Settings → API.
3. Apply the schema in `supabase/migrations/0001_init.sql` — paste it into the Supabase SQL editor, or run it via the [Supabase CLI](https://supabase.com/docs/guides/cli):
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`. Create an account, then you'll land on the (empty) dashboard.

## Deploying

Push to a Git repo and import it in Vercel, or run `vercel`. Add the two `NEXT_PUBLIC_SUPABASE_*` env vars in the Vercel project settings (Production, Preview, and Development).

## Stack

- **Next.js 16** (App Router, Turbopack) — see `AGENTS.md` / `node_modules/next/dist/docs/` for version-specific conventions (async `params`/`searchParams`, `proxy.ts` instead of `middleware.ts`, etc.)
- **Supabase** — Postgres, Auth, Row-Level Security. Client setup in `src/lib/supabase/`.
- **Tailwind CSS v4** — design tokens in `src/app/globals.css`; base components in `src/components/ui/`.
