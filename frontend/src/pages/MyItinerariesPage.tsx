import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Empty, Spin, Tag, message, Popconfirm } from 'antd';
import { CalendarOutlined, UserOutlined, DollarOutlined, EnvironmentOutlined, DeleteOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import './MyItinerariesPage.scss';

const { Title, Text, Paragraph } = Typography;

interface Itinerary {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  people_count: number;
  preferences: any;
  ai_response: any;
  created_at: string;
}

const MyItinerariesPage: React.FC = () => {
  const navigate = useNavigate();
  const { getAccessToken } = useAuth();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItineraries = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch('http://localhost:5000/api/itinerary/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setItineraries(data.data);
      } else {
        message.error(data.error || '获取行程列表失败');
      }
    } catch (error) {
      console.error('Failed to fetch itineraries:', error);
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItineraries();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`http://localhost:5000/api/itinerary/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        message.success('删除成功');
        // 刷新列表
        fetchItineraries();
      } else {
        message.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete itinerary:', error);
      message.error('网络错误，请重试');
    }
  };

  const handleView = (id: string) => {
    navigate(`/itinerary/${id}`);
  };

  const handleEdit = (itinerary: Itinerary) => {
    // 跳转到行程页面，并传递行程数据
    navigate(`/itinerary/${itinerary.id}`, {
      state: { itinerary: itinerary.ai_response }
    });
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    return end.diff(start, 'day') + 1;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="my-itineraries-page">
      <div className="page-header">
        <Title level={2}>我的行程</Title>
        <Text type="secondary">查看和管理您保存的旅行计划</Text>
      </div>

      {itineraries.length === 0 ? (
        <Empty
          description="还没有保存的行程"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate('/planner')}>
            创建新行程
          </Button>
        </Empty>
      ) : (
        <Row gutter={[24, 24]}>
          {itineraries.map((itinerary) => (
            <Col xs={24} sm={12} lg={8} key={itinerary.id}>
              <Card
                hoverable
                className="itinerary-card"
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleView(itinerary.id)}
                  >
                    查看详情
                  </Button>,
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(itinerary)}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    title="确认删除"
                    description="确定要删除这个行程吗？"
                    onConfirm={() => handleDelete(itinerary.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <div className="card-header">
                  <div className="destination">
                    <EnvironmentOutlined />
                    <Text strong>{itinerary.destination}</Text>
                  </div>
                  <Tag color="blue">
                    {calculateDays(itinerary.start_date, itinerary.end_date)} 天
                  </Tag>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <CalendarOutlined />
                    <Text>
                      {dayjs(itinerary.start_date).format('YYYY-MM-DD')} 至{' '}
                      {dayjs(itinerary.end_date).format('YYYY-MM-DD')}
                    </Text>
                  </div>

                  <div className="info-row">
                    <UserOutlined />
                    <Text>{itinerary.people_count} 人</Text>
                  </div>

                  <div className="info-row">
                    <DollarOutlined />
                    <Text>预算 ¥{itinerary.budget?.toLocaleString() || '未设置'}</Text>
                  </div>

                  {itinerary.preferences && (
                    <div className="preferences">
                      <Paragraph ellipsis={{ rows: 2 }}>
                        {Object.entries(itinerary.preferences)
                          .filter(([_, value]) => value)
                          .map(([key, _]) => {
                            const labels: Record<string, string> = {
                              cultural: '文化体验',
                              food: '美食探索',
                              nature: '自然风光',
                              shopping: '购物',
                              nightlife: '夜生活',
                              relaxation: '休闲放松',
                            };
                            return labels[key];
                          })
                          .filter(Boolean)
                          .join('、')}
                      </Paragraph>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    创建于 {dayjs(itinerary.created_at).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default MyItinerariesPage;
