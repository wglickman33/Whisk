# Whisk API

Node.js/Express backend with SQLite (Prisma), JWT auth, and recipe storage.

## Setup

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

## API

### Auth

- `POST /api/auth/register` — { email, password, name? }
- `POST /api/auth/login` — { email, password }
- `GET /api/auth/me` — Bearer token required

### Recipes

- `GET /api/recipes` — Bearer token required (CRUD coming soon)
