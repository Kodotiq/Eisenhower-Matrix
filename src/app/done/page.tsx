import { DoneTaskList } from "@/components/DoneTaskList";
import { getPrismaClient } from "@/lib/prisma";
import type { PriorityLevel, Task } from "@/types/task";

export const dynamic = "force-dynamic";

const priorityLevels = new Set<PriorityLevel>(["High", "Low"]);

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

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

async function getDoneTasks(): Promise<{ completedToday: Task[]; completedOneTime: Task[] }> {
  if (!process.env.DATABASE_URL) {
    return { completedToday: [], completedOneTime: [] };
  }

  try {
    const prisma = getPrismaClient();
    const tasks = await prisma.task.findMany({
      where: {
        completedAt: {
          not: null,
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    const todayStart = getStartOfToday();
    const normalized = tasks
      .map((task) => normalizeTask(task as Task))
      .filter((task): task is Task => Boolean(task));

    const completedToday = normalized.filter(
      (task) => task.completedAt && new Date(task.completedAt) >= todayStart,
    );
    const completedOneTime = normalized.filter(
      (task) =>
        task.frequency === "ONE_TIME" &&
        task.completedAt &&
        new Date(task.completedAt) < todayStart,
    );

    return { completedToday, completedOneTime };
  } catch {
    return { completedToday: [], completedOneTime: [] };
  }
}

export default async function DonePage() {
  const { completedToday, completedOneTime } = await getDoneTasks();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Done Tasks
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Finished tasks</h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Review what you completed and restore items if you want to tackle them again.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Completed today</h2>
          <DoneTaskList tasks={completedToday} emptyLabel="No tasks completed today." />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Completed one-time tasks</h2>
          <DoneTaskList
            tasks={completedOneTime}
            emptyLabel="No one-time tasks have been completed yet."
          />
        </section>
      </div>
    </main>
  );
}
