import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Card,
  Timeline,
  Tag,
  Tabs,
  Typography,
  Space,
  Button,
  Row,
  Col,
  Statistic,
  List,
  Divider,
  Tooltip,
  message,
  Spin
} from 'antd';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  CalendarOutlined,
  CarOutlined,
  HomeOutlined,
  CoffeeOutlined,
  CameraOutlined,
  ShoppingOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  EditOutlined
} from '@ant-design/icons';
import { plannerService } from '../services/plannerService';
import './ItineraryPage.scss';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

// Map loader script
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

const ItineraryPage: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const [itinerary, setItinerary] = useState<any>(location.state?.itinerary || null);
  const [loading, setLoading] = useState(!location.state?.itinerary);
  const [activeDay, setActiveDay] = useState('1');

  // Load Amap script
  useEffect(() => {
    // Configure security
    window._AMapSecurityConfig = {
      securityJsCode: 'YOUR_SECURITY_CODE', // This would come from backend
    };

    // Load map script
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=YOUR_WEB_KEY&plugin=AMap.Marker,AMap.Polyline`;
    script.async = true;
    script.onload = initializeMap;
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, []);

  // Initialize map
  const initializeMap = () => {
    if (!mapContainerRef.current || !window.AMap) return;

    const map = new window.AMap.Map(mapContainerRef.current, {
      zoom: 12,
      center: [121.473701, 31.230416], // Default to Shanghai
      mapStyle: 'amap://styles/fresh', // Fresh style
    });

    mapInstanceRef.current = map;

    // Add markers for itinerary items if available
    if (itinerary?.daily_itinerary) {
      addItineraryMarkers();
    }
  };

  // Add markers for itinerary locations
  const addItineraryMarkers = () => {
    if (!mapInstanceRef.current || !itinerary?.daily_itinerary) return;

    const map = mapInstanceRef.current;
    const markers: any[] = [];

    itinerary.daily_itinerary.forEach((day: any) => {
      day.items.forEach((item: any, index: number) => {
        // For demo, using random coordinates near Shanghai
        const lng = 121.473701 + (Math.random() - 0.5) * 0.1;
        const lat = 31.230416 + (Math.random() - 0.5) * 0.1;

        const marker = new window.AMap.Marker({
          position: [lng, lat],
          title: item.title,
          content: `<div class="map-marker day-${day.day}">${index + 1}</div>`,
        });

        marker.on('click', () => {
          message.info(`${item.title}: ${item.description}`);
        });

        markers.push(marker);
      });
    });

    map.add(markers);
  };

  // Load itinerary if not in state
  useEffect(() => {
    if (!itinerary && id && id !== 'preview') {
      loadItinerary();
    }
  }, [id]);

  const loadItinerary = async () => {
    try {
      setLoading(true);
      const result = await plannerService.getItinerary(id!);
      if (result.success) {
        setItinerary(result.data);
      }
    } catch (error) {
      message.error('Failed to load itinerary');
    } finally {
      setLoading(false);
    }
  };

  // Get icon for item type
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'attraction':
        return <CameraOutlined />;
      case 'restaurant':
        return <CoffeeOutlined />;
      case 'hotel':
        return <HomeOutlined />;
      case 'transportation':
        return <CarOutlined />;
      case 'shopping':
        return <ShoppingOutlined />;
      default:
        return <EnvironmentOutlined />;
    }
  };

  // Get color for item type
  const getItemColor = (type: string) => {
    switch (type) {
      case 'attraction':
        return '#22c55e';
      case 'restaurant':
        return '#f97316';
      case 'hotel':
        return '#0ea5e9';
      case 'transportation':
        return '#8b5cf6';
      case 'shopping':
        return '#ec4899';
      default:
        return '#71717a';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Loading itinerary..." />
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="error-container">
        <Title level={3}>No itinerary found</Title>
      </div>
    );
  }

  return (
    <div className="itinerary-page">
      <div className="itinerary-container">
        {/* Header */}
        <Card className="itinerary-header">
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} lg={16}>
              <Title level={2} className="destination-title">
                {itinerary.metadata?.destination || 'Your Trip'}
              </Title>
              <Space size="large" wrap>
                <Text>
                  <CalendarOutlined /> {itinerary.metadata?.start_date} 至 {itinerary.metadata?.end_date}
                </Text>
                <Text>
                  <TeamOutlined /> {itinerary.metadata?.people_count} 人
                </Text>
                <Text>
                  <DollarOutlined /> ¥{itinerary.metadata?.budget}
                </Text>
              </Space>
            </Col>
            <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<EditOutlined />}>编辑</Button>
                <Button icon={<ShareAltOutlined />}>分享</Button>
                <Button type="primary" icon={<DownloadOutlined />}>
                  下载PDF
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Summary */}
        {itinerary.summary && (
          <Card className="summary-card">
            <Title level={4}>行程亮点</Title>
            <Paragraph className="summary-text">{itinerary.summary}</Paragraph>
          </Card>
        )}

        {/* Budget Breakdown */}
        {itinerary.budget_breakdown && (
          <Card className="budget-card">
            <Title level={4}>预算分配</Title>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="交通"
                  value={itinerary.budget_breakdown.transportation}
                  prefix="¥"
                  valueStyle={{ color: '#0ea5e9' }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="住宿"
                  value={itinerary.budget_breakdown.accommodation}
                  prefix="¥"
                  valueStyle={{ color: '#22c55e' }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="餐饮"
                  value={itinerary.budget_breakdown.food}
                  prefix="¥"
                  valueStyle={{ color: '#f97316' }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="景点"
                  value={itinerary.budget_breakdown.attractions}
                  prefix="¥"
                  valueStyle={{ color: '#8b5cf6' }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="购物"
                  value={itinerary.budget_breakdown.shopping}
                  prefix="¥"
                  valueStyle={{ color: '#ec4899' }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="其他"
                  value={itinerary.budget_breakdown.other}
                  prefix="¥"
                  valueStyle={{ color: '#71717a' }}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* Main Content */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            {/* Daily Itinerary */}
            <Card className="itinerary-card">
              <Tabs activeKey={activeDay} onChange={setActiveDay}>
                {itinerary.daily_itinerary?.map((day: any) => (
                  <TabPane
                    tab={`第 ${day.day} 天`}
                    key={day.day.toString()}
                  >
                    <div className="day-header">
                      <Title level={4}>{day.theme}</Title>
                      <Text type="secondary">{day.date}</Text>
                    </div>

                    <Timeline mode="left">
                      {day.items?.map((item: any, index: number) => (
                        <Timeline.Item
                          key={index}
                          dot={getItemIcon(item.type)}
                          color={getItemColor(item.type)}
                        >
                          <Card className="timeline-card">
                            <div className="timeline-header">
                              <Space>
                                <Tag color={getItemColor(item.type)}>
                                  {item.type === 'attraction' ? '景点' :
                                   item.type === 'restaurant' ? '餐饮' :
                                   item.type === 'hotel' ? '住宿' :
                                   item.type === 'transportation' ? '交通' : '其他'}
                                </Tag>
                                <Text strong>{item.time}</Text>
                                <Text type="secondary">
                                  <ClockCircleOutlined /> {item.duration}
                                </Text>
                              </Space>
                            </div>

                            <Title level={5}>{item.title}</Title>
                            <Paragraph>{item.description}</Paragraph>

                            <Space direction="vertical" size="small">
                              <Text>
                                <EnvironmentOutlined /> {item.location}
                              </Text>
                              {item.estimated_cost > 0 && (
                                <Text>
                                  <DollarOutlined /> 预计费用：¥{item.estimated_cost}
                                </Text>
                              )}
                            </Space>

                            {item.tips && (
                              <div className="tips-section">
                                <Text type="secondary">
                                  💡 {item.tips}
                                </Text>
                              </div>
                            )}
                          </Card>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </TabPane>
                ))}
              </Tabs>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            {/* Map */}
            <Card className="map-card">
              <Title level={4}>地图视图</Title>
              <div ref={mapContainerRef} className="map-container" />
            </Card>

            {/* Accommodation Suggestions */}
            {itinerary.accommodation_suggestions && (
              <Card className="accommodation-card">
                <Title level={4}>住宿推荐</Title>
                <List
                  dataSource={itinerary.accommodation_suggestions}
                  renderItem={(item: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<HomeOutlined style={{ fontSize: 24, color: '#0ea5e9' }} />}
                        title={item.name}
                        description={
                          <Space direction="vertical" size="small">
                            <Text>{item.location}</Text>
                            <Text type="secondary">{item.price_range}</Text>
                            <Text>{item.features}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* Travel Tips */}
            {itinerary.travel_tips && (
              <Card className="tips-card">
                <Title level={4}>旅行贴士</Title>
                <List
                  dataSource={itinerary.travel_tips}
                  renderItem={(tip: string) => (
                    <List.Item>
                      <Text>✨ {tip}</Text>
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ItineraryPage;