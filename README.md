# Whisk

Recipe app with browser-local converters, image tools, and cloud-synced recipes.

## Local dev

**Backend** (`backend/`):

```bash
cp .env.example .env
npm install && npx prisma generate && npx prisma db push && npm run dev
```

**Frontend** (repo root):

```bash
npm install && npm run dev
```

Optional: `VITE_API_URL=http://localhost:3001` in root `.env`.

## Verify before deploy

```bash
npm test && npm run build
cd backend && npm test && npm run build
```

Frontend deploys from `main` via Netlify (`netlify.toml` → `dist/`). Production API URL is set in `netlify.toml` as `VITE_API_URL`. Backend deploys separately to Heroku from `backend/`.

## Tools

31 client-side tools under `/tools` (photos, kitchen, writing, codes, data). Registry: `src/constants/tools.ts`.
