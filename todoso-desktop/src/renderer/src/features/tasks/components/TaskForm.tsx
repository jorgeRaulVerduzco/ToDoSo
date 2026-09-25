import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Task, TaskSchema } from "../types/task";
import { useCreateTask } from "../hooks/useCreateTask";
import { useUpdateTask } from "../hooks/useUpdateTask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

interface TaskFormProps {
  task?: Task; // If provided, it's edit mode
  onClose: () => void;
}

const formSchema = TaskSchema.omit({ id: true, created_at: true, status: true });

export function TaskForm({ task, onClose }: TaskFormProps) {
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();

  const isPending = isCreating || isUpdating;
  const isEditMode = !!task;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "medium",
      due_date: task?.due_date || "",
    },
  });

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const onSubmit = form.handleSubmit((data) => {
    const payload = {
      ...data,
      due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
    };

    if (isEditMode) {
      updateTask(
        { id: task.id, data: payload },
        { onSuccess: () => onClose() }
      );
    } else {
      createTask(
        payload,
        { onSuccess: () => onClose() }
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
      <div>
        <Input
          placeholder="¿Qué necesitas hacer? (Presiona Enter para guardar)"
          autoFocus
          {...form.register("title")}
          className={form.formState.errors.title ? "border-destructive" : ""}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message as string}</p>
        )}
      </div>

      <Textarea
        placeholder="Descripción (opcional)"
        {...form.register("description")}
        className="min-h-[80px]"
      />

      <div className="flex gap-4">
        <div className="flex-1">
          <Select 
            value={form.watch("priority")} 
            onValueChange={(val) => form.setValue("priority", val as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Input
            type="date"
            {...form.register("due_date")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isEditMode ? "Guardar cambios" : "Crear tarea"}
        </Button>
      </div>
    </form>
  );
}
