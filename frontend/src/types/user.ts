export interface UpdateUserProfileDto {
  firstName?: string;
  lastName?: string;
  bio?: string;
}

export enum UserStatus {
  Online = "online",
  Offline = "offline",
  Away = "away",
}

export interface UserProfileDto {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  status: UserStatus;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface GetUserProfileResponseDto {
  success: boolean;
  data: UserProfileDto;
}

export interface AvatarUploadResponseDto {
  avatarUrl: string;
  message: string;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
}

export interface UserStatusResponseDto {
  status: UserStatus;
  lastActivityAt: string | null;
}

export interface OnlineUserDto {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: UserStatus;
  lastActivityAt: string | null;
}

export interface GetOnlineUsersResponseDto {
  users: OnlineUserDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchUsersResponseDto {
  users: UserProfileDto[];
  total: number;
}
