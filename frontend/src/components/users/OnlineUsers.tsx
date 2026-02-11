"use client";

import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/app/api/users";
import { UserAvatar } from "./UserAvatar";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";
import { OnlineUserDto } from "@/types/api";

interface OnlineUsersProps {
  onUserSelect?: (user: OnlineUserDto) => void;
}

export function OnlineUsers({ onUserSelect }: OnlineUsersProps) {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["users", "online"],
    queryFn: () => usersApi.getOnlineUsers(100, 0),
  });

  if (isLoading) {
    return (
      <div className="flex h-[120px] items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data?.users.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("users.online_users", "Online Users")}
      </h2>
      <ScrollArea className="w-full pb-4 whitespace-nowrap">
        <div className="flex space-x-4">
          {data.users.map((user) => (
            <Link
              key={user.userId}
              href={onUserSelect ? "#" : `/users/${user.userId}`}
              onClick={(e) => {
                if (onUserSelect) {
                  e.preventDefault();
                  onUserSelect(user);
                }
              }}
              className="flex w-[100px] flex-col items-center gap-2"
            >
              <div className="relative">
                <UserAvatar
                  user={user}
                  className="hover:ring-primary h-14 w-14 ring-2 ring-transparent transition-all"
                />
                <span className="ring-background absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-500 ring-2" />
              </div>
              <div className="flex w-full flex-col items-center gap-0.5">
                <span
                  className="w-full truncate text-center text-xs font-medium"
                  title={user.firstName}
                >
                  {user.firstName}
                </span>
                <span
                  className="w-full truncate text-center text-xs font-medium"
                  title={user.lastName}
                >
                  {user.lastName}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
