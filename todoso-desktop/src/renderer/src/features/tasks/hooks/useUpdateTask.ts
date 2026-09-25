import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../api/tasksApi";
import { Task } from "../types/task";

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) => 
      tasksApi.updateTask(id, data),
    
    // Optimistic Update
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value across all task queries
      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      
      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ["tasks"] }, (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map(task => task.id === id ? { ...task, ...data } : task);
      });

      // Return a context object with the snapshotted value
      return { previousQueries };
    },
    
    onError: (err, variables, context) => {
      console.error("[useUpdateTask] Error updating task:", err);
      // Rollback to the previous value
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
      // UI layer should show human-readable error like "No pudimos actualizar la tarea, revisa tu conexión"
    },
    
    onSettled: () => {
      // Always refetch after error or success to reconcile
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
