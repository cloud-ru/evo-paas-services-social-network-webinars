"use client";

import { UserList } from "@/components/users/UserList";
import { OnlineUsers } from "@/components/users/OnlineUsers";
import { useTranslation } from "react-i18next";

import { BasePageLayout } from "@/components/layout/BasePageLayout";

export default function UsersPage() {
  const { t } = useTranslation();

  return (
    <BasePageLayout>
      <div className="container mx-auto max-w-4xl space-y-8 py-6">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("users.title")}
          </h1>
          <OnlineUsers />
        </div>

        <div className="space-y-6">
          <UserList />
        </div>
      </div>
    </BasePageLayout>
  );
}
