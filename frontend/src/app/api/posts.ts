import { apiClient } from "@/lib/api-client";
import {
  FeedPostResponseDto,
  GetFeedResponseDto,
  GetPostLikesResponseDto,
  PostResponseDto,
} from "@/types/api";

export const postsApi = {
  createPost: async (content: string, files: File[]) => {
    const formData = new FormData();
    formData.append("content", content);
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await apiClient.post<PostResponseDto>("/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getPosts: async (limit = 10, offset = 0) => {
    const response = await apiClient.get<GetFeedResponseDto>("/posts", {
      params: { limit, offset },
    });
    return response.data;
  },

  getPost: async (id: string) => {
    const response = await apiClient.get<FeedPostResponseDto>(`/posts/${id}`);
    return response.data;
  },

  likePost: async (id: string) => {
    const response = await apiClient.post<{ postId: string; likes: number }>(
      `/posts/${id}/like`
    );
    return response.data;
  },

  unlikePost: async (id: string) => {
    const response = await apiClient.delete<{ postId: string; likes: number }>(
      `/posts/${id}/like`
    );
    return response.data;
  },

  getPostLikes: async (id: string, limit: number, offset: number) => {
    const response = await apiClient.get<GetPostLikesResponseDto>(
      `/posts/${id}/likes`,
      {
        params: { limit, offset },
      }
    );
    return response.data;
  },

  getUserPosts: async (userId: string, limit = 10, offset = 0) => {
    const response = await apiClient.get<GetFeedResponseDto>(
      `/posts/user/${userId}`,
      {
        params: { limit, offset },
      }
    );
    return response.data;
  },
};
