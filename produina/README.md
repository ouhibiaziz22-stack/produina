# Produiwina (AZIX)

Tunisian streetwear and BAC 2K27 merchandise store: a TanStack Start storefront with an admin dashboard, running directly on Supabase.

## Architecture

```text
Browser ──▶ Vercel: frontend/ (TanStack Start SSR)
   │           env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (public)
   │
   └──▶ Supabase
          ├─ Auth: email + password sign-in
          ├─ Postgres: Row Level Security on every table
          ├─ Functions: submit_preorder(), set_user_role()
          └─ Storage: public bucket "product-images"
```

There is no separate API server. The browser uses only Supabase's **public** key, and the database enforces every rule:

| Who | Can do |
|---|---|
| Anyone | Read active products. Submit pre-orders **only** through `submit_preorder()`, which validates the form, prices items from the database, rate-limits by email and IP, and drops bots via a honeypot field. |
| Signed-in customer | Everything above, plus read and edit their own profile (name, phone, address; never role or email) and their own orders and designs. |
| Admin (`profiles.role = 'admin'`) | Manage products, orders, pre-orders, notifications and users. Change roles through `set_user_role()`, which refuses to demote yourself. Upload product images (PNG/JPG/WEBP, max 5 MB). |

The rules live in `supabase/migrations/`. Read `20260927120000_supabase_auth_rls.sql` before changing anything security-related.

```text
produina/
├── frontend/             React 19 + TanStack Start + Tailwind 4 (storefront + /admin)
│   └── src/lib/supabase.ts   the only data layer
├── supabase/migrations/  schema, security rules, functions, bucket, launch catalog
└── vercel.json           frontend deployment
```

## Run locally

```bash
npm install
cp frontend/.env.example frontend/.env   # fill in the project URL and publishable key
npm run dev                              # http://localhost:8080
```

## Database changes

Migrations are applied in filename order and tracked in `supabase_migrations.schema_migrations`. Put the connection string (**Project Settings → Database → Connection string → Session pooler**) in the git-ignored `supabase/.env` as `DATABASE_URL`, then run:

```bash
npx supabase db push --db-url "<DATABASE_URL>"
```

To make someone an administrator on a fresh project, have them sign up on the storefront, then run this in the SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## Deploy (Vercel)

1. Import the repo and set **Root Directory** to `produina` (the Git repo starts one folder up).
2. Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Redeploy after changing them, because Vite bakes them in at build time.
3. In Supabase, go to **Authentication → URL Configuration** and set **Site URL** to your storefront domain, so confirmation emails link back to it.

## Verification

```bash
npm run build
npm run typecheck
npm run lint
```

## Not built yet

- Online payment. Pre-orders are requests; nothing is charged.
- Customer pages for order history and saved designs. The tables and security rules exist, but the storefront doesn't show them yet.
