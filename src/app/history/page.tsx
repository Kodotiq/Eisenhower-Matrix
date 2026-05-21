import { HistoryRangePicker } from "@/components/HistoryRangePicker";
import { getPrismaClient } from "@/lib/prisma";
import type { PriorityLevel, Task } from "@/types/task";

export const dynamic = "force-dynamic";

const priorityLevels = new Set<PriorityLevel>(["High", "Low"]);

function normalizeTask(task: Task) {
  if (
    !priorityLevels.has(task.urgency as PriorityLevel) ||
    !priorityLevels.has(task.importance as PriorityLevel)
  ) {
    return null;
  }

  return {
    ...task,
    urgency: task.urgency as PriorityLevel,
    importance: task.importance as PriorityLevel,
  };
}

function getStartOfDay(base: Date) {
  const next = new Date(base);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getEndOfDay(base: Date) {
  const next = new Date(base);
  next.setHours(23, 59, 59, 999);
  return next;
}

function parseDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function parseDateInput(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function getQuadrantBadge(task: Task) {
  if (task.urgency === "High" && task.importance === "High") {
    return { label: "Do First", className: "bg-rose-50 text-rose-700" };
  }

  if (task.urgency === "Low" && task.importance === "High") {
    return { label: "Schedule", className: "bg-blue-50 text-blue-700" };
  }

  if (task.urgency === "High" && task.importance === "Low") {
    return { label: "Delegate", className: "bg-amber-50 text-amber-700" };
  }

  return { label: "Eliminate", className: "bg-slate-100 text-slate-600" };
}

async function getTasks(): Promise<Task[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    const prisma = getPrismaClient();
    const tasks = await prisma.task.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return tasks
      .map((task) => normalizeTask(task as Task))
      .filter((task): task is Task => Boolean(task));
  } catch {
    return [];
  }
}

function buildHistory(tasks: Task[], rangeStart: Date, rangeEnd: Date) {
  const start = getStartOfDay(rangeStart);
  const end = getStartOfDay(rangeEnd);
  const history = [] as Array<{
    date: Date;
    completed: Task[];
    missed: Task[];
  }>;

  for (let cursor = new Date(end); cursor >= start; cursor.setDate(cursor.getDate() - 1)) {
    const dayStart = getStartOfDay(cursor);
    const dayEnd = getEndOfDay(cursor);

    const completed: Task[] = [];
    const missed: Task[] = [];

    tasks.forEach((task) => {
      const createdAt = parseDate(task.createdAt);
      if (!createdAt || createdAt > dayEnd) {
        return;
      }

      const completedAt = parseDate(task.completedAt);
      const completedToday =
        completedAt && completedAt >= dayStart && completedAt <= dayEnd;

      if (task.frequency === "DAILY") {
        if (completedToday) {
          completed.push(task);
        } else {
          missed.push(task);
        }

        return;
      }

      if (completedToday) {
        completed.push(task);
        return;
      }

      if (!completedAt || completedAt > dayEnd) {
        missed.push(task);
      }
    });

    history.push({ date: new Date(dayStart), completed, missed });
  }

  return history;
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatRangeLabel(start: Date, end: Date) {
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return startLabel === endLabel ? startLabel : `${startLabel} to ${endLabel}`;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams?: { start?: string; end?: string };
}) {
  const tasks = await getTasks();
  const startInput = parseDateInput(searchParams?.start);
  const endInput = parseDateInput(searchParams?.end);

  let rangeStart = startInput ?? endInput;
  let rangeEnd = endInput ?? startInput;

  if (!rangeStart || !rangeEnd) {
    const today = getStartOfDay(new Date());
    rangeEnd = today;
    rangeStart = new Date(today);
    rangeStart.setDate(today.getDate() - 9);
  }

  if (rangeStart > rangeEnd) {
    const swap = rangeStart;
    rangeStart = rangeEnd;
    rangeEnd = swap;
  }

  const history = buildHistory(tasks, rangeStart, rangeEnd);
  const rangeLabel = formatRangeLabel(rangeStart, rangeEnd);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Task History
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Daily progress</h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            See what you completed and what remained for each day in the past 10 days.
          </p>
        </div>

        <div className="space-y-2">
          <HistoryRangePicker />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Showing {rangeLabel}
          </p>
        </div>

        <div className="space-y-6">
          {history.map((day) => (
            <section key={day.date.toISOString()} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{formatDate(day.date)}</h2>
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  {day.completed.length} done | {day.missed.length} missed
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Completed</p>
                  {day.completed.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">No tasks completed.</p>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {day.completed.map((task) => {
                        const badge = getQuadrantBadge(task);

                        return (
                          <li
                            key={`${task.id}-completed-${day.date.toISOString()}`}
                            className="flex items-center justify-between gap-2"
                          >
                            <span>{task.title}</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Not completed</p>
                  {day.missed.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">All tasks completed.</p>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {day.missed.map((task) => {
                        const badge = getQuadrantBadge(task);

                        return (
                          <li
                            key={`${task.id}-missed-${day.date.toISOString()}`}
                            className="flex items-center justify-between gap-2"
                          >
                            <span>{task.title}</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
