import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * 路由守卫组件 - 保护需要登录的页面
 *
 * 使用方式:
 * <Route path="/protected" element={<PrivateRoute><ProtectedPage /></PrivateRoute>} />
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 正在加载认证状态
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 未登录，重定向到登录页
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 已登录，显示受保护的内容
  return <>{children}</>;
};

export default PrivateRoute;
