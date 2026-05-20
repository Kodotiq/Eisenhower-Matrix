"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTask, deleteTask, updateTaskQuadrant } from "@/app/actions";
import { Quadrant } from "@/components/Quadrant";
import type { PriorityLevel, Quadrant as QuadrantDefinition, Task } from "@/types/task";

type OptimisticAction =
  | {
      type: "move";
      taskId: string;
      urgency: PriorityLevel;
      importance: PriorityLevel;
    }
  | {
      type: "delete";
      taskId: string;
    };

const quadrants: QuadrantDefinition[] = [
  {
    title: "Do First",
    description: "High urgency · High importance",
    urgency: "High",
    importance: "High",
    tintClassName: "bg-red-50",
  },
  {
    title: "Schedule",
    description: "Low urgency · High importance",
    urgency: "Low",
    importance: "High",
    tintClassName: "bg-blue-50",
  },
  {
    title: "Delegate",
    description: "High urgency · Low importance",
    urgency: "High",
    importance: "Low",
    tintClassName: "bg-yellow-50",
  },
  {
    title: "Eliminate",
    description: "Low urgency · Low importance",
    urgency: "Low",
    importance: "Low",
    tintClassName: "bg-slate-100",
  },
];

function updateOptimisticTasks(tasks: Task[], action: OptimisticAction) {
  switch (action.type) {
    case "move":
      return tasks.map((task) =>
        task.id === action.taskId
          ? { ...task, urgency: action.urgency, importance: action.importance }
          : task,
      );
    case "delete":
      return tasks.filter((task) => task.id !== action.taskId);
    default:
      return tasks;
  }
}

interface MatrixGridProps {
  tasks: Task[];
}

export function MatrixGrid({ tasks }: MatrixGridProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticTasks, applyOptimisticUpdate] = useOptimistic(tasks, updateOptimisticTasks);

  const handleDrop = (taskId: string, quadrant: { urgency: PriorityLevel; importance: PriorityLevel }) => {
    const currentTask = optimisticTasks.find((task) => task.id === taskId);

    if (
      !currentTask ||
      (currentTask.urgency === quadrant.urgency && currentTask.importance === quadrant.importance)
    ) {
      return;
    }

    startTransition(async () => {
      applyOptimisticUpdate({
        type: "move",
        taskId,
        urgency: quadrant.urgency,
        importance: quadrant.importance,
      });

      try {
        await updateTaskQuadrant(taskId, quadrant);
      } finally {
        router.refresh();
      }
    });
  };

  const handleDelete = (taskId: string) => {
    startTransition(async () => {
      applyOptimisticUpdate({ type: "delete", taskId });

      try {
        await deleteTask(taskId);
      } finally {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8">
      <form
        ref={formRef}
        action={async (formData) => {
          startTransition(async () => {
            try {
              await addTask(formData);
              formRef.current?.reset();
            } finally {
              router.refresh();
            }
          });
        }}
        className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_160px_160px_auto]"
      >
        <input
          type="text"
          name="title"
          required
          placeholder="Add a task title"
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
        />
        <select
          name="urgency"
          defaultValue="High"
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
        >
          <option value="High">High Urgency</option>
          <option value="Low">Low Urgency</option>
        </select>
        <select
          name="importance"
          defaultValue="High"
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
        >
          <option value="High">High Importance</option>
          <option value="Low">Low Importance</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? "Saving..." : "Add Task"}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {quadrants.map((quadrant) => (
          <Quadrant
            key={`${quadrant.urgency}-${quadrant.importance}`}
            title={quadrant.title}
            description={quadrant.description}
            tintClassName={quadrant.tintClassName}
            tasks={optimisticTasks.filter(
              (task) =>
                task.urgency === quadrant.urgency && task.importance === quadrant.importance,
            )}
            urgency={quadrant.urgency}
            importance={quadrant.importance}
            onDelete={handleDelete}
            onDropTask={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
