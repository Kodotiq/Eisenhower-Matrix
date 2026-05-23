# Database

## Prisma schema

The app uses SQLite and defines a single `Task` model.

`prisma/schema.prisma`:

- `datasource db` uses `provider = "sqlite"` and `url = env("DATABASE_URL")`.
- `TaskFrequency` enum: `ONE_TIME`, `DAILY`.
- `TaskCategory` enum: `GENERAL`, `PRAYER`.

### Task model fields

- `id: String` — UUID primary key.
- `title: String` — task description.
- `urgency: String` — either `High` or `Low`.
- `importance: String` — either `High` or `Low`.
- `frequency: TaskFrequency` — defaults to `ONE_TIME`.
- `category: TaskCategory` — defaults to `GENERAL`.
- `reminderTime: String?` — optional HH:MM reminder.
- `completedAt: DateTime?` — completion timestamp.
- `createdAt: DateTime` — creation timestamp, default `now()`.

## Seed data

`prisma/seed.ts` resets tasks and seeds initial examples, including:

- Prayer task: `5 Daily Prayers` (`DAILY`, `PRAYER`).
- Daily work and fitness tasks.
- One-time low-priority tasks.

## Running seed

Use the script from `package.json`:

```bash
npm run db:seed
```

## Notes

- The app stores SQLite data in a mounted volume at `/data` when deployed with Docker Compose.
- `DATABASE_URL` must point to a writable SQLite path, for example `file:/data/dev.db`.
