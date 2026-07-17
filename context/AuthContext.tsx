import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { apiProxy } from '../lib/api/apiProxy';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
  profilePicture?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user data on initialization
  useEffect(() => {
    const token = Cookies.get('token');
    const storedUser = Cookies.get('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user cookie:', e);
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    Cookies.set('token', token, { expires: 1, path: '/' });
    Cookies.set('user', JSON.stringify(userData), { expires: 1, path: '/' });
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = () => {
    Cookies.remove('token', { path: '/' });
    Cookies.remove('user', { path: '/' });
    setUser(null);
    router.push('/login');
  };

  const updateUser = (userData: User) => {
    Cookies.set('user', JSON.stringify(userData), { expires: 1, path: '/' });
    setUser(userData);
  };

  const refreshUser = async () => {
    try {
      const res = await apiProxy.get('/api/v1/auth/whoami');
      const data = await res.json();
      if (data.success && data.user) {
        updateUser(data.user);
      }
    } catch (e) {
      console.error('Error refreshing user details:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
