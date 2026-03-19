import { apiClient } from "@/lib/api-client";
import {
  CreateMessageDto,
  DeleteMessageResponseDto,
  GetConversationsResponseDto,
  GetMessagesResponseDto,
  GetUnreadCountResponseDto,
  LikeMessageResponseDto,
  MessageResponseDto,
} from "@/types/api";

export const MESSAGES_REFETCH_INTERVAL = 5000;

export const messagesApi = {
  createMessage: async (data: CreateMessageDto) => {
    const response = await apiClient.post<MessageResponseDto>("/message", data);
    return response.data;
  },

  getConversations: async (limit = 20, offset = 0) => {
    const response = await apiClient.get<GetConversationsResponseDto>(
      "/message/conversations",
      {
        params: { limit, offset },
      }
    );
    return response.data;
  },

  getUnreadCount: async () => {
    const response =
      await apiClient.get<GetUnreadCountResponseDto>("/message/unread");
    return response.data;
  },

  getMessages: async (userId: string, limit = 20, offset = 0) => {
    const response = await apiClient.get<GetMessagesResponseDto>(
      `/message/${userId}`,
      {
        params: { limit, offset },
      }
    );
    return response.data;
  },

  deleteMessage: async (messageId: string) => {
    const response = await apiClient.delete<DeleteMessageResponseDto>(
      `/message/${messageId}`
    );
    return response.data;
  },

  searchMessages: async (
    userId: string,
    query: string,
    limit = 20,
    offset = 0
  ) => {
    const response = await apiClient.get<GetMessagesResponseDto>(
      `/message/${userId}/search`,
      {
        params: { query, limit, offset },
      }
    );
    return response.data;
  },

  likeMessage: async (messageId: string) => {
    const response = await apiClient.post<LikeMessageResponseDto>(
      `/message/${messageId}/like`
    );
    return response.data;
  },

  unlikeMessage: async (messageId: string) => {
    const response = await apiClient.delete<LikeMessageResponseDto>(
      `/message/${messageId}/like`
    );
    return response.data;
  },
};
