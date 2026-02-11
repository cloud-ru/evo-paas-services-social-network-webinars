export interface CreateMessageDto {
  recipientId: string;
  content: string;
}

export interface MessageResponseDto {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
}

export interface LastMessageDto {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

export interface ConversationPreviewDto {
  partnerId: string;
  lastMessage: LastMessageDto;
  unreadCount: number;
}

export interface GetConversationsResponseDto {
  conversations: ConversationPreviewDto[];
  total: number;
}

export interface GetUnreadCountResponseDto {
  unreadCount: number;
}

export interface GetMessagesResponseDto {
  messages: MessageResponseDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface DeleteMessageResponseDto {
  success: boolean;
}

export interface LikeMessageResponseDto {
  messageId: string;
  likes: number;
}
