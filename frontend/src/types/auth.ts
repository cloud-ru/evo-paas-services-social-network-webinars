export interface RegisterRequestDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponseData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  message: string;
}

export interface RegisterErrorDto {
  code: string;
  message: string;
}

export interface RegisterResponseDto {
  success: boolean;
  data: RegisterResponseData;
  error?: RegisterErrorDto | null;
}

export interface VerifyEmailRequestDto {
  token: string;
}

export interface VerifyEmailDataDto {
  message: string;
  email: string;
  canLogin: boolean;
}

export interface VerifyEmailErrorDto {
  code: string;
  message: string;
}

export interface VerifyEmailResponseDto {
  success: boolean;
  data: VerifyEmailDataDto;
  error?: VerifyEmailErrorDto;
}

export interface LoginRequestDto {
  email: string;
  password: string;
  deviceName?: string;
}

export interface LoginDataDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  email: string;
}

export interface LoginErrorDto {
  code: string;
  message: string;
}

export interface LoginResponseDto {
  success: boolean;
  data?: LoginDataDto;
  error?: LoginErrorDto;
}

export interface RefreshRequestDto {
  refreshToken: string;
}

export interface RefreshDataDto {
  accessToken: string;
  expiresIn: number;
}

export interface RefreshErrorDto {
  code: string;
  message: string;
}

export interface RefreshResponseDto {
  success: boolean;
  data?: RefreshDataDto;
  error?: RefreshErrorDto;
}

export interface LogoutResponseDataDto {
  message: string;
}

export interface LogoutResponseErrorDto {
  code: string;
  message: string;
}

export interface LogoutResponseDto {
  success: boolean;
  data?: LogoutResponseDataDto;
  error?: LogoutResponseErrorDto;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ForgotPasswordResponseDto {
  message: string;
}

export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponseData {
  message: string;
}

export interface ResetPasswordResponseDto {
  success: boolean;
  data: ResetPasswordResponseData;
}

export interface SessionDeviceDto {
  userAgent: string;
  name: string;
  ip: string;
}

export interface SessionDto {
  sessionId: string;
  device: SessionDeviceDto;
  lastActivityAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface GetSessionsResponseDataDto {
  sessions: SessionDto[];
}

export interface GetSessionsResponseDto {
  success: boolean;
  data: GetSessionsResponseDataDto;
}

export interface RevokeSessionResponseData {
  message: string;
}

export interface RevokeSessionResponseDto {
  success: boolean;
  data: RevokeSessionResponseData;
}
