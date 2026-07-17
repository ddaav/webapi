import Cookies from 'js-cookie';
import { RegisterInput, RegisterInputSchema, LoginInput, LoginInputSchema } from '../types/auth';
import { registerUserApi, loginUserApi } from '../lib/api/authClient';

export interface ActionState<T = any> {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  data?: T;
}

export async function registerAction(data: RegisterInput): Promise<ActionState> {
  // 1. Client-Side Zod Validation
  const validation = RegisterInputSchema.safeParse(data);
  if (!validation.success) {
    const errors: Record<string, string> = {};
    validation.error.issues.forEach((issue) => {
      const path = issue.path[0]?.toString();
      if (path) {
        errors[path] = issue.message;
      }
    });
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
      errors,
    };
  }

  try {
    // 2. Call API Client
    const res = await registerUserApi(validation.data);
    return {
      success: true,
      message: res.message,
      data: res.user,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Registration failed',
    };
  }
}

export async function loginAction(data: LoginInput): Promise<ActionState> {
  // 1. Client-Side Zod Validation
  const validation = LoginInputSchema.safeParse(data);
  if (!validation.success) {
    const errors: Record<string, string> = {};
    validation.error.issues.forEach((issue) => {
      const path = issue.path[0]?.toString();
      if (path) {
        errors[path] = issue.message;
      }
    });
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Validation failed',
      errors,
    };
  }

  try {
    // 2. Call API Client
    const res = await loginUserApi(validation.data);

    if (res.token && res.user) {
      // 3. Cookie Implementation
      Cookies.set('token', res.token, { expires: 1, path: '/' });
      Cookies.set('user', JSON.stringify(res.user), { expires: 1, path: '/' });
    }

    return {
      success: true,
      message: res.message,
      data: res.user,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Login failed',
    };
  }
}

export function logoutAction(): void {
  Cookies.remove('token', { path: '/' });
  Cookies.remove('user', { path: '/' });
}
