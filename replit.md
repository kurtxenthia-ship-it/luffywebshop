# LUFFY XO.SHOP

A full-stack Philippine digital shop web application built with React + Vite frontend and Express API backend.

## Architecture

### Monorepo Structure
```
artifacts/
  luffy-shop/        # React + Vite frontend (served at /)
  api-server/        # Express API server (served at /api)
lib/
  db/                # Drizzle ORM schema + PostgreSQL pool
  api-spec/          # OpenAPI spec + codegen scripts
  api-client-react/  # Generated React Query hooks + custom fetch
  api-zod/           # Generated Zod validation schemas
```

### Tech Stack
- **Frontend**: React 18, Vite, Wouter (routing), TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, express-session, connect-pg-simple
- **Database**: PostgreSQL (Replit-managed), Drizzle ORM
- **Auth**: bcryptjs password hashing, session-based auth with PostgreSQL session store
- **API Contract**: OpenAPI spec → Orval codegen → type-safe hooks + validators

## Features
1. **Authentication** - Login/Register with unique user IDs (LXO-XXXXXXXX format)
2. **Coin Balance System** - Users have coin balances, spent on services
3. **TXT Generator** - Admin uploads TXT files; users generate 50/100/200 lines for 20/40/80 coins
4. **CODM Account Generator** - Generate CODM accounts for 10 coins each
5. **GCash Topup** - Users submit GCash reference numbers; admin approves to add coins
6. **Admin Dashboard** - Upload files, manage user balances, approve topups, view recent logins

## Admin Access
- **Email**: kenzohaizen@gmail.com
- **Password**: kenzo213
- Admin can access `/admin` route with full dashboard

## Database Schema
- `users` - User accounts with balance and unique userId
- `transactions` - Topup/spend coin transaction records
- `txt_files` - Uploaded TXT files for generation
- `generation_history` - Track user generation requests
- `codm_accounts` - Generated CODM accounts per user
- `login_events` - Recent login tracking for admin dashboard
- `session` - PostgreSQL session store (express-session)

## Key Files
- `artifacts/luffy-shop/src/App.tsx` - Route config with auth guards
- `artifacts/luffy-shop/src/contexts/AuthContext.tsx` - Auth state management
- `artifacts/luffy-shop/src/pages/` - All page components
- `artifacts/api-server/src/app.ts` - Express app setup with sessions
- `artifacts/api-server/src/routes/` - All API routes
- `lib/db/src/schema/` - Drizzle table definitions
- `lib/api-spec/openapi.yaml` - OpenAPI specification

## Theme
Dark red theme (almost black background with red primary color). Footer credit: "@web is designed by t.me/cozybalenciaga | @cozy x luffy web generator"

## Running the App
Workflows:
- `artifacts/api-server: API Server` - Runs on port 8080, proxied at `/api`
- `artifacts/luffy-shop: web` - Runs on dynamic port, proxied at `/`
