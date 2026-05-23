# Deployment

## Docker configuration

The app is packaged with a multi-stage `Dockerfile`:

- `base` stage installs Node and required certificates.
- `deps` stage installs dependencies.
- `builder` stage builds the Next.js app.
- `runner` stage installs production dependencies and copies the built `.next` output.

The container runs:

```bash
sh -c "npx prisma migrate deploy && npm run start"
```

## Docker Compose

`docker-compose.yml` is configured for Dokploy and Traefik routing.

Service:

- `app` — builds from `Dockerfile`.
- Uses `env_file: .env` to load runtime environment variables.
- Exposes internal port `3000`.
- Uses Traefik labels for HTTPS routing:
  - `Host(`${APP_DOMAIN}`)`
  - `websecure` entrypoint
  - `letsencrypt` cert resolver

Persistent storage:

- `eisenhower-data` volume mounted at `/data`.

## Build and run

Local build:

```bash
npm install
npm run build
npm start
```

Docker build and run:

```bash
docker compose up --build
```

## Dokploy notes

This compose file is ready for deployment behind Traefik as long as:

- `APP_DOMAIN` is set to the intended hostname.
- `DATABASE_URL` points to `file:/data/dev.db`.
- The volume `eisenhower-data` is available for persistence.

## Important runtime variables

- `NODE_ENV=production`
- `PORT=3000`
- `HOSTNAME=0.0.0.0`
- `NEXT_TELEMETRY_DISABLED=1`
