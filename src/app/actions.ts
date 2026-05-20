"use server";

import { revalidatePath } from "next/cache";
import { getPrismaClient } from "@/lib/prisma";
import type { PriorityLevel } from "@/types/task";

const priorityLevels = new Set<PriorityLevel>(["High", "Low"]);

function parsePriorityLevel(value: FormDataEntryValue | string | null): PriorityLevel {
  if (typeof value !== "string" || !priorityLevels.has(value as PriorityLevel)) {
    throw new Error("Urgency and importance must be either High or Low.");
  }

  return value as PriorityLevel;
}

export async function addTask(formData: FormData) {
  const prisma = getPrismaClient();
  const title = formData.get("title");
  const urgency = formData.get("urgency");
  const importance = formData.get("importance");

  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Task title is required.");
  }

  await prisma.task.create({
    data: {
      title: title.trim(),
      urgency: parsePriorityLevel(urgency),
      importance: parsePriorityLevel(importance),
    },
  });

  revalidatePath("/");
}

export async function updateTaskQuadrant(
  taskId: string,
  quadrant: {
    urgency: PriorityLevel;
    importance: PriorityLevel;
  },
) {
  if (!taskId) {
    throw new Error("Task id is required.");
  }

  const prisma = getPrismaClient();

  await prisma.task.update({
    where: { id: taskId },
    data: {
      urgency: parsePriorityLevel(quadrant.urgency),
      importance: parsePriorityLevel(quadrant.importance),
    },
  });

  revalidatePath("/");
}

export async function deleteTask(taskId: string) {
  if (!taskId) {
    throw new Error("Task id is required.");
  }

  const prisma = getPrismaClient();

  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidatePath("/");
}
