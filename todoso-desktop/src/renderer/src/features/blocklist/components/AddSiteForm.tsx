import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DomainInputSchema } from "../types/blockedSite";
import { useAddSite } from "../hooks/useAddSite";
import { useBlockedSites } from "../hooks/useBlockedSites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";

export function AddSiteForm() {
  const { data: sites } = useBlockedSites();
  const { mutate: addSite, isPending } = useAddSite();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(DomainInputSchema),
    defaultValues: {
      domain: "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    setSubmitError(null);
    
    // Client-side duplication check
    const alreadyExists = sites?.some((s) => s.domain === data.domain);
    if (alreadyExists) {
      setSubmitError("Ese dominio ya está en tu lista.");
      return;
    }

    addSite(data.domain, {
      onSuccess: () => {
        form.reset();
      },
      onError: (err: any) => {
        // Here we could check if it's a 409 from the backend too
        if (err.response?.status === 409) {
          setSubmitError("Ese dominio ya está en tu lista.");
        } else {
          setSubmitError("No pudimos agregar el dominio. Revisa tu conexión.");
        }
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1 mb-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="ej. facebook.com, youtube.com"
            {...form.register("domain")}
            className={form.formState.errors.domain || submitError ? "border-destructive" : ""}
            disabled={isPending}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>
      
      {form.formState.errors.domain && (
        <p className="text-xs text-destructive ml-1">{form.formState.errors.domain.message as string}</p>
      )}
      {submitError && !form.formState.errors.domain && (
        <p className="text-xs text-destructive ml-1">{submitError}</p>
      )}
    </form>
  );
}
