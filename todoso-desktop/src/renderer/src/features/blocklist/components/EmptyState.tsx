import { Ban } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card/50">
      <Ban className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">Tu lista está vacía</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        Agrega dominios manualmente o usa los atajos rápidos de arriba para bloquear los sitios web que más te distraen.
      </p>
    </div>
  );
}
