import { Task } from "../types/task";
import { useUpdateTask } from "../hooks/useUpdateTask";
import { useDeleteTask } from "../hooks/useDeleteTask";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskItem({ task, onEdit }: TaskItemProps) {
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();

  const isCompleted = task.status === "completed";

  const handleToggle = () => {
    updateTask({
      id: task.id,
      data: { status: isCompleted ? "pending" : "completed" },
    });
  };

  const handleDelete = () => {
    // TODO(ui): Replace window.confirm with shadcn AlertDialog when available
    if (window.confirm("¿Estás seguro de eliminar esta tarea?")) {
      deleteTask(task.id);
    }
  };

  const priorityColor = {
    high: "destructive",
    medium: "secondary",
    low: "outline",
  } as const;

  const priorityLabel = {
    high: "Alta",
    medium: "Media",
    low: "Baja",
  } as const;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex items-start gap-4 p-4 border rounded-lg bg-card transition-colors hover:border-primary/50",
        isCompleted && "opacity-60 bg-muted/50"
      )}
    >
      <div className="pt-1">
        <Checkbox 
          checked={isCompleted} 
          onCheckedChange={handleToggle}
          className={cn(isCompleted && "animate-check-pop")}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span 
            className={cn(
              "font-medium truncate transition-all duration-300",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>
          <Badge variant={priorityColor[task.priority]} className="text-[10px] px-1.5 py-0">
            {priorityLabel[task.priority]}
          </Badge>
          {task.due_date && (
            <span className={cn("text-xs", isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
