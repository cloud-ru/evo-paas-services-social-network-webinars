import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { UserProfileDto } from "@/types/api";

interface UserAvatarProps {
  user: Pick<UserProfileDto, "firstName" | "lastName" | "avatarUrl">;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  user,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  return (
    <Avatar className={cn("h-10 w-10", className)}>
      <AvatarImage
        src={user.avatarUrl || undefined} // AvatarImage expects string | undefined
        alt={`${user.firstName} ${user.lastName}`}
      />
      <AvatarFallback className={cn("uppercase", fallbackClassName)}>
        {user.firstName?.[0]}
        {user.lastName?.[0]}
      </AvatarFallback>
    </Avatar>
  );
}
