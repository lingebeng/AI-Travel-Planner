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
  Drawer,
  Modal
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
  CloseOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { plannerService } from '../services/plannerService';
import { generatePDF, generatePDFFromHTML } from '../services/pdfService';
import { API_ENDPOINTS } from '../config/api';
import SimpleMapView from '../components/SimpleMapView';
import './ItineraryPage.scss';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const ItineraryPage: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, getAccessToken } = useAuth();

  const [itinerary, setItinerary] = useState<any>(location.state?.itinerary || null);
  const [loading, setLoading] = useState(!location.state?.itinerary);
  const [activeDay, setActiveDay] = useState('1');
  const [editMode, setEditMode] = useState(false);
  const [advancedEditMode, setAdvancedEditMode] = useState(false); // 高级编辑模式
  const [editForm] = Form.useForm();
  const [jsonEditValue, setJsonEditValue] = useState(''); // JSON 编辑器的值
  const [mapDrawerVisible, setMapDrawerVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // 是否已保存到云端
  const [saveLoading, setSaveLoading] = useState(false);
  const itineraryRef = useRef<HTMLDivElement>(null);

  // Load itinerary if not in state
  useEffect(() => {
    if (!itinerary && id && id !== 'preview') {
      loadItinerary();
    } else if (id && id !== 'preview') {
      setIsSaved(true); // 如果有ID且不是preview，说明已保存
    }
  }, [id]);

  const loadItinerary = async () => {
    try {
      setLoading(true);
      const result = await plannerService.getItinerary(id!);
      if (result.success && result.data) {
        // 数据库返回的数据结构：{ id, destination, budget, ai_response: {...} }
        // 我们需要使用 ai_response 作为行程数据，但要合并基本信息
        const dbData = result.data;

        // 如果有 ai_response，使用它；否则构建基本结构
        let itineraryData;
        if (dbData.ai_response && typeof dbData.ai_response === 'object') {
          // 使用 ai_response 作为基础，但确保 metadata 是最新的
          itineraryData = {
            ...dbData.ai_response,
            metadata: {
              ...dbData.ai_response.metadata,
              destination: dbData.destination,
              start_date: dbData.start_date,
              end_date: dbData.end_date,
              budget: dbData.budget,
              people_count: dbData.people_count,
              preferences: dbData.preferences,
            }
          };
        } else {
          // 如果没有 ai_response，构建基本结构
          itineraryData = {
            metadata: {
              destination: dbData.destination,
              start_date: dbData.start_date,
              end_date: dbData.end_date,
              budget: dbData.budget,
              people_count: dbData.people_count,
              preferences: dbData.preferences,
            },
            summary: '',
            daily_itinerary: [],
            budget_breakdown: null,
          };
        }

        setItinerary(itineraryData);
        setIsSaved(true);
      } else {
        message.error('行程不存在');
        navigate('/my-itineraries');
      }
    } catch (error) {
      console.error('Failed to load itinerary:', error);
      message.error('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 保存到云端
  const handleSaveToCloud = async () => {
    if (!user) {
      Modal.confirm({
        title: '需要登录',
        content: '保存行程需要先登录账号，是否前往登录？',
        onOk: () => navigate('/auth', { state: { from: location } }),
      });
      return;
    }

    try {
      setSaveLoading(true);
      const token = await getAccessToken();

      const response = await fetch(API_ENDPOINTS.ITINERARY_SAVE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          destination: itinerary.metadata?.destination,
          start_date: itinerary.metadata?.start_date,
          end_date: itinerary.metadata?.end_date,
          budget: itinerary.metadata?.budget,
          people_count: itinerary.metadata?.people_count,
          preferences: itinerary.metadata?.preferences || {},
          ai_response: itinerary,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('行程已保存到云端！');
        setIsSaved(true);
        // 更新URL为真实ID
        navigate(`/itinerary/${data.data.id}`, { replace: true, state: { itinerary } });
      } else {
        message.error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save failed:', error);
      message.error('保存失败，请重试');
    } finally {
      setSaveLoading(false);
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
    setAdvancedEditMode(false);
    // Populate form with current values
    editForm.setFieldsValue({
      destination: itinerary.metadata?.destination,
      start_date: itinerary.metadata?.start_date,
      end_date: itinerary.metadata?.end_date,
      people_count: itinerary.metadata?.people_count,
      budget: itinerary.metadata?.budget,
      summary: itinerary.summary,
    });
  };

  // 高级编辑模式 - 直接编辑 JSON
  const handleAdvancedEdit = () => {
    setEditMode(true);
    setAdvancedEditMode(true);
    // 将当前行程数据转换为格式化的 JSON 字符串
    setJsonEditValue(JSON.stringify(itinerary, null, 2));
  };

  const handleSaveEdit = async () => {
    try {
      let updatedItinerary;

      if (advancedEditMode) {
        // 高级编辑模式：解析 JSON
        try {
          updatedItinerary = JSON.parse(jsonEditValue);
          // 验证基本结构
          if (!updatedItinerary.metadata) {
            throw new Error('缺少 metadata 字段');
          }
        } catch (parseError: any) {
          message.error(`JSON 格式错误: ${parseError.message}`);
          return;
        }
      } else {
        // 简单编辑模式：从表单获取值
        const values = await editForm.validateFields();

        // Update local state with all edited fields
        updatedItinerary = {
          ...itinerary,
          summary: values.summary,
          metadata: {
            ...itinerary.metadata,
            destination: values.destination,
            start_date: values.start_date,
            end_date: values.end_date,
            people_count: values.people_count,
            budget: values.budget,
          }
        };
      }

      setItinerary(updatedItinerary);
      setEditMode(false);
      setAdvancedEditMode(false);

      // 如果已保存到云端，则更新云端数据
      if (isSaved && id && id !== 'preview' && user) {
        try {
          const token = await getAccessToken();
          const response = await fetch(API_ENDPOINTS.ITINERARY_UPDATE(id), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              destination: updatedItinerary.metadata?.destination,
              start_date: updatedItinerary.metadata?.start_date,
              end_date: updatedItinerary.metadata?.end_date,
              people_count: updatedItinerary.metadata?.people_count,
              budget: updatedItinerary.metadata?.budget,
              ai_response: updatedItinerary,
            }),
          });

          const data = await response.json();
          if (data.success) {
            message.success('修改已保存到云端');
          } else {
            message.warning('本地修改已保存，但云端同步失败');
          }
        } catch (error) {
          console.error('Failed to sync to cloud:', error);
          message.warning('本地修改已保存，但云端同步失败');
        }
      } else {
        message.success('修改已保存');
      }
    } catch (error) {
      console.error('Save failed:', error);
      message.error('保存失败');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setAdvancedEditMode(false);
    editForm.resetFields();
    setJsonEditValue('');
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
          {editMode ? (
            advancedEditMode ? (
              // 高级编辑模式：JSON 编辑器
              <div>
                <Title level={4}>高级编辑 - 直接编辑 JSON 数据</Title>
                <Paragraph type="secondary">
                  直接编辑完整的行程数据（JSON 格式）。请确保格式正确，否则可能导致数据丢失。
                </Paragraph>
                <TextArea
                  value={jsonEditValue}
                  onChange={(e) => setJsonEditValue(e.target.value)}
                  rows={25}
                  style={{
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                    fontSize: '13px',
                    backgroundColor: '#f5f5f5',
                  }}
                  placeholder="在此编辑 JSON 数据..."
                />
                <div style={{ marginTop: 16 }}>
                  <Space>
                    <Button icon={<SaveOutlined />} type="primary" onClick={handleSaveEdit} size="large">
                      保存修改
                    </Button>
                    <Button icon={<CloseOutlined />} onClick={handleCancelEdit} size="large">
                      取消
                    </Button>
                    <Button
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(jsonEditValue);
                          setJsonEditValue(JSON.stringify(parsed, null, 2));
                          message.success('JSON 格式化成功');
                        } catch (e: any) {
                          message.error(`JSON 格式错误: ${e.message}`);
                        }
                      }}
                    >
                      格式化 JSON
                    </Button>
                    <Button
                      onClick={() => {
                        setAdvancedEditMode(false);
                      }}
                    >
                      切换到简单编辑
                    </Button>
                  </Space>
                </div>
              </div>
            ) : (
              // 简单编辑模式：表单编辑
              <Form form={editForm} layout="vertical">
                <Row gutter={[24, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="destination"
                      label="目的地"
                      rules={[{ required: true, message: '请输入目的地' }]}
                    >
                      <Input size="large" placeholder="例如：杭州" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="budget"
                      label="预算（元）"
                      rules={[{ required: true, message: '请输入预算' }]}
                    >
                      <InputNumber
                        size="large"
                        style={{ width: '100%' }}
                        min={0}
                        formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="start_date"
                      label="开始日期"
                      rules={[{ required: true, message: '请输入开始日期' }]}
                    >
                      <Input size="large" type="date" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="end_date"
                      label="结束日期"
                      rules={[{ required: true, message: '请输入结束日期' }]}
                    >
                      <Input size="large" type="date" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="people_count"
                      label="出行人数"
                      rules={[{ required: true, message: '请输入出行人数' }]}
                    >
                      <InputNumber size="large" style={{ width: '100%' }} min={1} max={20} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="summary" label="行程亮点">
                      <TextArea rows={4} placeholder="简要描述行程的精彩之处..." />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Space>
                      <Button icon={<SaveOutlined />} type="primary" onClick={handleSaveEdit} size="large">
                        保存修改
                      </Button>
                      <Button icon={<CloseOutlined />} onClick={handleCancelEdit} size="large">
                        取消
                      </Button>
                      <Button
                        onClick={() => {
                          setAdvancedEditMode(true);
                          setJsonEditValue(JSON.stringify(itinerary, null, 2));
                        }}
                      >
                        切换到高级编辑
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Form>
            )
          ) : (
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
                    <DollarOutlined /> ¥{itinerary.metadata?.budget?.toLocaleString()}
                  </Text>
                </Space>
              </Col>
              <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
                <Space wrap>
                  {!isSaved && (
                    <Button
                      icon={<CloudUploadOutlined />}
                      type="primary"
                      onClick={handleSaveToCloud}
                      loading={saveLoading}
                    >
                      保存到云端
                    </Button>
                  )}
                  <Button icon={<EditOutlined />} onClick={handleEdit}>
                    简单编辑
                  </Button>
                  <Button onClick={handleAdvancedEdit}>
                    高级编辑
                  </Button>
                  <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
                    下载PDF
                  </Button>
                </Space>
              </Col>
            </Row>
          )}
        </Card>

        {/* Summary */}
        {!editMode && itinerary.summary && (
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