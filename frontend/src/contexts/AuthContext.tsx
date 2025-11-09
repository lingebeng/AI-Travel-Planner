import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../lib/supabase';
import { authService } from '../services/authService';
import { message } from 'antd';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化：检查用户是否已登录
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('初始化认证失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 监听认证状态变化
    const { data: authListener } = authService.onAuthStateChange((newUser) => {
      setUser(newUser);
      setLoading(false);
    });

    // 清理监听器
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await authService.login(email, password);

      if (result.success && result.data) {
        setUser(result.data.user);
        message.success('登录成功！');
        return true;
      } else {
        message.error(result.error || '登录失败');
        return false;
      }
    } catch (error: any) {
      message.error(error.message || '登录失败');
      return false;
    }
  };

  const register = async (email: string, password: string, fullName?: string): Promise<boolean> => {
    try {
      const result = await authService.register(email, password, fullName);

      if (result.success && result.data) {
        setUser(result.data.user);
        message.success('注册成功！');
        return true;
      } else {
        message.error(result.error || '注册失败');
        return false;
      }
    } catch (error: any) {
      message.error(error.message || '注册失败');
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      message.success('已退出登录');
    } catch (error: any) {
      message.error(error.message || '退出失败');
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const session = await authService.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('获取 access token 失败:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    getAccessToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
