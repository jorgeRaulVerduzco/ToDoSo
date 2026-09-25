import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blocklistApi } from "../api/blocklistApi";
import { BlockedSite } from "../types/blockedSite";

export function useDeleteSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => blocklistApi.deleteSite(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["blockedSites"] });
      const previousSites = queryClient.getQueryData<BlockedSite[]>(["blockedSites"]);

      queryClient.setQueryData<BlockedSite[]>(["blockedSites"], (old) => {
        if (!old) return old;
        return old.filter(site => site.id !== id);
      });

      return { previousSites };
    },
    
    onError: (err, id, context) => {
      console.error("[useDeleteSite] Error:", err);
      if (context?.previousSites) {
        queryClient.setQueryData(["blockedSites"], context.previousSites);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedSites"] });
    },
  });
}
