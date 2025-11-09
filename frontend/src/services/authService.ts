import { supabase, User, Session } from '../lib/supabase';

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    session: Session;
  };
  error?: string;
}

class AuthService {
  /**
   * 注册新用户
   */
  async register(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (data.user && data.session) {
        return {
          success: true,
          data: {
            user: {
              id: data.user.id,
              email: data.user.email || '',
              user_metadata: data.user.user_metadata
            },
            session: {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
              user: {
                id: data.user.id,
                email: data.user.email || '',
                user_metadata: data.user.user_metadata
              }
            }
          }
        };
      }

      return {
        success: false,
        error: '注册失败，请重试'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '注册失败'
      };
    }
  }

  /**
   * 用户登录
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (data.user && data.session) {
        return {
          success: true,
          data: {
            user: {
              id: data.user.id,
              email: data.user.email || '',
              user_metadata: data.user.user_metadata
            },
            session: {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
              user: {
                id: data.user.id,
                email: data.user.email || '',
                user_metadata: data.user.user_metadata
              }
            }
          }
        };
      }

      return {
        success: false,
        error: '登录失败，请重试'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '登录失败'
      };
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '登出失败'
      };
    }
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        return {
          id: user.id,
          email: user.email || '',
          user_metadata: user.user_metadata
        };
      }

      return null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  /**
   * 获取当前会话
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        return {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user: {
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata
          }
        };
      }

      return null;
    } catch (error) {
      console.error('获取会话失败:', error);
      return null;
    }
  }

  /**
   * 刷新会话
   */
  async refreshSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('刷新会话失败:', error);
        return null;
      }

      if (session) {
        return {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user: {
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata
          }
        };
      }

      return null;
    } catch (error) {
      console.error('刷新会话失败:', error);
      return null;
    }
  }

  /**
   * 监听认证状态变化
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);

      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata
        });
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
