import { apiClient } from "@/lib/api-client";

export const filesApi = {
  healthCheck: async () => {
    const response = await apiClient.get<{ status: string; service: string }>(
      "/file/health"
    );
    return response.data;
  },
};
