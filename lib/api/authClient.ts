import { RegisterInput, LoginInput } from '../../types/auth';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  user?: T;
  token?: string;
  errors?: any;
}

export async function registerUserApi(data: RegisterInput): Promise<ApiResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || 'Registration failed');
  }
  return body;
}

export async function loginUserApi(data: LoginInput): Promise<ApiResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || 'Login failed');
  }
  return body;
}
