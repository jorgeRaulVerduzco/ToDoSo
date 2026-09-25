import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blocklistApi } from "../api/blocklistApi";

export function useAddSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (domain: string) => blocklistApi.addSite(domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedSites"] });
    },
    onError: (error: any) => {
      console.error("[useAddSite]", error);
      // Let the component handle showing "Ese dominio ya está en tu lista" if status is 409
    },
  });
}
