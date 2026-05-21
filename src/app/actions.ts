"use server";

import { revalidatePath } from "next/cache";
import { getPrismaClient } from "@/lib/prisma";
import type { PriorityLevel, TaskCategory, TaskFrequency } from "@/types/task";

const priorityLevels = new Set<PriorityLevel>(["High", "Low"]);
const frequencyLevels = new Set<TaskFrequency>(["ONE_TIME", "DAILY"]);
const categoryLevels = new Set<TaskCategory>(["GENERAL", "PRAYER"]);

function parsePriorityLevel(value: FormDataEntryValue | string | null): PriorityLevel {
  if (typeof value !== "string" || !priorityLevels.has(value as PriorityLevel)) {
    throw new Error("Urgency and importance must be either High or Low.");
  }

  return value as PriorityLevel;
}

function parseFrequency(value: FormDataEntryValue | string | null): TaskFrequency {
  if (typeof value !== "string" || !frequencyLevels.has(value as TaskFrequency)) {
    throw new Error("Task frequency must be ONE_TIME or DAILY.");
  }

  return value as TaskFrequency;
}

function parseCategory(value: FormDataEntryValue | string | null): TaskCategory {
  if (typeof value !== "string" || !categoryLevels.has(value as TaskCategory)) {
    throw new Error("Task category must be GENERAL or PRAYER.");
  }

  return value as TaskCategory;
}

function parseReminderTime(value: FormDataEntryValue | string | null): string | null {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error("Reminder time must be in HH:MM format.");
  }

  return value;
}

function getDefaultReminderTime(urgency: PriorityLevel, importance: PriorityLevel): string | null {
  if (urgency === "High" && importance === "High") {
    return "09:00";
  }

  if (urgency === "Low" && importance === "High") {
    return "15:00";
  }

  return null;
}

function revalidateTaskPaths() {
  revalidatePath("/");
  revalidatePath("/done");
  revalidatePath("/history");
}

export async function addTask(formData: FormData) {
  const prisma = getPrismaClient();
  const title = formData.get("title");
  const urgency = formData.get("urgency");
  const importance = formData.get("importance");
  const frequency = formData.get("frequency");
  const category = formData.get("category");
  const reminderTime = formData.get("reminderTime");

  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Task title is required.");
  }

  const urgencyValue = parsePriorityLevel(urgency);
  const importanceValue = parsePriorityLevel(importance);
  const categoryValue = parseCategory(category ?? "GENERAL");
  const frequencyValue = categoryValue === "PRAYER" ? "DAILY" : parseFrequency(frequency ?? "ONE_TIME");
  const reminderValue =
    categoryValue === "PRAYER"
      ? null
      : parseReminderTime(reminderTime) ?? getDefaultReminderTime(urgencyValue, importanceValue);

  await prisma.task.create({
    data: {
      title: title.trim(),
      urgency: urgencyValue,
      importance: importanceValue,
      frequency: frequencyValue,
      category: categoryValue,
      reminderTime: reminderValue,
    },
  });

  revalidateTaskPaths();
}

export async function updateTaskQuadrant(
  taskId: string,
  quadrant: {
    urgency: PriorityLevel;
    importance: PriorityLevel;
  },
) {
  if (!taskId) {
    throw new Error("Task ID is required.");
  }

  const prisma = getPrismaClient();
  const urgencyValue = parsePriorityLevel(quadrant.urgency);
  const importanceValue = parsePriorityLevel(quadrant.importance);
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    select: { reminderTime: true, category: true },
  });

  const defaultReminderTime =
    existingTask?.category === "GENERAL"
      ? getDefaultReminderTime(urgencyValue, importanceValue)
      : null;
  const reminderTime =
    existingTask?.reminderTime ?? (defaultReminderTime ? defaultReminderTime : null);

  await prisma.task.update({
    where: { id: taskId },
    data: {
      urgency: urgencyValue,
      importance: importanceValue,
      reminderTime,
    },
  });

  revalidateTaskPaths();
}

export async function markTaskDone(taskId: string) {
  if (!taskId) {
    throw new Error("Task ID is required.");
  }

  const prisma = getPrismaClient();

  await prisma.task.update({
    where: { id: taskId },
    data: { completedAt: new Date() },
  });

  revalidateTaskPaths();
}

export async function restoreTask(taskId: string) {
  if (!taskId) {
    throw new Error("Task ID is required.");
  }

  const prisma = getPrismaClient();

  await prisma.task.update({
    where: { id: taskId },
    data: { completedAt: null },
  });

  revalidateTaskPaths();
}

export async function deleteTask(taskId: string) {
  if (!taskId) {
    throw new Error("Task ID is required.");
  }

  const prisma = getPrismaClient();

  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidateTaskPaths();
}
