export type PriorityLevel = "High" | "Low";

export interface Task {
  id: string;
  title: string;
  urgency: PriorityLevel;
  importance: PriorityLevel;
  createdAt: Date;
}

export interface Quadrant {
  title: string;
  description: string;
  urgency: PriorityLevel;
  importance: PriorityLevel;
  tintClassName: string;
}
