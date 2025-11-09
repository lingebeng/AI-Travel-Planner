/**
 * Expense Tracker Component
 * Main component for expense management in itinerary
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  List,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Modal,
  message,
  Empty,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ExpenseForm from './ExpenseForm';
import AIBudgetAnalysis from './AIBudgetAnalysis';
import {
  expenseService,
  Expense,
  ExpenseInput,
  ExpenseStats,
} from '../services/expenseService';

interface ExpenseTrackerProps {
  itineraryId: string;
  budget?: number;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
  itineraryId,
  budget = 0,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [analysisVisible, setAnalysisVisible] = useState(false);

  useEffect(() => {
    loadExpenses();
    loadStats();
  }, [itineraryId]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseService.getExpenses({ itinerary_id: itineraryId });
      setExpenses(data);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await expenseService.getStats(itineraryId);
      setStats(data);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleAdd = () => {
    setEditingExpense(null);
    setFormVisible(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormVisible(true);
  };

  const handleDelete = async (expenseId: string) => {
    try {
      await expenseService.deleteExpense(expenseId);
      message.success('删除成功');
      loadExpenses();
      loadStats();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSubmit = async (values: ExpenseInput) => {
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, values);
        message.success('更新成功');
      } else {
        await expenseService.addExpense(values);
        message.success('添加成功');
      }
      setFormVisible(false);
      loadExpenses();
      loadStats();
    } catch (error: any) {
      message.error(error.message || '保存失败');
    }
  };

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

  return (
    <div>
      {/* Statistics */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="总开销"
              value={stats?.total_spent || 0}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="预算"
              value={budget}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="剩余"
              value={budget - (stats?.total_spent || 0)}
              prefix="¥"
              valueStyle={{
                color:
                  budget - (stats?.total_spent || 0) >= 0 ? '#52c41a' : '#ff4d4f',
              }}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="笔数"
              value={stats?.expense_count || 0}
              suffix="笔"
            />
          </Col>
        </Row>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => setAnalysisVisible(true)}
          >
            AI 预算分析
          </Button>
        </div>
      </Card>

      {/* Add Button */}
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
          添加开销
        </Button>
      </div>

      {/* Expense List */}
      <List
        loading={loading}
        dataSource={expenses}
        locale={{
          emptyText: (
            <Empty description="还没有开销记录">
              <Button type="primary" onClick={handleAdd}>
                添加第一笔开销
              </Button>
            </Empty>
          ),
        }}
        renderItem={(expense) => (
          <Card style={{ marginBottom: 12 }} hoverable>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1 }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space>
                    <Tag color={getCategoryColor(expense.category)}>
                      {getCategoryIcon(expense.category)} {expense.category}
                    </Tag>
                    <span style={{ fontSize: 12, color: '#999' }}>
                      {dayjs(expense.expense_date).format('YYYY-MM-DD')}
                    </span>
                    {expense.voice_input && (
                      <Tag color="cyan">语音输入</Tag>
                    )}
                  </Space>

                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    ¥{expense.amount.toFixed(2)}
                  </div>

                  {expense.description && (
                    <div style={{ color: '#666' }}>{expense.description}</div>
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

              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(expense)}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定删除这条开销记录吗？"
                  onConfirm={() => handleDelete(expense.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </Card>
        )}
      />

      {/* Expense Form Modal */}
      <Modal
        title={editingExpense ? '编辑开销' : '添加开销'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <ExpenseForm
          initialValues={editingExpense || undefined}
          itineraryId={itineraryId}
          onSubmit={handleSubmit}
          onCancel={() => setFormVisible(false)}
        />
      </Modal>

      {/* AI Analysis Modal */}
      <Modal
        title="AI 预算分析"
        open={analysisVisible}
        onCancel={() => setAnalysisVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <AIBudgetAnalysis itineraryId={itineraryId} />
      </Modal>
    </div>
  );
};

export default ExpenseTracker;
