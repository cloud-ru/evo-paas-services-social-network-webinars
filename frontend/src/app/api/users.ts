import { apiClient } from "@/lib/api-client";
import {
  AvatarUploadResponseDto,
  GetOnlineUsersResponseDto,
  GetUserProfileResponseDto,
  UpdateUserProfileDto,
  UpdateUserStatusDto,
  UserStatusResponseDto,
  SearchUsersResponseDto,
} from "@/types/api";

export const usersApi = {
  updateProfile: async (data: UpdateUserProfileDto) => {
    const response = await apiClient.put<GetUserProfileResponseDto>(
      "/users/me",
      data
    );
    return response.data;
  },

  getMe: async () => {
    const response =
      await apiClient.get<GetUserProfileResponseDto>("/users/me");
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<AvatarUploadResponseDto>(
      "/users/me/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  updateStatus: async (userId: string, data: UpdateUserStatusDto) => {
    const response = await apiClient.put<UserStatusResponseDto>(
      `/users/${userId}/status`,
      data
    );
    return response.data;
  },

  getUserStatus: async (userId: string) => {
    const response = await apiClient.get<UserStatusResponseDto>(
      `/users/${userId}/status`
    );
    return response.data;
  },

  getOnlineUsers: async (limit = 20, offset = 0) => {
    const response = await apiClient.get<GetOnlineUsersResponseDto>(
      "/users/online",
      {
        params: { limit, offset },
      }
    );
    return response.data;
  },

  getUserProfile: async (userId: string) => {
    const response = await apiClient.get<GetUserProfileResponseDto>(
      `/users/${userId}`
    );
    return response.data;
  },

  searchUsers: async (query?: string, limit = 20, offset = 0) => {
    const response = await apiClient.get<SearchUsersResponseDto>(
      "/users/search",
      {
        params: { query, limit, offset },
      }
    );
    return response.data;
  },
};
