import { api } from "@/services/api";
import { BlockedSite } from "../types/blockedSite";

export const blocklistApi = {
  getBlockedSites: async (activeOnly = false): Promise<BlockedSite[]> => {
    const response = await api.get<BlockedSite[]>("/blocked-sites/", {
      params: { active_only: activeOnly },
    });
    return response.data;
  },

  addSite: async (domain: string): Promise<BlockedSite> => {
    const response = await api.post<BlockedSite>("/blocked-sites/", { domain });
    return response.data;
  },

  toggleSite: async (id: number, is_active: boolean): Promise<BlockedSite> => {
    const response = await api.patch<BlockedSite>(`/blocked-sites/${id}/`, { is_active });
    return response.data;
  },

  deleteSite: async (id: number): Promise<void> => {
    await api.delete(`/blocked-sites/${id}/`);
  },
};
