import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./auth";
import { RefreshRequestDto, RefreshResponseDto } from "@/types/auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function redirectToLogin(): void {
  if (typeof globalThis.window !== "undefined") {
    const currentPath = globalThis.window.location.pathname;
    // Don't redirect if already on auth pages
    if (!currentPath.startsWith("/auth")) {
      globalThis.window.location.href = "/auth/login";
    }
  }
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        const token = await new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        originalRequest.headers.Authorization = `Bearer ${token}`;
        originalRequest._retry = true;
        return apiClient(originalRequest);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        console.error("No refresh token found");
        processQueue(new Error("No refresh token found"), null);
        isRefreshing = false;
        clearTokens();
        redirectToLogin();
        throw error;
      }

      try {
        const request: RefreshRequestDto = {
          refreshToken,
        };

        const { data } = await axios.post<RefreshResponseDto>(
          `${baseURL}/auth/refresh`,
          request,
          {
            withCredentials: true,
          }
        );

        if (!data.success || !data.data) {
          console.error("Refresh failed");
          throw new Error(data.error?.message || "Refresh failed");
        }

        const { accessToken } = data.data;

        setTokens(accessToken, refreshToken);

        processQueue(null, accessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token failed", refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;
        clearTokens();
        redirectToLogin();
        throw refreshError;
      }
    }

    throw error;
  }
);
