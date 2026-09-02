export type UserRole = "admin" | "manager" | "user";

export interface AuthToken {
  access_token: string;
  token_type: "bearer";
}

export interface UserProfile {
  id: number;
  user_id: number;
  name: string | null;
  phone: string | null;
  address: string | null;
}

export interface CurrentUser {
  email: string;
  role: UserRole;
  profile: UserProfile | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface PasswordActionResponse {
  message: string;
}

export interface FastApiValidationError {
  loc?: Array<string | number>;
  msg: string;
  type?: string;
}