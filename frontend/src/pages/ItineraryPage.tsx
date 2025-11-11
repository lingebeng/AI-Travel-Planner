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
  Modal,
  Popconfirm
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
  CloudUploadOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { plannerService } from '../services/plannerService';
import { generatePDFFromHTML } from '../services/pdfService';
import { API_ENDPOINTS } from '../config/api';
import SimpleMapView from '../components/SimpleMapView';
import HorizontalTimeline from '../components/HorizontalTimeline';
import ExpenseTracker from '../components/ExpenseTracker';
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
  const [mapDrawerVisible, setMapDrawerVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // 是否已保存到云端
  const [saveLoading, setSaveLoading] = useState(false);
  const itineraryRef = useRef<HTMLDivElement>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<{dayIndex: number, itemIndex: number} | null>(null);
  const [itemEditForm] = Form.useForm();
  const [addingNewItem, setAddingNewItem] = useState<number | null>(null); // 当前正在添加新行程项的day index
  const [newItemForm] = Form.useForm();

  // 模块化编辑的状态
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [editingTravelTips, setEditingTravelTips] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState(false);
  const [editingDayTheme, setEditingDayTheme] = useState<number | null>(null);

  const [summaryForm] = Form.useForm();
  const [budgetForm] = Form.useForm();
  const [metadataForm] = Form.useForm();
  const [travelTipsForm] = Form.useForm();
  const [accommodationForm] = Form.useForm();
  const [dayThemeForm] = Form.useForm();

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

  // 同步更新到云端的通用函数
  const syncToCloud = async (updatedItinerary: any) => {
    if (isSaved && id && id !== 'preview' && user) {
      try {
        const token = await getAccessToken();
        await fetch(API_ENDPOINTS.ITINERARY_UPDATE(id), {
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
      } catch (error) {
        console.error('Failed to sync to cloud:', error);
      }
    }
  };

  // 编辑元数据
  const handleEditMetadata = () => {
    setEditingMetadata(true);
    metadataForm.setFieldsValue({
      destination: itinerary.metadata?.destination,
      start_date: itinerary.metadata?.start_date,
      end_date: itinerary.metadata?.end_date,
      budget: itinerary.metadata?.budget,
      people_count: itinerary.metadata?.people_count,
    });
  };

  const handleSaveMetadata = async () => {
    try {
      const values = await metadataForm.validateFields();
      const updatedItinerary = {
        ...itinerary,
        metadata: {
          ...itinerary.metadata,
          ...values,
        }
      };
      setItinerary(updatedItinerary);
      setEditingMetadata(false);
      message.success('修改已保存');
      await syncToCloud(updatedItinerary);
    } catch (error) {
      console.error('Save metadata failed:', error);
    }
  };

  // 编辑摘要
  const handleEditSummary = () => {
    setEditingSummary(true);
    summaryForm.setFieldsValue({ summary: itinerary.summary });
  };

  const handleSaveSummary = async () => {
    try {
      const values = await summaryForm.validateFields();
      const updatedItinerary = { ...itinerary, summary: values.summary };
      setItinerary(updatedItinerary);
      setEditingSummary(false);
      message.success('修改已保存');
      await syncToCloud(updatedItinerary);
    } catch (error) {
      console.error('Save summary failed:', error);
    }
  };

  // 编辑预算
  const handleEditBudget = () => {
    setEditingBudget(true);
    budgetForm.setFieldsValue(itinerary.budget_breakdown || {});
  };

  const handleSaveBudget = async () => {
    try {
      const values = await budgetForm.validateFields();
      const updatedItinerary = { ...itinerary, budget_breakdown: values };
      setItinerary(updatedItinerary);
      setEditingBudget(false);
      message.success('修改已保存');
      await syncToCloud(updatedItinerary);
    } catch (error) {
      console.error('Save budget failed:', error);
    }
  };

  // 编辑旅行贴士
  const handleEditTravelTips = () => {
    setEditingTravelTips(true);
    travelTipsForm.setFieldsValue({
      travel_tips: itinerary.travel_tips?.join('\n') || ''
    });
  };

  const handleSaveTravelTips = async () => {
    try {
      const values = await travelTipsForm.validateFields();
      const tipsArray = values.travel_tips.split('\n').filter((tip: string) => tip.trim());
      const updatedItinerary = { ...itinerary, travel_tips: tipsArray };
      setItinerary(updatedItinerary);
      setEditingTravelTips(false);
      message.success('修改已保存');
      await syncToCloud(updatedItinerary);
    } catch (error) {
      console.error('Save travel tips failed:', error);
    }
  };

  // 编辑每日主题
  const handleEditDayTheme = (dayIndex: number) => {
    setEditingDayTheme(dayIndex);
    const day = itinerary.daily_itinerary[dayIndex];
    dayThemeForm.setFieldsValue({
      theme: day.theme,
      date: day.date,
    });
  };

  const handleSaveDayTheme = async () => {
    try {
      const values = await dayThemeForm.validateFields();
      if (editingDayTheme === null) return;

      const updatedItinerary = { ...itinerary };
      updatedItinerary.daily_itinerary[editingDayTheme] = {
        ...updatedItinerary.daily_itinerary[editingDayTheme],
        ...values,
      };

      setItinerary(updatedItinerary);
      setEditingDayTheme(null);
      message.success('修改已保存');
      await syncToCloud(updatedItinerary);
    } catch (error) {
      console.error('Save day theme failed:', error);
    }
  };

  // 编辑住宿推荐
  const handleEditAccommodation = () => {
    setEditingAccommodation(true);
    // 将住宿推荐数组转换为表单格式
    const accommodations = itinerary.accommodation_suggestions || [];
    accommodationForm.setFieldsValue({
      accommodations: accommodations.map((acc: any) => ({
        name: acc.name,
        location: acc.location,
        price_range: acc.price_range,
        features: acc.features,
      }))
    });
  };

  const handleSaveAccommodation = async () => {
    try {
      const values = await accommodationForm.validateFields();
      const updatedItinerary = {
        ...itinerary,
        accommodation_suggestions: values.accommodations.filter((acc: any) => acc && acc.name)
      };
      setItinerary(updatedItinerary);
      setEditingAccommodation(false);
      message.success('修改已保存');
      await syncToCloud(updatedItinerary);
    } catch (error) {
      console.error('Save accommodation failed:', error);
    }
  };

  // 编辑单个行程项
  const handleEditItem = (dayIndex: number, itemIndex: number) => {
    const item = itinerary.daily_itinerary[dayIndex].items[itemIndex];
    setEditingItemIndex({ dayIndex, itemIndex });
    itemEditForm.setFieldsValue({
      time: item.time,
      duration: item.duration,
      type: item.type,
      title: item.title,
      description: item.description,
      location: item.location,
      estimated_cost: item.estimated_cost,
      tips: item.tips,
    });
  };

  // 保存行程项编辑
  const handleSaveItem = async () => {
    try {
      const values = await itemEditForm.validateFields();
      if (!editingItemIndex) return;

      const { dayIndex, itemIndex } = editingItemIndex;
      const updatedItinerary = { ...itinerary };
      updatedItinerary.daily_itinerary[dayIndex].items[itemIndex] = {
        ...updatedItinerary.daily_itinerary[dayIndex].items[itemIndex],
        ...values,
      };

      setItinerary(updatedItinerary);
      setEditingItemIndex(null);
      itemEditForm.resetFields();
      message.success('修改已保存');
      await syncToCloud(updatedItinerary);
    } catch (error) {
      console.error('Save item failed:', error);
    }
  };

  // 取消编辑行程项
  const handleCancelItemEdit = () => {
    setEditingItemIndex(null);
    itemEditForm.resetFields();
  };

  // 新建行程项
  const handleAddNewItem = (dayIndex: number) => {
    setAddingNewItem(dayIndex);
    newItemForm.resetFields();
    // 设置默认值
    newItemForm.setFieldsValue({
      time: '09:00',
      duration: '1小时',
      type: 'attraction',
      estimated_cost: 0,
    });
  };

  const handleSaveNewItem = async () => {
    try {
      const values = await newItemForm.validateFields();
      if (addingNewItem === null) return;

      const updatedItinerary = { ...itinerary };
      const newItem = {
        time: values.time,
        duration: values.duration,
        type: values.type,
        title: values.title,
        description: values.description || '',
        location: values.location,
        estimated_cost: values.estimated_cost || 0,
        tips: values.tips || '',
      };

      // 添加到当前天的行程项数组
      if (!updatedItinerary.daily_itinerary[addingNewItem].items) {
        updatedItinerary.daily_itinerary[addingNewItem].items = [];
      }
      updatedItinerary.daily_itinerary[addingNewItem].items.push(newItem);

      setItinerary(updatedItinerary);
      setAddingNewItem(null);
      newItemForm.resetFields();
      message.success('行程项已添加');
      await syncToCloud(updatedItinerary);
    } catch (error) {
      console.error('Add new item failed:', error);
    }
  };

  const handleCancelAddNewItem = () => {
    setAddingNewItem(null);
    newItemForm.resetFields();
  };

  // 删除行程项
  const handleDeleteItem = async (dayIndex: number, itemIndex: number) => {
    try {
      const updatedItinerary = { ...itinerary };
      // 从数组中移除该项
      updatedItinerary.daily_itinerary[dayIndex].items.splice(itemIndex, 1);

      setItinerary(updatedItinerary);
      message.success('行程项已删除');
      await syncToCloud(updatedItinerary);
    } catch (error) {
      console.error('Delete item failed:', error);
      message.error('删除失败');
    }
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
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEditMetadata}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    color: 'white',
                    fontWeight: 500,
                    height: '36px',
                    padding: '0 20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  编辑基本信息
                </Button>
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
                  下载PDF
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Summary */}
        {itinerary.summary && (
          <Card className="summary-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>行程亮点</Title>
              <Button icon={<EditOutlined />} size="small" onClick={handleEditSummary}>
                编辑
              </Button>
            </div>
            <Paragraph className="summary-text">{itinerary.summary}</Paragraph>
          </Card>
        )}

        {/* Budget Breakdown */}
        {itinerary.budget_breakdown && (
          <Card className="budget-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>预算分配</Title>
              <Button icon={<EditOutlined />} size="small" onClick={handleEditBudget}>
                编辑
              </Button>
            </div>
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
          <Col xs={24}>
            {/* Daily Itinerary Tabs */}
            <Card className="itinerary-card">
              <Tabs activeKey={activeDay} onChange={setActiveDay}>
                {itinerary.daily_itinerary?.map((day: any) => (
                  <TabPane
                    tab={`第 ${day.day} 天`}
                    key={day.day.toString()}
                  >
                    <div className="day-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Title level={4}>{day.theme}</Title>
                        <Text type="secondary">{day.date}</Text>
                      </div>
                      <Button icon={<EditOutlined />} size="small" onClick={() => handleEditDayTheme(day.day - 1)}>
                        编辑主题
                      </Button>
                    </div>

                    {/* 横版时间轴 - 顶部全宽显示 */}
                    <div style={{ marginBottom: 24 }}>
                      <HorizontalTimeline
                        items={day.items || []}
                        onLocationClick={handleLocationClick}
                      />
                    </div>

                    {/* 第二排：左侧竖版Timeline + 右侧地图等 */}
                    <Row gutter={[24, 24]}>
                      {/* 左侧：竖版 Timeline */}
                      <Col xs={24} lg={14}>
                        <Timeline mode="left">
                          {day.items?.map((item: any, itemIndex: number) => {
                            const dayIndex = day.day - 1;
                            const isEditing = editingItemIndex?.dayIndex === dayIndex && editingItemIndex?.itemIndex === itemIndex;

                            return (
                              <Timeline.Item
                                key={itemIndex}
                                dot={getItemIcon(item.type)}
                                color={getItemColor(item.type)}
                              >
                                {isEditing ? (
                                  <Card className="timeline-card-edit">
                                    <Form form={itemEditForm} layout="vertical">
                                      <Row gutter={16}>
                                        <Col span={12}>
                                          <Form.Item name="time" label="时间" rules={[{ required: true }]}>
                                            <Input />
                                          </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                          <Form.Item name="duration" label="时长" rules={[{ required: true }]}>
                                            <Input />
                                          </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                                            <Input />
                                          </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                          <Form.Item name="estimated_cost" label="费用">
                                            <InputNumber style={{ width: '100%' }} />
                                          </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
                                            <Input />
                                          </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                          <Form.Item name="description" label="描述">
                                            <TextArea rows={3} />
                                          </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                          <Form.Item name="location" label="位置" rules={[{ required: true }]}>
                                            <Input />
                                          </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                          <Form.Item name="tips" label="贴士">
                                            <Input />
                                          </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                          <Space>
                                            <Button type="primary" onClick={handleSaveItem}>保存</Button>
                                            <Button onClick={handleCancelItemEdit}>取消</Button>
                                          </Space>
                                        </Col>
                                      </Row>
                                    </Form>
                                  </Card>
                                ) : (
                                  <Card
                                    className="timeline-card"
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
                                      <Space>
                                        <Button
                                          size="small"
                                          icon={<EditOutlined />}
                                          onClick={() => handleEditItem(dayIndex, itemIndex)}
                                        >
                                          编辑
                                        </Button>
                                        <Popconfirm
                                          title="确认删除"
                                          description="确定要删除这个行程项吗？"
                                          onConfirm={() => handleDeleteItem(dayIndex, itemIndex)}
                                          okText="确定"
                                          cancelText="取消"
                                        >
                                          <Button
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                          >
                                            删除
                                          </Button>
                                        </Popconfirm>
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
                                )}
                              </Timeline.Item>
                            );
                          })}
                        </Timeline>

                        {/* 添加新行程项按钮 */}
                        <Button
                          type="dashed"
                          block
                          icon={<PlusOutlined />}
                          onClick={() => handleAddNewItem(day.day - 1)}
                          style={{ marginTop: 16 }}
                        >
                          添加新行程项
                        </Button>
                      </Col>

                      {/* 右侧：地图、住宿、贴士 */}
                      <Col xs={24} lg={10}>
                        {/* 地图 */}
                        <Card className="map-card" style={{ marginBottom: 24 }}>
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
                          <div style={{ borderRadius: 12 }}>
                            <SimpleMapView
                              itinerary={itinerary}
                              activeDay={parseInt(activeDay)}
                              onLocationClick={handleLocationClick}
                            />
                          </div>
                        </Card>

                        {/* 住宿推荐 */}
                        {itinerary.accommodation_suggestions && (
                          <Card className="accommodation-card" style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                              <Title level={4} style={{ margin: 0 }}>住宿推荐</Title>
                              <Button icon={<EditOutlined />} size="small" onClick={handleEditAccommodation}>
                                编辑
                              </Button>
                            </div>
                            <List
                              dataSource={itinerary.accommodation_suggestions}
                              renderItem={(item: any) => (
                                <List.Item>
                                  <List.Item.Meta
                                    avatar={<HomeOutlined style={{ fontSize: 24, color: '#0ea5e9' }} />}
                                    title={item.name}
                                    description={
                                      <Space direction="vertical" size="small">
                                        <Button
                                          type="link"
                                          icon={<EnvironmentOutlined />}
                                          onClick={() => {
                                            const amapUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(item.location || item.name)}&city=&coordinate=gaode`;
                                            window.open(amapUrl, '_blank');
                                          }}
                                          style={{ padding: 0 }}
                                        >
                                          {item.location}
                                        </Button>
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

                        {/* 旅行贴士 */}
                        {itinerary.travel_tips && (
                          <Card className="tips-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                              <Title level={4} style={{ margin: 0 }}>旅行贴士</Title>
                              <Button icon={<EditOutlined />} size="small" onClick={handleEditTravelTips}>
                                编辑
                              </Button>
                            </div>
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
                  </TabPane>
                ))}

                {/* Expense Tracker Tab */}
                <TabPane tab="开销记录" key="expenses">
                  <ExpenseTracker
                    itineraryId={id!}
                    budget={itinerary.metadata?.budget}
                  />
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 编辑元数据 Modal */}
      <Modal
        title="编辑基本信息"
        open={editingMetadata}
        onOk={handleSaveMetadata}
        onCancel={() => setEditingMetadata(false)}
        width={600}
      >
        <Form form={metadataForm} layout="vertical">
          <Form.Item name="destination" label="目的地" rules={[{ required: true, message: '请输入目的地' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="start_date" label="开始日期" rules={[{ required: true, message: '请输入开始日期' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="end_date" label="结束日期" rules={[{ required: true, message: '请输入结束日期' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="budget" label="预算" rules={[{ required: true, message: '请输入预算' }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="people_count" label="人数" rules={[{ required: true, message: '请输入人数' }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑摘要 Modal */}
      <Modal
        title="编辑行程亮点"
        open={editingSummary}
        onOk={handleSaveSummary}
        onCancel={() => setEditingSummary(false)}
        width={700}
      >
        <Form form={summaryForm} layout="vertical">
          <Form.Item name="summary" label="行程亮点" rules={[{ required: true, message: '请输入行程亮点' }]}>
            <TextArea rows={6} placeholder="描述这次旅行的精彩亮点..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑预算 Modal */}
      <Modal
        title="编辑预算分配"
        open={editingBudget}
        onOk={handleSaveBudget}
        onCancel={() => setEditingBudget(false)}
        width={600}
      >
        <Form form={budgetForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="transportation" label="交通" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accommodation" label="住宿" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="food" label="餐饮" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="attractions" label="景点" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shopping" label="购物" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="other" label="其他" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 编辑旅行贴士 Modal */}
      <Modal
        title="编辑旅行贴士"
        open={editingTravelTips}
        onOk={handleSaveTravelTips}
        onCancel={() => setEditingTravelTips(false)}
        width={700}
      >
        <Form form={travelTipsForm} layout="vertical">
          <Form.Item
            name="travel_tips"
            label="旅行贴士（每行一条）"
            rules={[{ required: true, message: '请输入旅行贴士' }]}
          >
            <TextArea rows={10} placeholder="每行输入一条旅行贴士..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑每日主题 Modal */}
      <Modal
        title="编辑每日主题"
        open={editingDayTheme !== null}
        onOk={handleSaveDayTheme}
        onCancel={() => setEditingDayTheme(null)}
        width={600}
      >
        <Form form={dayThemeForm} layout="vertical">
          <Form.Item name="theme" label="主题" rules={[{ required: true, message: '请输入主题' }]}>
            <Input placeholder="例如：探索古城" />
          </Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请输入日期' }]}>
            <Input placeholder="例如：2024-01-01" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑住宿推荐 Modal */}
      <Modal
        title="编辑住宿推荐"
        open={editingAccommodation}
        onOk={handleSaveAccommodation}
        onCancel={() => setEditingAccommodation(false)}
        width={800}
      >
        <Form form={accommodationForm} layout="vertical">
          <Form.List name="accommodations">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card key={field.key} style={{ marginBottom: 16 }} size="small">
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'name']}
                          label="酒店名称"
                          rules={[{ required: true, message: '请输入酒店名称' }]}
                        >
                          <Input placeholder="例如：XX酒店" />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'location']}
                          label="位置"
                          rules={[{ required: true, message: '请输入位置' }]}
                        >
                          <Input placeholder="例如：市中心/景区附近" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'price_range']}
                          label="价格区间"
                          rules={[{ required: true, message: '请输入价格区间' }]}
                        >
                          <Input placeholder="例如：¥300-500/晚" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'features']}
                          label="特色"
                        >
                          <Input placeholder="例如：免费早餐、游泳池" />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Button danger onClick={() => remove(field.name)}>
                          删除此住宿
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  + 添加住宿推荐
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 新建行程项 Modal */}
      <Modal
        title="添加新行程项"
        open={addingNewItem !== null}
        onOk={handleSaveNewItem}
        onCancel={handleCancelAddNewItem}
        width={700}
      >
        <Form form={newItemForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="time" label="时间" rules={[{ required: true, message: '请输入时间' }]}>
                <Input placeholder="例如：09:00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration" label="时长" rules={[{ required: true, message: '请输入时长' }]}>
                <Input placeholder="例如：2小时" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Input placeholder="attraction/restaurant/hotel/transportation/shopping" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="estimated_cost" label="预计费用">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="例如：西湖断桥" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="描述">
                <TextArea rows={3} placeholder="详细描述这个行程项..." />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="location" label="位置" rules={[{ required: true, message: '请输入位置' }]}>
                <Input placeholder="例如：杭州市西湖区北山街" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="tips" label="贴士">
                <Input placeholder="旅行小贴士..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

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