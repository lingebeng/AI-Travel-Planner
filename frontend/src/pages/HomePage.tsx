import React from 'react';
import { Typography, Button, Card, Row, Col, Space } from 'antd';
import {
  CompassOutlined,
  AudioOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  RocketOutlined,
  HeartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './HomePage.scss';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <AudioOutlined />,
      title: '语音输入',
      description: '通过语音轻松描述您的旅行需求，AI 智能识别并理解',
      color: '#22c55e',
    },
    {
      icon: <CompassOutlined />,
      title: 'AI 智能规划',
      description: '基于深度学习技术，为您定制个性化的旅行计划',
      color: '#0ea5e9',
    },
    {
      icon: <EnvironmentOutlined />,
      title: '地图可视化',
      description: '在地图上直观展示您的行程路线和景点位置',
      color: '#f97316',
    },
    {
      icon: <DollarOutlined />,
      title: '预算管理',
      description: '智能分配预算，让每一分钱都花在刀刃上',
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <Space direction="vertical" size="large" align="center">
            <div className="hero-icon-wrapper">
              <RocketOutlined className="hero-icon" />
            </div>

            <Title level={1} className="hero-title">
              让 AI 成为您的
              <span className="gradient-text"> 私人旅行规划师</span>
            </Title>

            <Paragraph className="hero-description">
              只需说出您的旅行愿望，AI 将为您生成专属的旅行计划
              <br />
              包含详细行程、预算分配、景点推荐等完整方案
            </Paragraph>

            <Space size="large">
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/planner')}
                className="cta-button primary"
              >
                开始规划旅程
              </Button>
              <Button
                size="large"
                ghost
                className="cta-button secondary"
              >
                查看示例
              </Button>
            </Space>
          </Space>
        </div>

        {/* Decorative elements */}
        <div className="hero-decoration">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <Title level={2} className="section-title">
            为什么选择 AI 旅行规划师？
          </Title>

          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card className="feature-card hover-lift">
                  <div
                    className="feature-icon"
                    style={{
                      background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`,
                      color: feature.color
                    }}
                  >
                    {feature.icon}
                  </div>
                  <Title level={4} className="feature-title">
                    {feature.title}
                  </Title>
                  <Paragraph className="feature-description">
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* How it works Section */}
      <section className="how-it-works">
        <div className="container">
          <Title level={2} className="section-title">
            简单三步，开启您的旅程
          </Title>

          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} md={8}>
              <div className="step-card">
                <div className="step-number">1</div>
                <Title level={3}>描述您的需求</Title>
                <Paragraph>
                  通过语音或文字输入您的目的地、日期、预算等信息
                </Paragraph>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div className="step-card">
                <div className="step-number">2</div>
                <Title level={3}>AI 智能规划</Title>
                <Paragraph>
                  AI 分析您的需求，生成详细的旅行计划和建议
                </Paragraph>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div className="step-card">
                <div className="step-number">3</div>
                <Title level={3}>查看并调整</Title>
                <Paragraph>
                  在地图上查看行程，根据喜好调整计划细节
                </Paragraph>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <Card className="cta-card glass-effect">
          <Space direction="vertical" size="large" align="center">
            <HeartOutlined className="cta-icon" />
            <Title level={2} className="cta-title">
              准备好开始您的旅程了吗？
            </Title>
            <Paragraph className="cta-description">
              让 AI 帮您规划一次难忘的旅行体验
            </Paragraph>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/planner')}
              className="cta-button primary large"
            >
              立即开始规划
            </Button>
          </Space>
        </Card>
      </section>
    </div>
  );
};

export default HomePage;