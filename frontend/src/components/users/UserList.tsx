"use client";

import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/app/api/users";
import { UserCard } from "./UserCard";
import { UserSearchInput } from "./UserSearchInput";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@/hooks/use-debounce";
import { OnlineUserDto } from "@/types/api";

interface UserListProps {
  onUserSelect?: (user: OnlineUserDto) => void;
}

export function UserList({ onUserSelect }: UserListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", "search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) {
        const response = await usersApi.getOnlineUsers(20, 0);
        return { users: response.users };
      }
      const response = await usersApi.searchUsers(debouncedSearch, 20, 0);
      return { users: response.users };
    },
    enabled: true,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("users.search_users", "Search Users")}
        </h2>
        <UserSearchInput value={search} onChange={setSearch} />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : isError ? (
        <div className="p-4 text-center text-red-500">
          {t("users.error", "Failed to load users")}
        </div>
      ) : !data?.users.length ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          {t("users.no_users_found", "No users found")}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.users.map((user) => (
            <UserCard
              key={user.userId}
              user={user}
              onUserSelect={onUserSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
