import React from 'react';
import { Layout, Space, Button, Typography, Dropdown, Avatar } from 'antd';
import { CompassOutlined, HomeOutlined, UserOutlined, LogoutOutlined, HistoryOutlined, LoginOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AppHeader.scss';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'my-itineraries',
      label: '我的行程',
      icon: <HistoryOutlined />,
      onClick: () => navigate('/my-itineraries'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Header className="app-header">
      <div className="header-container">
        <div className="logo-section" onClick={() => navigate('/')}>
          <CompassOutlined className="logo-icon" />
          <Title level={3} className="logo-text">
            AI 旅行规划师
          </Title>
        </div>

        <Space size="large" className="nav-menu">
          <Button
            type="text"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            className={location.pathname === '/' ? 'active' : ''}
          >
            首页
          </Button>
          <Button
            type="primary"
            ghost
            onClick={() => navigate('/planner')}
            className={`planner-btn ${location.pathname === '/planner' ? 'active' : ''}`}
          >
            开始规划
          </Button>

          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button
                type="text"
                className="user-btn"
              >
                <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                {user.email}
              </Button>
            </Dropdown>
          ) : (
            <Button
              type="text"
              icon={<LoginOutlined />}
              onClick={() => navigate('/auth')}
              className="login-btn"
            >
              登录
            </Button>
          )}
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;