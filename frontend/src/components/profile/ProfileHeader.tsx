import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserAvatar } from "@/components/users/UserAvatar";
import { UserProfileDto, UserStatus } from "@/types/api";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface ProfileHeaderProps {
  readonly profile: UserProfileDto;
  readonly actions?: React.ReactNode;
}

export function ProfileHeader({ profile, actions }: ProfileHeaderProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.Online:
        return "bg-green-500";
      case UserStatus.Away:
        return "bg-yellow-500";
      case UserStatus.Offline:
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="mb-6 w-full">
      <CardHeader className="relative h-32 overflow-hidden rounded-t-xl bg-gradient-to-r from-blue-400 to-purple-500">
        {/* Banner area - could be customizable in future */}
      </CardHeader>
      <CardContent className="relative pt-0">
        <div className="-mt-12 mb-4 flex flex-col items-center px-4 sm:-mt-16 sm:flex-row sm:items-end">
          <div className="relative">
            <UserAvatar
              user={profile}
              className="border-background h-24 w-24 border-4 sm:h-32 sm:w-32"
              fallbackClassName="text-2xl sm:text-4xl"
            />
            <div
              className={`border-background absolute right-1 bottom-1 h-4 w-4 rounded-full border-2 sm:right-2 sm:bottom-2 sm:h-6 sm:w-6 ${getStatusColor(
                profile.status
              )}`}
              title={t(`status.${profile.status}`)}
            />
          </div>

          <div className="mt-4 flex-1 text-center sm:mt-0 sm:ml-6 sm:text-left">
            <h1 className="text-2xl font-bold sm:text-3xl">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-muted-foreground mt-1">
              @{profile.userId.split("-")[0]}{" "}
              {/* Displaying part of ID as handle for now */}
            </p>
          </div>

          <div className="mt-4 mr-4 sm:mt-0">
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {t("status.joined")}{" "}
              {format(new Date(profile.createdAt), "yyyy-MM-dd")}
            </Badge>
          </div>
          {actions && <div className="mt-4 sm:mt-0 sm:ml-auto">{actions}</div>}
        </div>

        {profile.bio && (
          <div className="mt-6 px-4">
            <h3 className="mb-2 font-semibold">{t("profile.about")}</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
