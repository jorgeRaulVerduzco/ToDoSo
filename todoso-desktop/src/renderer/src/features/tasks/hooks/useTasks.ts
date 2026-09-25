import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "../api/tasksApi";
import { TaskFilters, Task } from "../types/task";

export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: ["tasks", filters.status],
    queryFn: () => tasksApi.getTasks(filters.status),
    select: (data) => {
      // Client-side filtering and sorting
      let result = data;
      
      // Search
      if (filters.search) {
        const lowerSearch = filters.search.toLowerCase();
        result = result.filter(
          (t) =>
            t.title.toLowerCase().includes(lowerSearch) ||
            t.description?.toLowerCase().includes(lowerSearch)
        );
      }
      
      // Overdue
      if (filters.overdue) {
        const now = new Date();
        result = result.filter((t) => t.due_date && new Date(t.due_date) < now && t.status === "pending");
      }
      
      // Sort
      result = [...result].sort((a, b) => {
        if (filters.sortBy === "priority") {
          const pOrder = { high: 3, medium: 2, low: 1 };
          return pOrder[b.priority] - pOrder[a.priority];
        } else {
          // dueDate sorting
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
      });
      
      return result;
    },
  });
}
