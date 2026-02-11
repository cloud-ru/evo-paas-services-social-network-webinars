"use client";

import { useTranslation } from "react-i18next";
import { Laptop, Smartphone, Globe } from "lucide-react";

import { SessionDto } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionItemProps {
  session: SessionDto;
  onRevoke: (sessionId: string) => void;
  isRevoking: boolean;
}

export function SessionItem({
  session,
  onRevoke,
  isRevoking,
}: SessionItemProps) {
  const { t } = useTranslation();

  // Helper to determine icon based on device name or type (rudimentary)
  const getDeviceIcon = () => {
    const userAgent = session.device.userAgent.toLowerCase();
    if (
      userAgent.includes("mobile") ||
      userAgent.includes("android") ||
      userAgent.includes("iphone")
    ) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Laptop className="h-5 w-5" />;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat("default", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <div className="bg-secondary rounded-full p-2">{getDeviceIcon()}</div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                {session.device.name || "Unknown Device"}
                {session.isCurrent && (
                  <Badge variant="default" className="text-xs">
                    {t("auth.sessions.current")}
                  </Badge>
                )}
              </h4>
            </div>
            <div className="text-muted-foreground mt-1 space-y-1 text-xs">
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span>{session.device.ip}</span>
              </div>
              <div>
                {t("auth.sessions.lastActive")}:{" "}
                {formatDate(session.lastActivityAt)}
              </div>
            </div>
          </div>
        </div>

        {!session.isCurrent && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onRevoke(session.sessionId)}
            disabled={isRevoking}
          >
            {isRevoking
              ? t("auth.sessions.revoking")
              : t("auth.sessions.revoke")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
