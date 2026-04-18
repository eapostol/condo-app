export type UserRole = 'manager' | 'board' | 'resident' | 'admin';

// Current runtime user providers. "social" is client-only fallback labeling used
// by the social login handler when a provider query param is missing or generic.
export type AuthProvider = 'local' | 'google' | 'microsoft' | 'social';

export interface JwtSessionPayload {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthSessionUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  provider?: AuthProvider;
}

export interface AuthSuccessResponse {
  token: string;
  user: AuthSessionUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  username?: string;
  password: string;
  role?: UserRole;
}

// Note: /api/auth/me currently returns a Mongoose-shaped document-like payload
// with _id and optional persistence fields, unlike login/register.
export interface AuthProfileUser {
  _id: string;
  name: string;
  role: UserRole;
  email: string;
  username?: string;
  provider?: Exclude<AuthProvider, 'social'>;
  providerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthMeResponse {
  user: AuthProfileUser;
}

export interface SocialLoginRedirectPayload {
  token: string;
  provider: AuthProvider;
}

export interface ApiMessageResponse {
  message: string;
}
