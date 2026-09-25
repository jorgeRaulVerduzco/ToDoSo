import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blocklistApi } from "../api/blocklistApi";
import { BlockedSite } from "../types/blockedSite";

export function useToggleSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => 
      blocklistApi.toggleSite(id, is_active),
    
    onMutate: async ({ id, is_active }) => {
      await queryClient.cancelQueries({ queryKey: ["blockedSites"] });
      const previousSites = queryClient.getQueryData<BlockedSite[]>(["blockedSites"]);

      queryClient.setQueryData<BlockedSite[]>(["blockedSites"], (old) => {
        if (!old) return old;
        return old.map(site => site.id === id ? { ...site, is_active } : site);
      });

      return { previousSites };
    },
    
    onError: (err, variables, context) => {
      console.error("[useToggleSite] Error:", err);
      if (context?.previousSites) {
        queryClient.setQueryData(["blockedSites"], context.previousSites);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedSites"] });
    },
  });
}
