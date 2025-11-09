import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, Typography, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.scss';

const { Title, Paragraph } = Typography;

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('login');
  const [loading, setLoading] = useState(false);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  // 获取重定向路径
  const from = (location.state as any)?.from?.pathname || '/planner';

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const success = await login(values.email, values.password);
      if (success) {
        navigate(from, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { email: string; password: string; fullName?: string }) => {
    setLoading(true);
    try {
      const success = await register(values.email, values.password, values.fullName);
      if (success) {
        message.success('注册成功！正在跳转...');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Card className="auth-card">
          <div className="auth-header">
            <Title level={2}>AI Travel Planner</Title>
            <Paragraph type="secondary">智能旅行规划助手</Paragraph>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            items={[
              {
                key: 'login',
                label: '登录',
                children: (
                  <Spin spinning={loading}>
                    <Form
                      form={loginForm}
                      name="login"
                      onFinish={handleLogin}
                      autoComplete="off"
                      size="large"
                      layout="vertical"
                    >
                      <Form.Item
                        name="email"
                        rules={[
                          { required: true, message: '请输入邮箱' },
                          { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                      >
                        <Input
                          prefix={<MailOutlined />}
                          placeholder="邮箱"
                          autoComplete="email"
                        />
                      </Form.Item>

                      <Form.Item
                        name="password"
                        rules={[
                          { required: true, message: '请输入密码' },
                          { min: 6, message: '密码至少6位' }
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="密码"
                          autoComplete="current-password"
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          block
                          loading={loading}
                          size="large"
                        >
                          登录
                        </Button>
                      </Form.Item>

                      <div className="auth-footer">
                        <span>还没有账号？</span>
                        <Button
                          type="link"
                          onClick={() => setActiveTab('register')}
                        >
                          立即注册
                        </Button>
                      </div>
                    </Form>
                  </Spin>
                )
              },
              {
                key: 'register',
                label: '注册',
                children: (
                  <Spin spinning={loading}>
                    <Form
                      form={registerForm}
                      name="register"
                      onFinish={handleRegister}
                      autoComplete="off"
                      size="large"
                      layout="vertical"
                    >
                      <Form.Item
                        name="fullName"
                        rules={[{ required: false }]}
                      >
                        <Input
                          prefix={<UserOutlined />}
                          placeholder="姓名（可选）"
                          autoComplete="name"
                        />
                      </Form.Item>

                      <Form.Item
                        name="email"
                        rules={[
                          { required: true, message: '请输入邮箱' },
                          { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                      >
                        <Input
                          prefix={<MailOutlined />}
                          placeholder="邮箱"
                          autoComplete="email"
                        />
                      </Form.Item>

                      <Form.Item
                        name="password"
                        rules={[
                          { required: true, message: '请输入密码' },
                          { min: 6, message: '密码至少6位' }
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="密码（至少6位）"
                          autoComplete="new-password"
                        />
                      </Form.Item>

                      <Form.Item
                        name="confirmPassword"
                        dependencies={['password']}
                        rules={[
                          { required: true, message: '请确认密码' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error('两次密码输入不一致'));
                            },
                          }),
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="确认密码"
                          autoComplete="new-password"
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          block
                          loading={loading}
                          size="large"
                        >
                          注册
                        </Button>
                      </Form.Item>

                      <div className="auth-footer">
                        <span>已有账号？</span>
                        <Button
                          type="link"
                          onClick={() => setActiveTab('login')}
                        >
                          立即登录
                        </Button>
                      </div>
                    </Form>
                  </Spin>
                )
              }
            ]}
          />
        </Card>

        <div className="auth-info">
          <Paragraph type="secondary">
            登录后可保存行程、查看历史记录、多设备同步
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
