import { apiClient } from "@/lib/api-client";
import {
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  GetSessionsResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  LogoutResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
  RevokeSessionResponseDto,
  VerifyEmailRequestDto,
  VerifyEmailResponseDto,
} from "@/types/api";

export const authApi = {
  register: async (data: RegisterRequestDto) => {
    const response = await apiClient.post<RegisterResponseDto>(
      "/auth/register",
      data
    );
    return response.data;
  },

  verifyEmail: async (data: VerifyEmailRequestDto) => {
    const response = await apiClient.post<VerifyEmailResponseDto>(
      "/auth/verify-email",
      data
    );
    return response.data;
  },

  verifyEmailByLink: async (token: string) => {
    const response = await apiClient.get<VerifyEmailResponseDto>(
      "/auth/verify-email",
      {
        params: { token },
      }
    );
    return response.data;
  },

  login: async (data: LoginRequestDto) => {
    const response = await apiClient.post<LoginResponseDto>(
      "/auth/login",
      data
    );
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<LogoutResponseDto>("/auth/logout");
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequestDto) => {
    const response = await apiClient.post<ForgotPasswordResponseDto>(
      "/auth/forgot-password",
      data
    );
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequestDto) => {
    const response = await apiClient.post<ResetPasswordResponseDto>(
      "/auth/reset-password",
      data
    );
    return response.data;
  },

  getSessions: async () => {
    const response =
      await apiClient.get<GetSessionsResponseDto>("/auth/sessions");
    return response.data;
  },

  revokeSession: async (sessionId: string) => {
    const response = await apiClient.delete<RevokeSessionResponseDto>(
      `/auth/sessions/${sessionId}`
    );
    return response.data;
  },
};
