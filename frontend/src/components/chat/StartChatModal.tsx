"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OnlineUsers } from "@/components/users/OnlineUsers";
import { UserList } from "@/components/users/UserList";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnlineUserDto } from "@/types/api";

export function StartChatModal() {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleUserSelect = (user: OnlineUserDto) => {
    setOpen(false);
    router.push(`/chat?userId=${user.userId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span>{t("chat.start_chat", "Start Chat")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[80vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>
            {t("chat.new_conversation", "New Conversation")}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(80vh-8rem)] p-6 pt-2">
          <div className="space-y-6 pb-6">
            <OnlineUsers onUserSelect={handleUserSelect} />
            <UserList onUserSelect={handleUserSelect} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
