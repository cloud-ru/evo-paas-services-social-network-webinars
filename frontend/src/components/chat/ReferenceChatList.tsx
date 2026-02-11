"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { useQuery, useQueries } from "@tanstack/react-query";
import { messagesApi } from "@/app/api/messages";
import { usersApi } from "@/app/api/users";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/users/UserAvatar";
import { UserProfileDto } from "@/types/api";

import { StartChatModal } from "./StartChatModal";

export function ReferenceChatList() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: () => messagesApi.getConversations(),
  });

  const conversations = data?.conversations ?? [];

  const userQueries = useQueries({
    queries: conversations.map((chat) => ({
      queryKey: ["user", chat.partnerId],
      queryFn: () => usersApi.getUserProfile(chat.partnerId),
      staleTime: 1000 * 60 * 5, // 5 minutes
    })),
  });

  const usersMap = new Map(
    userQueries
      .map((q) => q.data?.data)
      .filter((u): u is UserProfileDto => !!u)
      .map((u) => [u.userId, u])
  );

  if (isLoading) {
    return (
      <Card className="h-fit">
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <CardTitle className="text-lg">{t("chat.title")}</CardTitle>
          <StartChatModal />
        </CardHeader>
        <CardContent className="flex justify-center p-4">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-fit">
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <CardTitle className="text-lg">{t("chat.title")}</CardTitle>
          <StartChatModal />
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-destructive text-center text-sm">
            {t("errors.default", "Error loading chats")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle className="text-lg">{t("chat.title")}</CardTitle>
        <StartChatModal />
      </CardHeader>
      <CardContent className="grid gap-1 p-2">
        {conversations.length === 0 ? (
          <p className="text-muted-foreground p-4 text-center text-sm">
            {t("chat.noConversations", "No conversations yet")}
          </p>
        ) : (
          conversations.map((chat) => {
            const user = usersMap.get(chat.partnerId);
            return (
              <Link
                key={chat.partnerId}
                href={`/chat?userId=${chat.partnerId}`}
                className={`hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors ${
                  searchParams.get("userId") === chat.partnerId
                    ? "bg-muted"
                    : ""
                }`}
              >
                {user ? (
                  <UserAvatar user={user} />
                ) : (
                  <div className="bg-muted h-10 w-10 rounded-full" />
                )}
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {user
                        ? `${user.firstName} ${user.lastName}`
                        : `${chat.partnerId}`}
                    </span>
                    <span className="text-muted-foreground text-[10px] whitespace-nowrap">
                      {formatDistanceToNow(
                        new Date(chat.lastMessage.createdAt),
                        {
                          addSuffix: false,
                        }
                      )}
                    </span>
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {chat.lastMessage.content}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
