"use client";

import { useState } from "react";
import { TaskCard } from "@/components/TaskCard";
import type { PriorityLevel, Task } from "@/types/task";

interface QuadrantProps {
  title: string;
  description: string;
  tintClassName: string;
  tasks: Task[];
  urgency: PriorityLevel;
  importance: PriorityLevel;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onDropTask: (taskId: string, quadrant: { urgency: PriorityLevel; importance: PriorityLevel }) => void;
}

export function Quadrant({
  title,
  description,
  tintClassName,
  tasks,
  urgency,
  importance,
  onDelete,
  onComplete,
  onDropTask,
}: QuadrantProps) {
  const [isOver, setIsOver] = useState(false);

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);

        const taskId = event.dataTransfer.getData("text/task-id");

        if (!taskId) {
          return;
        }

        onDropTask(taskId, { urgency, importance });
      }}
      className={`flex min-h-72 flex-col rounded-2xl border border-black/10 p-5 transition ${tintClassName} ${isOver ? "ring-2 ring-slate-400" : ""}`}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-black/15 bg-white/50 px-4 text-center text-sm text-slate-500">
            Drop a task here.
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} onComplete={onComplete} />
          ))
        )}
      </div>
    </section>
  );
}
