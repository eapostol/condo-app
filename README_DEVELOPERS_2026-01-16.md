# Condo Management MERN Demo — Developer README

## Overview

This repository is a demo MERN application that exposes condo management reports through a role-based web portal.

**Stack**

- Frontend: React + Vite (port 3000)
- Backend: Node.js + Express (port 5000)
- Datastores:
  - MongoDB (primary app data)
  - MySQL (reporting/demo schema; initialized via `server/db/mysql/init`)

**Auth**

- Local username/password (JWT)
- Google OAuth (Passport)
- Microsoft OAuth (Passport)

## Repo structure

- `client/` — React/Vite UI
- `server/` — Express API + static hosting for production builds
- `docker/` — container entrypoint scripts

## Environment variables

- Real file (included for this demo bundle): `server/.env.docker`
- Template file (structure reference): `server/.env.docker.example`

Important variables:

- `PORT` (backend, default 5000)
- `MONGO_URI` (should be `mongodb://mongo:27017/condo_app` when using Docker)
- `CLIENT_URL` (CORS + OAuth redirect base; demo uses `http://localhost:3000`)
- MySQL reporting vars: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`

## Local development (no Docker)

From repo root:

```bash
npm run install:all
npm run dev
```

- UI: http://localhost:3000
- API: http://localhost:5000

## Docker (demo / production-style)

From repo root:

```bash
docker compose up --build
```

- App (static UI served by backend container): http://localhost:3000

### Seed-once behavior

- The image uses `docker/entrypoint.sh` as its entrypoint.
- If `SEED_ON_START=true`, the entrypoint runs `server/src/scripts/seed-once.js`.
- `seed-once.js` only seeds when there are **no users** in MongoDB.

To fully reset data:

```bash
docker compose down -v
```

## Docker development (hot reload)

Use the dev compose file:

```bash
docker compose -f docker-compose.dev.yml up --build
```

- UI (Vite): http://localhost:3000
- API: http://localhost:5000

## API docs

- Swagger UI: http://localhost:3000/api/docs (demo)
  - (In dev compose, API is separate, so use http://localhost:5000/api/docs)

## Notes

- `.dockerignore` keeps `node_modules` and secrets out of Docker build context.
- This is a demo setup; do not use the included secrets in production.
