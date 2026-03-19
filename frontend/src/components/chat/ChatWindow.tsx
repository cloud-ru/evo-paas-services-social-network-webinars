"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MESSAGES_REFETCH_INTERVAL, messagesApi } from "@/app/api/messages";
import { usersApi } from "@/app/api/users";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Loader2, MoreVertical, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChatInput } from "./ChatInput";
import { UserAvatar } from "@/components/users/UserAvatar";

interface ChatWindowProps {
  readonly partnerId: string;
}

export function ChatWindow({ partnerId }: ChatWindowProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: partner, isLoading: isLoadingPartner } = useQuery({
    queryKey: ["user", partnerId],
    queryFn: () => usersApi.getUserProfile(partnerId),
  });

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", partnerId, searchQuery],
    queryFn: () =>
      searchQuery
        ? messagesApi.searchMessages(partnerId, searchQuery)
        : messagesApi.getMessages(partnerId),
    refetchInterval: MESSAGES_REFETCH_INTERVAL,
  });

  const sendMessageMutation = useMutation({
    mutationFn: messagesApi.createMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", partnerId] });
      queryClient.invalidateQueries({
        queryKey: ["messages", "conversations"],
      });
    },
  });

  const messages = useMemo(
    () => (messagesData?.messages ? [...messagesData.messages].reverse() : []),
    [messagesData]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    sendMessageMutation.mutate({
      recipientId: partnerId,
      content,
    });
  };

  if (isLoadingPartner) {
    return (
      <Card className="flex h-[calc(100vh-100px)] flex-col justify-center">
        <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
      </Card>
    );
  }

  if (!partner) {
    return (
      <Card className="flex h-[calc(100vh-100px)] items-center justify-center p-6">
        <p className="text-muted-foreground">{t("users.error")}</p>
      </Card>
    );
  }

  return (
    <Card className="flex h-[calc(100vh-100px)] flex-col">
      <CardHeader className="flex flex-row items-center space-y-0 border-b p-4">
        <div className="flex items-center gap-3">
          <Link href="/chat">
            <Button variant="ghost" size="icon" className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Link
            href={`/users/${partnerId}`}
            className="flex items-center gap-3"
          >
            <UserAvatar user={partner.data} className="h-10 w-10" />
            <div>
              <p className="font-semibold">
                {partner.data.firstName} {partner.data.lastName}
              </p>
              {/* Online status could be added here if available */}
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isSearching ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder={t("chat.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-[200px]"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery("");
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearching(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div
          ref={scrollRef}
          className="flex h-full flex-col overflow-y-auto p-4"
        >
          {isLoadingMessages && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          )}
          {!isLoadingMessages && messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">
                {t("chat.noConversations")}
              </p>
              <p className="text-muted-foreground text-sm">
                {t("chat.selectConversation")}
              </p>
            </div>
          )}
          {!isLoadingMessages && messages.length > 0 && (
            <div className="flex flex-col gap-4">
              {messages.map((message) => {
                const isMe = message.senderId !== partnerId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          isMe
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {format(new Date(message.createdAt), "HH:mm")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      <ChatInput
        onSend={handleSend}
        isLoading={sendMessageMutation.isPending}
      />
    </Card>
  );
}
