import Cookies from 'js-cookie';

export interface ApiProxy {
  request: (url: string, options?: RequestInit) => Promise<Response>;
  get: (url: string, options?: RequestInit) => Promise<Response>;
  post: (url: string, options?: RequestInit) => Promise<Response>;
  put: (url: string, options?: RequestInit) => Promise<Response>;
  delete: (url: string, options?: RequestInit) => Promise<Response>;
}

/**
 * Client-side JS Proxy API wrapper that intercepts fetch requests to:
 * - Automatically inject 'Authorization: Bearer <token>' header if token exists in cookies.
 * - Detect 401 (Unauthorized) status codes to clear cookies and redirect to /login.
 */
const apiProxyInstance = {
  request: async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = Cookies.get('token');
    const headers = new Headers(options.headers || {});
    
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clean auth data and redirect on authorization failure
      Cookies.remove('token', { path: '/' });
      Cookies.remove('user', { path: '/' });
      if (typeof window !== 'undefined') {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
    }

    return response;
  }
};

export const apiProxy = new Proxy(apiProxyInstance, {
  get: (target, prop) => {
    if (prop === 'request') {
      return target.request;
    }
    
    if (['get', 'post', 'put', 'delete'].includes(prop as string)) {
      return (url: string, options: RequestInit = {}) => {
        return target.request(url, {
          ...options,
          method: (prop as string).toUpperCase(),
        });
      };
    }
    
    return Reflect.get(target, prop);
  }
}) as unknown as ApiProxy;
