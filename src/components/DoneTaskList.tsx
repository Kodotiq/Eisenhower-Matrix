"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTask, restoreTask } from "@/app/actions";
import type { Task } from "@/types/task";

type OptimisticAction =
  | {
      type: "remove";
      taskId: string;
    }
  | {
      type: "restore";
      taskId: string;
    };

function updateOptimisticTasks(tasks: Task[], action: OptimisticAction) {
  switch (action.type) {
    case "remove":
    case "restore":
      return tasks.filter((task) => task.id !== action.taskId);
    default:
      return tasks;
  }
}

interface DoneTaskListProps {
  tasks: Task[];
  emptyLabel: string;
}

export function DoneTaskList({ tasks, emptyLabel }: DoneTaskListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticTasks, applyOptimisticUpdate] = useOptimistic(tasks, updateOptimisticTasks);

  if (optimisticTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 px-4 py-6 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {optimisticTasks.map((task) => {
        const completedAt = task.completedAt ? new Date(task.completedAt) : null;
        const completedLabel = completedAt
          ? completedAt.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        return (
          <article
            key={task.id}
            className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">
                  {task.frequency === "DAILY" ? "Daily" : "One-time"}
                  {task.category === "PRAYER" ? " | Prayer" : ""}
                  {completedLabel ? ` | Completed ${completedLabel}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      applyOptimisticUpdate({ type: "restore", taskId: task.id });

                      try {
                        await restoreTask(task.id);
                      } finally {
                        router.refresh();
                      }
                    });
                  }}
                  className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300"
                >
                  Restore
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      applyOptimisticUpdate({ type: "remove", taskId: task.id });

                      try {
                        await deleteTask(task.id);
                      } finally {
                        router.refresh();
                      }
                    });
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
