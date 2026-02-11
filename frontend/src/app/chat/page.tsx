"use client";

import { useSearchParams } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ReferenceChatList } from "@/components/chat/ReferenceChatList";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

import { BasePageLayout } from "@/components/layout/BasePageLayout";

import { Suspense } from "react";

function ChatContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-6">
      <div className="ml-6 grid min-w-300 grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
        <div className="md:col-span-1 md:block">
          <ReferenceChatList />
        </div>

        <div className="col-span-1 mr-6 md:col-span-2 lg:col-span-3">
          {userId ? (
            <ChatWindow partnerId={userId} />
          ) : (
            <Card className="bg-muted/20 flex h-[calc(100vh-100px)] items-center justify-center p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {t("chat.selectConversation")}
                </h3>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <BasePageLayout>
      <Suspense fallback={null}>
        <ChatContent />
      </Suspense>
    </BasePageLayout>
  );
}
