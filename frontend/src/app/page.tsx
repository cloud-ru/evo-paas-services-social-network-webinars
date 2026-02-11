"use client";

import { Feed } from "@/components/feed/Feed";
import { ReferenceChatList } from "@/components/chat/ReferenceChatList";
import { BasePageLayout } from "@/components/layout/BasePageLayout";
import { Suspense } from "react";

export default function Home() {
  return (
    <BasePageLayout
      showRightSidebar
      rightSidebarContent={
        <Suspense fallback={null}>
          <ReferenceChatList />
        </Suspense>
      }
    >
      <Feed />
    </BasePageLayout>
  );
}
