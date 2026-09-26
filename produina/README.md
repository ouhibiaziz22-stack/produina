# Produiwina (AZIX)

Tunisian streetwear and BAC 2K27 merchandise store: a TanStack Start storefront with an admin dashboard, backed by an Express API on Supabase.

## Architecture

```text
Browser ──▶ Vercel: frontend/ (TanStack Start SSR)     env: VITE_API_URL
   │
   └──HTTPS + JWT──▶ Render: backend/ (Express API)     env: Supabase secret key, JWT secret
                          │
                          └──▶ Supabase: Postgres + Storage bucket "product-images"
```

- **The browser only talks to the API.** No Supabase keys ship to the frontend. Every write is validated, rate-limited and priced on the server.
- **One Supabase project, one migrations folder**: `supabase/migrations/`. Row Level Security is on for every table with no public policies, so only the API's service key can read or write.
- **Pre-orders** (`POST /api/preorders`) are public requests with no payment. Prices are recalculated from the database, and admins follow them up under Admin → Pre-orders.
- **Orders** (`POST /api/orders`) are for signed-in customers, cash on delivery only until an online payment provider is integrated.
- **Product images** are uploaded by admins to Supabase Storage (`POST /api/uploads/image`); product rows store URLs only.

```text
produina/
├── frontend/            React 19 + TanStack Start + Tailwind 4 (storefront + /admin)
├── backend/             Express 5 + TypeScript + Supabase
├── supabase/migrations/ Database schema, storage bucket, launch catalog seed
└── vercel.json          Frontend deployment
../render.yaml           API deployment (Render Blueprint, at the Git root)
```

## Run locally

```bash
npm install
cp backend/.env.example backend/.env     # fill in SUPABASE_URL, SUPABASE_SECRET_KEY, JWT_SECRET
cp frontend/.env.example frontend/.env
npm run dev:backend                      # http://localhost:5000/api/health
npm run dev:frontend                     # http://localhost:8080
```

Apply the migrations in `supabase/migrations/` in filename order, using the Supabase SQL editor or `supabase db push`. The last migration creates the `product-images` bucket and seeds the launch catalog.

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` to have the API create or promote the first administrator at startup, then sign in at `/admin`.

## Deploy

1. **Supabase**: create the project and apply the migrations. Copy the project URL and the **secret** (service role) key.
2. **API on Render**: New → Blueprint → select this repo (it reads `render.yaml`). Fill in `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `FRONTEND_URL` (your storefront domain; separate several with commas) and the admin credentials. Point `api.yourdomain` at the service.
3. **Frontend on Vercel**: set **Root Directory** to `produina` (the Git repo starts one folder up) and set `VITE_API_URL=https://api.yourdomain/api`. Redeploy after changing it, because Vite bakes the value in at build time.
4. **Check**: `GET https://api.yourdomain/api/health` should return `"status":"ok"`. Then place a test pre-order and confirm it appears in Admin → Pre-orders.

## Verification

```bash
npm run build
npm run typecheck
npm run lint
```

## Not built yet

- Online payment: the `PaymentProvider` interface is in place, but only cash on delivery is accepted.
- AI logo generation: `backend/src/services/aiLogoService.ts` returns placeholder concepts.
- Customer pages for order history and saved designs. The API endpoints exist (`/api/orders`, `/api/designs`), but the storefront doesn't use them yet.
