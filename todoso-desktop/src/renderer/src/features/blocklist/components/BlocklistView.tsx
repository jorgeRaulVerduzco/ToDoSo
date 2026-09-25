import { useBlockedSites } from "../hooks/useBlockedSites";
import { AddSiteForm } from "./AddSiteForm";
import { PresetButtons } from "./PresetButtons";
import { SiteItem } from "./SiteItem";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export function BlocklistView() {
  const { data: sites, isLoading, isError } = useBlockedSites();

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Lista de Bloqueo</h1>
        <p className="text-muted-foreground mt-1">
          Sitios que se bloquearán a nivel de sistema operativo durante tus sesiones de enfoque.
        </p>
      </div>

      <PresetButtons />
      <AddSiteForm />

      <div className="flex-1 overflow-y-auto pb-8">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Dominios en tu lista</h3>
        
        {isError && (
          <div className="p-4 text-sm text-destructive border border-destructive/20 rounded-md bg-destructive/10">
            No pudimos cargar tu lista de bloqueo. Revisa tu conexión.
          </div>
        )}

        {isLoading && !sites && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {!isLoading && !isError && sites?.length === 0 && (
          <EmptyState />
        )}

        {!isLoading && sites && sites.length > 0 && (
          <div className="flex flex-col gap-2">
            {sites.map(site => (
              <SiteItem key={site.id} site={site} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
