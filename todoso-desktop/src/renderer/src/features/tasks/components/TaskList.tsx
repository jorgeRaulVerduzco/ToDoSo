import { useState, useEffect } from "react";
import { useTasks } from "../hooks/useTasks";
import { TaskFilters, TaskStatusFilter, TaskSortBy } from "../types/task";
import { TaskItem } from "./TaskItem";
import { TaskForm } from "./TaskForm";
import { TaskFilters as TaskFiltersComponent } from "./TaskFilters";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Task } from "../types/task";

export function TaskList() {
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    overdue: false,
    sortBy: "priority",
    search: "",
  });

  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: tasks, isLoading, isError } = useTasks(filters);

  // Keyboard shortcut for New Task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.key === "n" || e.key === "N") {
        const activeEl = document.activeElement as HTMLElement;
        if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
          return;
        }
        e.preventDefault();
        setIsCreating(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Tareas</h1>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Tarea (N)
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar tareas..." 
            className="pl-9"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
      </div>

      <TaskFiltersComponent 
        status={filters.status}
        setStatus={(s) => setFilters(f => ({ ...f, status: s }))}
        overdue={filters.overdue}
        setOverdue={(o) => setFilters(f => ({ ...f, overdue: o }))}
      />

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pb-8">
        {isCreating && (
          <div className="mb-2">
            <TaskForm onClose={() => setIsCreating(false)} />
          </div>
        )}

        {editingTask && (
          <div className="mb-2">
            <TaskForm task={editingTask} onClose={() => setEditingTask(null)} />
          </div>
        )}

        {isError && (
          <div className="p-4 text-sm text-destructive border border-destructive/20 rounded-md bg-destructive/10">
            No pudimos cargar tus tareas. Por favor, revisa tu conexión e intenta de nuevo.
          </div>
        )}

        {isLoading && !tasks && (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        )}

        {!isLoading && !isError && tasks?.length === 0 && (
          <EmptyState 
            status={filters.status} 
            overdue={filters.overdue} 
            search={filters.search} 
          />
        )}

        {!isLoading && tasks?.map(task => (
          editingTask?.id !== task.id && (
            <TaskItem 
              key={task.id} 
              task={task} 
              onEdit={setEditingTask} 
            />
          )
        ))}
      </div>
    </div>
  );
}
