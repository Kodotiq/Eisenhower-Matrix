import { MatrixGrid } from "@/components/MatrixGrid";
import { getPrismaClient } from "@/lib/prisma";
import type { PriorityLevel, Task } from "@/types/task";

export const dynamic = "force-dynamic";

const priorityLevels = new Set<PriorityLevel>(["High", "Low"]);

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

    return tasks.flatMap((task) =>
      priorityLevels.has(task.urgency as PriorityLevel) &&
      priorityLevels.has(task.importance as PriorityLevel)
        ? [
            {
              ...task,
              urgency: task.urgency as PriorityLevel,
              importance: task.importance as PriorityLevel,
            },
          ]
        : [],
    );
  } catch {
    return [];
  }
}

export default async function Home() {
  const tasks = await getTasks();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Eisenhower Matrix
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Prioritize what needs your attention.
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Add tasks, organize them by urgency and importance, then drag cards between
            quadrants for instant updates.
          </p>
        </div>

        <MatrixGrid tasks={tasks} />
      </div>
    </main>
  );
}
