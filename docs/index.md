# Eisenhower Matrix Documentation

This folder contains project documentation generated from the codebase.

## Contents

- `architecture.md` — app architecture, routes, and request flow.
- `database.md` — Prisma schema, database model, and seed data.
- `deployment.md` — Docker and Dokploy/Traefik deployment setup.
- `env.md` — environment variables required to run the app.

## Project files

The application is a Next.js 16 app with Prisma and SQLite.

Key files:

- `package.json` — dependencies and scripts.
- `next.config.ts` — Next.js config placeholder.
- `tsconfig.json` — TypeScript configuration.
- `Dockerfile` — build/runtime image.
- `docker-compose.yml` — Dokploy/Traefik deployment config.
- `prisma/schema.prisma` — database schema.
- `prisma/seed.ts` — seed data for initial tasks.
- `src/app/page.tsx` — main matrix page.
- `src/app/done/page.tsx` — completed tasks page.
- `src/app/history/page.tsx` — history page.
- `src/app/actions.ts` — server actions for task CRUD.
- `src/lib/prisma.ts` — Prisma client bootstrap.
- `src/components/*.tsx` — UI components.
- `src/types/task.ts` — shared task types.
