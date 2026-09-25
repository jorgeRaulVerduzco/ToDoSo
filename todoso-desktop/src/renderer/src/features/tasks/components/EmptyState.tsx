import { TaskStatusFilter } from "../types/task";
import { CheckCircle2, Clock, Inbox } from "lucide-react";

interface EmptyStateProps {
  status: TaskStatusFilter;
  overdue: boolean;
  search: string;
}

export function EmptyState({ status, overdue, search }: EmptyStateProps) {
  let Icon = Inbox;
  let title = "No hay tareas";
  let description = "¿Por qué no agregas una nueva para empezar?";

  if (search) {
    title = "No se encontraron resultados";
    description = `No hay tareas que coincidan con "${search}".`;
  } else if (overdue) {
    Icon = Clock;
    title = "¡Excelente!";
    description = "No tienes tareas vencidas.";
  } else if (status === "completed") {
    Icon = CheckCircle2;
    title = "Aún no hay tareas completadas";
    description = "Las tareas que termines aparecerán aquí.";
  } else if (status === "pending") {
    title = "Al día";
    description = "No tienes tareas pendientes ahora mismo.";
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card/50">
      <Icon className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
