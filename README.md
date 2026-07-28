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
