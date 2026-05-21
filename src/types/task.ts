export type PriorityLevel = "High" | "Low";
export type TaskFrequency = "ONE_TIME" | "DAILY";
export type TaskCategory = "GENERAL" | "PRAYER";

export interface Task {
  id: string;
  title: string;
  urgency: PriorityLevel;
  importance: PriorityLevel;
  frequency: TaskFrequency;
  category: TaskCategory;
  reminderTime: string | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
}

export interface Quadrant {
  title: string;
  description: string;
  urgency: PriorityLevel;
  importance: PriorityLevel;
  tintClassName: string;
}
