import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../api/tasksApi";
import { Task } from "../types/task";

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tasksApi.deleteTask(id),
    
    // Optimistic Update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      
      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      
      queryClient.setQueriesData({ queryKey: ["tasks"] }, (old: Task[] | undefined) => {
        if (!old) return old;
        return old.filter(task => task.id !== id);
      });

      return { previousQueries };
    },
    
    onError: (err, id, context) => {
      console.error("[useDeleteTask] Error deleting task:", err);
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
