import { BlockedSite } from "../types/blockedSite";
import { useToggleSite } from "../hooks/useToggleSite";
import { useDeleteSite } from "../hooks/useDeleteSite";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteItemProps {
  site: BlockedSite;
}

export function SiteItem({ site }: SiteItemProps) {
  const { mutate: toggleSite } = useToggleSite();
  const { mutate: deleteSite } = useDeleteSite();

  const handleToggle = () => {
    toggleSite({ id: site.id, is_active: !site.is_active });
  };

  const handleDelete = () => {
    // TODO(ui): Replace window.confirm with shadcn AlertDialog when available
    if (window.confirm(`¿Estás seguro de eliminar ${site.domain} de tu lista?`)) {
      deleteSite(site.id);
    }
  };

  return (
    <div 
      className={cn(
        "group flex items-center justify-between p-3 border rounded-md bg-card transition-all",
        !site.is_active && "opacity-60 bg-muted/30"
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        <Switch 
          checked={site.is_active} 
          onCheckedChange={handleToggle} 
        />
        <span 
          className={cn(
            "font-medium truncate transition-colors",
            !site.is_active && "text-muted-foreground line-through decoration-muted-foreground/30"
          )}
        >
          {site.domain}
        </span>
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all" 
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
