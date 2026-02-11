"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/app/api/auth";
import { clearTokens } from "@/lib/auth";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearTokens();
      queryClient.clear();
      router.push("/auth/login");
    },
    onError: (error: unknown) => {
      console.error("Logout failed:", error);
      // Even if API fails, we probably want to clear local state
      clearTokens();
      queryClient.clear();
      router.push("/auth/login");
    },
  });

  const logout = async () => {
    logoutMutation.mutate();
  };

  return {
    logout,
    isLoading: logoutMutation.isPending,
  };
}
