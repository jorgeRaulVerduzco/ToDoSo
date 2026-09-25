import { z } from "zod";

export const TaskSchema = z.object({
  id: z.number(),
  owner_id: z.number(),
  title: z.string().min(1, "El título es obligatorio").max(200),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["pending", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.string().nullable().optional(), // ISO datetime string
  created_at: z.string(), // ISO datetime string
});

export type Task = z.infer<typeof TaskSchema>;

export type TaskStatusFilter = "all" | "pending" | "completed";
export type TaskSortBy = "priority" | "dueDate";

export interface TaskFilters {
  status: TaskStatusFilter;
  overdue: boolean;
  sortBy: TaskSortBy;
  search: string;
}
