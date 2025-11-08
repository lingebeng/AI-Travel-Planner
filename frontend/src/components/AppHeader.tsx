import React from 'react';
import { Layout, Space, Button, Typography } from 'antd';
import { CompassOutlined, HomeOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './AppHeader.scss';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
          <Button
            type="text"
            shape="circle"
            icon={<UserOutlined />}
            className="user-btn"
          />
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;