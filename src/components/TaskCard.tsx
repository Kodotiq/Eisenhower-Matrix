"use client";

import type { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
}

export function TaskCard({ task, onDelete, onComplete }: TaskCardProps) {
  const badges = [
    task.frequency === "DAILY" ? "Daily" : "One-time",
    task.category === "PRAYER" ? "Prayer" : null,
    task.reminderTime ? `Reminder ${task.reminderTime}` : null,
  ].filter(Boolean) as string[];

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/task-id", task.id);
      }}
      className="cursor-grab rounded-xl border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">{task.title}</p>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              {badges.map((badge) => (
                <span key={badge}>{badge}</span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {onComplete ? (
            <button
              type="button"
              onClick={() => onComplete(task.id)}
              className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              aria-label={`Mark ${task.title} done`}
            >
              Done
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={`Delete ${task.title}`}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
