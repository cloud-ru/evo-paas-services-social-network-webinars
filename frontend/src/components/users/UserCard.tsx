import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/users/UserAvatar";
import { OnlineUserDto } from "@/types/api";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface UserCardProps {
  readonly user: OnlineUserDto;
  readonly onUserSelect?: (user: OnlineUserDto) => void;
}

export function UserCard({ user, onUserSelect }: UserCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden">
      <div
        className={cn("block", onUserSelect && "cursor-pointer")}
        onClick={() => {
          if (onUserSelect) {
            onUserSelect(user);
          }
        }}
      >
        {!onUserSelect ? (
          <Link href={`/users/${user.userId}`} className="block">
            <CardContent className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors">
              <UserAvatar user={user} className="h-12 w-12" />
              <div className="flex-1 overflow-hidden">
                <h3 className="truncate font-medium">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-muted-foreground truncate text-sm">
                  {t(`status.${user.status}`, user.status)}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={`/chat?userId=${user.userId}`}>
                  <MessageCircle className="h-5 w-5" />
                  <span className="sr-only">
                    {t("users.message", "Message")}
                  </span>
                </Link>
              </Button>
            </CardContent>
          </Link>
        ) : (
          <CardContent className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors">
            <UserAvatar user={user} className="h-12 w-12" />
            <div className="flex-1 overflow-hidden">
              <h3 className="truncate font-medium">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-muted-foreground truncate text-sm">
                {t(`status.${user.status}`, user.status)}
              </p>
            </div>
          </CardContent>
        )}
      </div>
    </Card>
  );
}
