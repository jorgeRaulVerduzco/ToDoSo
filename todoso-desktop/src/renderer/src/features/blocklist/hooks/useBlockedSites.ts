import { useQuery } from "@tanstack/react-query";
import { blocklistApi } from "../api/blocklistApi";

export function useBlockedSites() {
  return useQuery({
    queryKey: ["blockedSites"],
    queryFn: () => blocklistApi.getBlockedSites(false),
  });
}
