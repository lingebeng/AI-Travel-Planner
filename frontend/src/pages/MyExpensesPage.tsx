/**
 * My Expenses Page
 * Global expense management and statistics across all itineraries
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Space,
  Button,
  List,
  Tag,
  Empty,
  message,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import { expenseService, Expense } from '../services/expenseService';
import { plannerService } from '../services/plannerService';
import './MyExpensesPage.scss';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const MyExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedItinerary, setSelectedItinerary] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  useEffect(() => {
    if (user) {
      loadItineraries();
      loadExpenses();
    }
  }, [user]);

  useEffect(() => {
    loadExpenses();
  }, [selectedItinerary, selectedCategory, dateRange]);

  const loadItineraries = async () => {
    try {
      const result = await plannerService.getItineraries();
      if (result.success) {
        setItineraries(result.data);
      }
    } catch (error: any) {
      console.error('Failed to load itineraries:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);

      const params: any = {};

      if (selectedItinerary && selectedItinerary !== 'all') {
        params.itinerary_id = selectedItinerary;
      }

      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const data = await expenseService.getExpenses(params);
      setExpenses(data);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedItinerary('all');
    setSelectedCategory('all');
    setDateRange(null);
  };

  // Calculate statistics
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expenseCount = expenses.length;

  const categoryStats = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = 0;
    }
    acc[exp.category] += exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      交通: 'purple',
      住宿: 'blue',
      餐饮: 'orange',
      景点: 'green',
      购物: 'magenta',
      其他: 'default',
    };
    return colors[category] || 'default';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      交通: '🚗',
      住宿: '🏠',
      餐饮: '🍜',
      景点: '🎫',
      购物: '🛍️',
      其他: '📦',
    };
    return icons[category] || '📦';
  };

  const getItineraryName = (itineraryId: string) => {
    const itinerary = itineraries.find((it) => it.id === itineraryId);
    return itinerary?.destination || '未知行程';
  };

  if (!user) {
    return (
      <div className="my-expenses-page">
        <div className="container" style={{ textAlign: 'center', padding: 60 }}>
          <Empty description="请先登录查看开销记录">
            <Button type="primary" onClick={() => navigate('/auth')}>
              前往登录
            </Button>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="my-expenses-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <Title level={2}>我的开销</Title>
          <Text type="secondary">管理所有行程的开销记录</Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总开销"
                value={totalSpent}
                prefix="¥"
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总笔数"
                value={expenseCount}
                suffix="笔"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="平均金额"
                value={expenseCount > 0 ? totalSpent / expenseCount : 0}
                prefix="¥"
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="行程数"
                value={Object.keys(
                  expenses.reduce((acc, exp) => {
                    acc[exp.itinerary_id] = true;
                    return acc;
                  }, {} as Record<string, boolean>)
                ).length}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        {/* Category Breakdown */}
        <Card title="分类统计" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {Object.entries(categoryStats)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <Col xs={12} sm={8} md={6} key={category}>
                  <Card size="small">
                    <Statistic
                      title={
                        <span>
                          {getCategoryIcon(category)} {category}
                        </span>
                      }
                      value={amount}
                      prefix="¥"
                      precision={2}
                      valueStyle={{ fontSize: 18 }}
                    />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {((amount / totalSpent) * 100).toFixed(1)}%
                    </div>
                  </Card>
                </Col>
              ))}
          </Row>
        </Card>

        {/* Filters */}
        <Card style={{ marginBottom: 24 }}>
          <Space wrap size="middle">
            <Select
              style={{ width: 200 }}
              value={selectedItinerary}
              onChange={setSelectedItinerary}
              placeholder="筛选行程"
            >
              <Option value="all">全部行程</Option>
              {itineraries.map((it) => (
                <Option key={it.id} value={it.id}>
                  {it.destination}
                </Option>
              ))}
            </Select>

            <Select
              style={{ width: 150 }}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="筛选类别"
            >
              <Option value="all">全部类别</Option>
              <Option value="交通">🚗 交通</Option>
              <Option value="住宿">🏠 住宿</Option>
              <Option value="餐饮">🍜 餐饮</Option>
              <Option value="景点">🎫 景点</Option>
              <Option value="购物">🛍️ 购物</Option>
              <Option value="其他">📦 其他</Option>
            </Select>

            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
              format="YYYY-MM-DD"
            />

            <Button icon={<ReloadOutlined />} onClick={resetFilters}>
              重置筛选
            </Button>
          </Space>
        </Card>

        {/* Expense List */}
        <Card title={`开销列表 (${expenses.length} 笔)`}>
          <List
            loading={loading}
            dataSource={expenses}
            locale={{
              emptyText: (
                <Empty description="没有符合条件的开销记录">
                  <Button type="link" onClick={resetFilters}>
                    重置筛选条件
                  </Button>
                </Empty>
              ),
            }}
            renderItem={(expense) => (
              <Card
                size="small"
                style={{ marginBottom: 12, cursor: 'pointer' }}
                hoverable
                onClick={() => navigate(`/itinerary/${expense.itinerary_id}`)}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space wrap>
                        <Tag color={getCategoryColor(expense.category)}>
                          {getCategoryIcon(expense.category)} {expense.category}
                        </Tag>
                        <Tag color="blue">{getItineraryName(expense.itinerary_id)}</Tag>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          <CalendarOutlined /> {dayjs(expense.expense_date).format('YYYY-MM-DD')}
                        </span>
                        {expense.voice_input && <Tag color="cyan">语音</Tag>}
                      </Space>

                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 'bold',
                          color: '#1890ff',
                        }}
                      >
                        ¥{expense.amount.toFixed(2)}
                      </div>

                      {expense.description && (
                        <div style={{ color: '#666', fontSize: 14 }}>
                          {expense.description}
                        </div>
                      )}

                      <Space size="small" wrap>
                        {expense.location && (
                          <span style={{ fontSize: 12, color: '#999' }}>
                            📍 {expense.location}
                          </span>
                        )}
                        {expense.payment_method && (
                          <span style={{ fontSize: 12, color: '#999' }}>
                            💳 {expense.payment_method}
                          </span>
                        )}
                      </Space>
                    </Space>
                  </div>
                </div>
              </Card>
            )}
          />
        </Card>
      </div>
    </div>
  );
};

export default MyExpensesPage;
