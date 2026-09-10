export type UserRole = "patient" | "doctor" | "admin" | "author";

export interface User {
  id: string;
  username: string | null;
  full_name: string;
  phone_number: string;
  email: string | null;
  role: UserRole;
  role_display: string;
  profile_pic: string;
  specialty: string;
  medical_license_number: string;
  bio: string;
  is_active: boolean;
  created_at: string;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  tokens: Tokens;
  user: User;
  is_new?: boolean;
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}