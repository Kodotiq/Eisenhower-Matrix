"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTask, deleteTask, markTaskDone, updateTaskQuadrant } from "@/app/actions";
import { Quadrant } from "@/components/Quadrant";
import { TaskReminders } from "@/components/TaskReminders";
import type {
  PriorityLevel,
  Quadrant as QuadrantDefinition,
  Task,
  TaskCategory,
  TaskFrequency,
} from "@/types/task";

type OptimisticAction =
  | {
      type: "move";
      taskId: string;
      urgency: PriorityLevel;
      importance: PriorityLevel;
    }
  | {
      type: "complete";
      taskId: string;
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
    case "complete":
      return tasks.filter((task) => task.id !== action.taskId);
    case "delete":
      return tasks.filter((task) => task.id !== action.taskId);
    default:
      return tasks;
  }
}

function getDefaultReminderTime(urgency: PriorityLevel, importance: PriorityLevel) {
  if (urgency === "High" && importance === "High") {
    return "09:00";
  }

  if (urgency === "Low" && importance === "High") {
    return "15:00";
  }

  return "";
}

interface MatrixGridProps {
  tasks: Task[];
}

export function MatrixGrid({ tasks }: MatrixGridProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticTasks, applyOptimisticUpdate] = useOptimistic(tasks, updateOptimisticTasks);
  const [urgencyValue, setUrgencyValue] = useState<PriorityLevel>("High");
  const [importanceValue, setImportanceValue] = useState<PriorityLevel>("High");
  const [frequencyValue, setFrequencyValue] = useState<TaskFrequency>("ONE_TIME");
  const [categoryValue, setCategoryValue] = useState<TaskCategory>("GENERAL");
  const [reminderTouched, setReminderTouched] = useState(false);
  const [reminderTime, setReminderTime] = useState(
    getDefaultReminderTime("High", "High"),
  );

  useEffect(() => {
    if (categoryValue === "PRAYER") {
      setFrequencyValue("DAILY");
      setReminderTime("");
      setReminderTouched(false);
      return;
    }

    if (!reminderTouched) {
      setReminderTime(getDefaultReminderTime(urgencyValue, importanceValue));
    }
  }, [categoryValue, urgencyValue, importanceValue, reminderTouched]);

  const resetFormState = () => {
    setUrgencyValue("High");
    setImportanceValue("High");
    setFrequencyValue("ONE_TIME");
    setCategoryValue("GENERAL");
    setReminderTouched(false);
    setReminderTime(getDefaultReminderTime("High", "High"));
  };

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

  const handleComplete = (taskId: string) => {
    startTransition(async () => {
      applyOptimisticUpdate({ type: "complete", taskId });

      try {
        await markTaskDone(taskId);
      } finally {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8">
      <TaskReminders tasks={optimisticTasks} />
      <form
        ref={formRef}
        action={async (formData) => {
          startTransition(async () => {
            try {
              await addTask(formData);
              formRef.current?.reset();
              resetFormState();
            } finally {
              router.refresh();
            }
          });
        }}
        className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_140px_140px_140px_140px_140px_auto]"
      >
        <input
          type="text"
          name="title"
          required
          placeholder="Add a task title"
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white md:col-span-2 lg:col-span-1"
        />
        <select
          name="urgency"
          value={urgencyValue}
          onChange={(event) => {
            setUrgencyValue(event.target.value as PriorityLevel);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
        >
          <option value="High">High Urgency</option>
          <option value="Low">Low Urgency</option>
        </select>
        <select
          name="importance"
          value={importanceValue}
          onChange={(event) => {
            setImportanceValue(event.target.value as PriorityLevel);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
        >
          <option value="High">High Importance</option>
          <option value="Low">Low Importance</option>
        </select>
        <select
          name="frequency"
          value={frequencyValue}
          onChange={(event) => {
            setFrequencyValue(event.target.value as TaskFrequency);
          }}
          disabled={categoryValue === "PRAYER"}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          <option value="ONE_TIME">One-time</option>
          <option value="DAILY">Daily</option>
        </select>
        <select
          name="category"
          value={categoryValue}
          onChange={(event) => {
            setCategoryValue(event.target.value as TaskCategory);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
        >
          <option value="GENERAL">General</option>
          <option value="PRAYER">Prayer</option>
        </select>
        <input
          type="time"
          name="reminderTime"
          value={reminderTime}
          onChange={(event) => {
            setReminderTouched(true);
            setReminderTime(event.target.value);
          }}
          disabled={categoryValue === "PRAYER"}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        />
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
            onComplete={handleComplete}
            onDropTask={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
