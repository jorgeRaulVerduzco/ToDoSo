import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blocklistApi } from "../api/blocklistApi";
import { PRESETS, PresetKey } from "../data/presets";
import { BlockedSite } from "../types/blockedSite";

export function useAddPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (presetKey: PresetKey) => {
      const preset = PRESETS[presetKey];
      
      // Get current list from cache
      const currentSites = queryClient.getQueryData<BlockedSite[]>(["blockedSites"]) || [];
      const currentDomains = new Set(currentSites.map(s => s.domain));

      // Filter domains that are not already in the list
      const domainsToAdd = preset.domains.filter(domain => !currentDomains.has(domain));

      if (domainsToAdd.length === 0) {
        return { added: 0, total: preset.domains.length, alreadyExisted: preset.domains.length };
      }

      // Add missing domains using Promise.allSettled so if one fails, others succeed
      const results = await Promise.allSettled(
        domainsToAdd.map(domain => blocklistApi.addSite(domain))
      );

      const addedCount = results.filter(r => r.status === "fulfilled").length;
      
      return {
        added: addedCount,
        total: preset.domains.length,
        alreadyExisted: preset.domains.length - domainsToAdd.length
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedSites"] });
    },
    onError: (error) => {
      console.error("[useAddPreset] Error:", error);
    }
  });
}
