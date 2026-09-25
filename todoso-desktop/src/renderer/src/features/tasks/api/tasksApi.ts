import { api } from "@/services/api";
import { Task } from "../types/task";

export const tasksApi = {
  getTasks: async (status?: string, priority?: string): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (priority) params.append("priority", priority);
    
    const response = await api.get<Task[]>("/tasks/", { params });
    return response.data;
  },

  createTask: async (task: Partial<Task>): Promise<Task> => {
    const response = await api.post<Task>("/tasks/", task);
    return response.data;
  },

  updateTask: async (id: number, data: Partial<Task>): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${id}/`, data);
    return response.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}/`);
  },
};
