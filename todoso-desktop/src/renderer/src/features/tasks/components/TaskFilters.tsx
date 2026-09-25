import { TaskStatusFilter } from "../types/task";
import { Button } from "@/components/ui/button";

interface TaskFiltersProps {
  status: TaskStatusFilter;
  setStatus: (status: TaskStatusFilter) => void;
  overdue: boolean;
  setOverdue: (overdue: boolean) => void;
}

export function TaskFilters({ status, setStatus, overdue, setOverdue }: TaskFiltersProps) {
  return (
    <div className="flex gap-2 mb-6">
      <Button 
        variant={status === "all" ? "default" : "secondary"} 
        size="sm" 
        onClick={() => setStatus("all")}
      >
        Todas
      </Button>
      <Button 
        variant={status === "pending" ? "default" : "secondary"} 
        size="sm" 
        onClick={() => setStatus("pending")}
      >
        Pendientes
      </Button>
      <Button 
        variant={status === "completed" ? "default" : "secondary"} 
        size="sm" 
        onClick={() => setStatus("completed")}
      >
        Completadas
      </Button>
      <div className="w-px bg-border mx-2" />
      <Button 
        variant={overdue ? "destructive" : "outline"} 
        size="sm" 
        onClick={() => setOverdue(!overdue)}
      >
        Vencidas
      </Button>
    </div>
  );
}
