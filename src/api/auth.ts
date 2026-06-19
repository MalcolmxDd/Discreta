// =============================================================
// Auth API
// =============================================================

import { request } from './client';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  default_address: string | null;
  created_at: string;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
}

export async function fetchMe(): Promise<UserProfile> {
  return request<UserProfile>('/auth/me');
}
