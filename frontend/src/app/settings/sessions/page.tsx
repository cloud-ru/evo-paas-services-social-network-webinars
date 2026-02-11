"use client";

import { useTranslation } from "react-i18next";
import { SessionList } from "@/components/sessions/SessionList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { BasePageLayout } from "@/components/layout/BasePageLayout";

export default function SessionsPage() {
  const { t } = useTranslation();

  return (
    <BasePageLayout>
      <div className="container max-w-3xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>{t("auth.sessions.title")}</CardTitle>
            <CardDescription>{t("auth.sessions.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SessionList />
          </CardContent>
        </Card>
      </div>
    </BasePageLayout>
  );
}
