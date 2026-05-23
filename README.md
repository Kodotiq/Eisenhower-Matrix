# Eisenhower-Matrix

A Next.js + Prisma task prioritization app using the Eisenhower matrix.

## Deployment

This project is built as a single Next.js app with SQLite/Prisma.

### Required environment variables

- `PROJECT_NAME` - container/project name prefix
- `APP_DOMAIN` - host used by Traefik for HTTPS routing
- `DATABASE_URL` - e.g. `file:/data/dev.db`
- `NODE_ENV` - typically `production`
- `PORT` - typically `3000`
- `HOSTNAME` - typically `0.0.0.0`

### Docker Compose

Use `docker-compose.yml` to deploy with Dokploy and Traefik.
The app exposes port `3000` internally and routes via the `APP_DOMAIN` host rule.

### Persistent data

The SQLite database is persisted in the `eisenhower-data` volume at `/data`.
