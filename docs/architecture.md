# Architecture

## Overview

This project is a Next.js application powered by Prisma with an SQLite database. It uses the App Router and server components for page rendering, and client components for interactivity and optimistic updates.

## Routes

- `/` — Main Eisenhower matrix page.
- `/done` — Completed tasks view.
- `/history` — Task history view with date range filtering.

## App structure

- `src/app/layout.tsx` — Shared layout, metadata, and navigation.
- `src/app/page.tsx` — Loads active tasks and renders `MatrixGrid`.
- `src/app/done/page.tsx` — Loads completed tasks and renders `DoneTaskList`.
- `src/app/history/page.tsx` — Loads all tasks and builds a historic summary.

## Data flow

1. Pages call `getPrismaClient()` from `src/lib/prisma.ts`.
2. `getPrismaClient()` creates a singleton Prisma client using `process.env.DATABASE_URL`.
3. Pages query `prisma.task.findMany()` for task data.
4. `src/app/actions.ts` performs task creation, updates, completion, restore, and delete actions.
5. Client components call these actions with Next.js server actions.

## Prisma client usage

- `src/lib/prisma.ts` ensures only one `PrismaClient` exists globally.
- Logging is enabled for errors and warnings in development.

## Component hierarchy

- `MatrixGrid` — Main matrix UI and task form.
  - `TaskReminders` — Browser notification manager.
  - `Quadrant` — Droppable quadrant area.
    - `TaskCard` — Draggable task item with actions.
- `DoneTaskList` — Completed tasks list with restore/delete buttons.
- `HistoryRangePicker` — Date range controls for history filtering.

## Client/server boundaries

- Server components:
  - `src/app/page.tsx`
  - `src/app/done/page.tsx`
  - `src/app/history/page.tsx`
  - `src/app/actions.ts`

- Client components:
  - `src/components/MatrixGrid.tsx`
  - `src/components/Quadrant.tsx`
  - `src/components/TaskCard.tsx`
  - `src/components/DoneTaskList.tsx`
  - `src/components/HistoryRangePicker.tsx`
  - `src/components/TaskReminders.tsx`

## Key behavior

- Tasks are filtered by urgency/importance and completion state.
- Daily tasks reappear each day unless completed that day.
- Prayer tasks are always daily and disable manual reminder time.
- Drag and drop moves tasks between quadrants.
- Optimistic UI updates provide instant feedback for moves, completion, and deletion.
