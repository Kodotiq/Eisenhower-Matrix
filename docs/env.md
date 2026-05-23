# Environment Variables

The app uses these environment variables.

## Required

- `DATABASE_URL`
  - Used by Prisma and the server.
  - Example: `file:/data/dev.db`

## Optional / runtime

- `PROJECT_NAME`
  - Used in `docker-compose.yml` to name the container.
  - Default in compose: `eisenhower-matrix`.
- `APP_DOMAIN`
  - Used by Traefik labels in `docker-compose.yml`.
  - Example: `matrix.example.com`.
- `NODE_ENV`
  - Production mode; set to `production` for Docker deployment.
- `PORT`
  - App listens on this port internally.
  - Default: `3000`.
- `HOSTNAME`
  - App host value.
  - Default: `0.0.0.0`.
- `NEXT_TELEMETRY_DISABLED`
  - Set to `1` to disable Next.js telemetry.

## Example file

A project `.env.example` should contain:

```env
PROJECT_NAME=eisenhower-matrix
APP_DOMAIN=matrix.example.com
DATABASE_URL=file:/data/dev.db
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1
```
