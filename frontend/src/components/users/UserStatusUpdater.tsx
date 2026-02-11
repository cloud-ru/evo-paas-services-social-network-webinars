"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usersApi } from "@/app/api/users";
import { UserStatus } from "@/types/api";

export function UserStatusUpdater() {
  const { data: user } = useQuery({
    queryKey: ["users", "me"],
    queryFn: usersApi.getMe,
    retry: false,
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: (status: UserStatus) => {
      if (!user) {
        return Promise.resolve(null);
      }
      return usersApi.updateStatus(user.data.userId, { status });
    },
  });

  useEffect(() => {
    if (!user) return;

    updateStatus(UserStatus.Online);

    const intervalId = setInterval(() => {
      updateStatus(UserStatus.Online);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, updateStatus]);

  return null;
}
