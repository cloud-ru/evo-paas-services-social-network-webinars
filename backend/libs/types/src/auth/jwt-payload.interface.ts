export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  jti: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
}
