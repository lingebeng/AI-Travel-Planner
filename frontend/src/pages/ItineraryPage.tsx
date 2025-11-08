import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
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
  Form,
  Input,
  InputNumber,
  message,
  Spin,
  Drawer
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
  EditOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { plannerService } from '../services/plannerService';
import { generatePDF, generatePDFFromHTML } from '../services/pdfService';
import SimpleMapView from '../components/SimpleMapView';
import './ItineraryPage.scss';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const ItineraryPage: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [itinerary, setItinerary] = useState<any>(location.state?.itinerary || null);
  const [loading, setLoading] = useState(!location.state?.itinerary);
  const [activeDay, setActiveDay] = useState('1');
  const [editMode, setEditMode] = useState(false);
  const [editForm] = Form.useForm();
  const [mapDrawerVisible, setMapDrawerVisible] = useState(false);
  const itineraryRef = useRef<HTMLDivElement>(null);

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

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!itinerary) return;

    try {
      message.loading('正在生成PDF...', 0);

      // 使用HTML转PDF的方法，更好地支持中文显示
      const filename = `${itinerary.metadata?.destination}_行程计划_${new Date().toLocaleDateString()}.pdf`;
      await generatePDFFromHTML('itinerary-content', filename);

      message.destroy();
      message.success('PDF下载成功！');
    } catch (error) {
      console.error('PDF generation failed:', error);
      message.destroy();
      message.error('PDF生成失败，请重试');
    }
  };

  // Handle edit
  const handleEdit = () => {
    setEditMode(true);
    // Populate form with current values
    editForm.setFieldsValue({
      summary: itinerary.summary,
      budget: itinerary.metadata?.budget,
      // Add more fields as needed
    });
  };

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();

      // Update local state
      const updatedItinerary = {
        ...itinerary,
        summary: values.summary,
        metadata: {
          ...itinerary.metadata,
          budget: values.budget
        }
      };

      setItinerary(updatedItinerary);
      setEditMode(false);
      message.success('修改已保存');

      // TODO: Save to backend
      // await plannerService.updateItinerary(id, updatedItinerary);
    } catch (error) {
      console.error('Save failed:', error);
      message.error('保存失败');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    editForm.resetFields();
  };

  // Handle location click from timeline - 直接打开外部地图
  const handleLocationClick = (item: any) => {
    const location = item.location || item.title;
    // 打开高德地图
    const amapUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(location)}&city=&coordinate=gaode`;
    window.open(amapUrl, '_blank');
    message.success(`正在打开地图: ${location}`);
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
        <Button type="primary" onClick={() => navigate('/planner')}>
          创建新行程
        </Button>
      </div>
    );
  }

  return (
    <div className="itinerary-page">
      <div className="itinerary-container" ref={itineraryRef} id="itinerary-content">
        {/* Header */}
        <Card className="itinerary-header">
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} lg={16}>
              {editMode ? (
                <Form form={editForm} layout="vertical">
                  <Form.Item name="destination" label="目的地">
                    <Input defaultValue={itinerary.metadata?.destination} />
                  </Form.Item>
                </Form>
              ) : (
                <>
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
                </>
              )}
            </Col>
            <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
              <Space>
                {editMode ? (
                  <>
                    <Button icon={<SaveOutlined />} type="primary" onClick={handleSaveEdit}>
                      保存
                    </Button>
                    <Button icon={<CloseOutlined />} onClick={handleCancelEdit}>
                      取消
                    </Button>
                  </>
                ) : (
                  <>
                    <Button icon={<EditOutlined />} onClick={handleEdit}>
                      编辑
                    </Button>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
                      下载PDF
                    </Button>
                  </>
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Summary */}
        {itinerary.summary && (
          <Card className="summary-card">
            <Title level={4}>行程亮点</Title>
            {editMode ? (
              <Form.Item name="summary">
                <TextArea rows={3} />
              </Form.Item>
            ) : (
              <Paragraph className="summary-text">{itinerary.summary}</Paragraph>
            )}
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
                          <Card
                            className="timeline-card"
                            onClick={() => handleLocationClick(item)}
                            hoverable
                          >
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
                              <Button
                                type="link"
                                icon={<EnvironmentOutlined />}
                                onClick={() => handleLocationClick(item)}
                                style={{ padding: 0 }}
                              >
                                {item.location}
                              </Button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4}>地图视图</Title>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => setMapDrawerVisible(true)}
                >
                  全屏地图
                </Button>
              </div>
              <div style={{ height: 400, borderRadius: 12, overflow: 'hidden' }}>
                <SimpleMapView
                  itinerary={itinerary}
                  activeDay={parseInt(activeDay)}
                  onLocationClick={handleLocationClick}
                />
              </div>
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

      {/* Map Drawer */}
      <Drawer
        title="地图导航"
        placement="right"
        width="80%"
        visible={mapDrawerVisible}
        onClose={() => setMapDrawerVisible(false)}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ height: '100%' }}>
          <SimpleMapView
            itinerary={itinerary}
            activeDay={parseInt(activeDay)}
            onLocationClick={(item) => {
              message.info(`导航到：${item.title}`);
            }}
          />
        </div>
      </Drawer>
    </div>
  );
};

export default ItineraryPage;