"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { authApi } from "@/app/api/auth";
import { SessionItem } from "./SessionItem";
import { Skeleton } from "@/components/ui/skeleton";

export function SessionList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sessions"],
    queryFn: authApi.getSessions,
  });

  const revokeMutation = useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => {
      toast.success(t("auth.sessions.revokeSuccess"));
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as Error)?.message ||
        t("auth.sessions.revokeError");
      toast.error(errorMessage);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500">{t("errors.default")}</div>;
  }

  const sessions = data?.data?.sessions || [];

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <SessionItem
          key={session.sessionId}
          session={session}
          onRevoke={(id) => revokeMutation.mutate(id)}
          isRevoking={
            revokeMutation.isPending &&
            revokeMutation.variables === session.sessionId
          }
        />
      ))}
    </div>
  );
}
