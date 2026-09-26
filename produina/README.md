# Produiwina

Produiwina is a Tunisian BAC merchandise platform. The existing customizer is preserved and now lives in an independent React frontend, while an Express + Supabase API provides authentication, catalog management, saved designs, AI-logo provider integration, uploads, and server-side order pricing.

## Structure

```text
Produiwina/
├── frontend/   React + TypeScript + Vite + Tailwind
├── backend/    Express + TypeScript + Supabase
└── README.md
```

## Run locally

```bash
npm install
```

Create `backend/.env` from `backend/.env.example` and provide the Supabase project URL, the server-only service-role key, and a JWT secret of at least 32 characters. Apply the migration in `frontend/supabase/migrations/20260926050000_backend_store.sql` before starting the API. Create `frontend/.env` from `frontend/.env.example` when the API is not at its default URL.

```bash
npm run dev:backend
npm run dev:frontend
```

The storefront is served at `http://localhost:5173`; the API health check is `GET http://localhost:5000/api/health`.

## API surface

`/api/auth` handles register, login, current user, and logout. `/api/products`, `/api/bac`, `/api/designs`, `/api/orders`, `/api/users`, `/api/uploads`, and `/api/ai/logo` expose the catalog, customization, administration, secure image upload, and free AI-logo flows. Admin mutations require an admin JWT.

The order endpoint recalculates product, fabric, print-method, placement, and extra prices from the database. A frontend total is never trusted. AI logo concepts explicitly return `price: 0`; the provider is isolated in `backend/src/services/aiLogoService.ts` for later replacement.

## Verification

```bash
npm run build
npm run lint
```

The frontend preserves the guided customizer and includes API-ready routes for products, details, cart, checkout, authentication, profile, orders, designs, gallery, contact, FAQ, about, and protected admin pages. The live preview includes layered textile lighting, an expanded color palette, front/back switching, zoom, 360° rotation, draggable logo positioning, scale/rotation controls, print methods, placement zones, undo/redo, reset, and transparent AI-logo pricing.

## Admin access

The API can provision the first administrator at startup from the ignored `backend/.env` values `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`. The password is hashed before it is saved. Once the API can reach Supabase, sign in through the normal login flow and open `/admin`; the protected dashboard manages products, orders, users and roles, saved designs, and BAC categories.

## Production notes

Configure the Supabase migration, HTTPS, managed image storage, and a production AI provider through backend services. Never put JWT secrets, service-role credentials, or provider keys in frontend environment variables. Existing MongoDB data must be exported and transformed into the Supabase tables before the old database is decommissioned.
