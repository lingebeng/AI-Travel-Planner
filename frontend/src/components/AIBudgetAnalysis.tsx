/**
 * AI Budget Analysis Component
 * Displays AI-powered budget analysis results
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Alert,
  List,
  Tag,
  Progress,
  Row,
  Col,
  Statistic,
  Button,
  Spin,
  Empty,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { expenseService, BudgetAnalysis } from '../services/expenseService';

interface AIBudgetAnalysisProps {
  itineraryId: string;
}

const AIBudgetAnalysis: React.FC<AIBudgetAnalysisProps> = ({ itineraryId }) => {
  const [analysis, setAnalysis] = useState<BudgetAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [itineraryId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await expenseService.analyzeBudget(itineraryId);
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'AI 分析失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" tip="AI 正在分析预算数据..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="分析失败"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={loadAnalysis}>
            重试
          </Button>
        }
      />
    );
  }

  if (!analysis) {
    return <Empty description="暂无分析数据" />;
  }

  const getWarningLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      low: '#52c41a',
      medium: '#faad14',
      high: '#ff4d4f',
    };
    return colors[level] || '#1890ff';
  };

  return (
    <div>
      {/* Overspending Alert */}
      <Card
        title={
          <span>
            <WarningOutlined style={{ marginRight: 8 }} />
            超支警告
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        {analysis.overspending_alert.has_overspending ? (
          <>
            <Alert
              message={analysis.overspending_alert.message}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <List
              dataSource={analysis.overspending_alert.categories}
              renderItem={(cat) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <span>
                        <Tag color="red">{cat.category}</Tag>
                      </span>
                      <span>
                        超支 <strong style={{ color: '#ff4d4f' }}>¥{cat.overspent.toFixed(2)}</strong>
                      </span>
                    </div>
                    <Progress
                      percent={cat.percentage}
                      status={cat.percentage > 100 ? 'exception' : 'active'}
                      format={(percent) => `${percent?.toFixed(1)}%`}
                    />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      预算 ¥{cat.budget} → 实际 ¥{cat.actual}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </>
        ) : (
          <Alert
            message="预算控制良好"
            description="目前所有类别都在预算范围内，继续保持！"
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        )}
      </Card>

      {/* Saving Suggestions */}
      <Card
        title={
          <span>
            <BulbOutlined style={{ marginRight: 8 }} />
            节省建议
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <List
          dataSource={analysis.saving_suggestions}
          renderItem={(suggestion, index) => (
            <List.Item>
              <div>
                <div style={{ marginBottom: 4 }}>
                  <Tag color="green">建议 {index + 1}</Tag>
                  <Tag>{suggestion.category}</Tag>
                </div>
                <div style={{ fontSize: 14 }}>{suggestion.suggestion}</div>
                {suggestion.estimated_saving > 0 && (
                  <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
                    预计节省：¥{suggestion.estimated_saving.toFixed(2)}
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      </Card>

      {/* Optimized Budget */}
      <Card
        title="优化后的预算分配"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          {Object.entries(analysis.optimized_budget)
            .filter(([key]) => key !== 'rationale')
            .map(([category, amount]) => (
              <Col xs={12} sm={8} md={6} key={category}>
                <Statistic
                  title={category}
                  value={amount}
                  prefix="¥"
                  valueStyle={{ fontSize: 18 }}
                />
              </Col>
            ))}
        </Row>
        <Alert
          message="调整说明"
          description={analysis.optimized_budget.rationale}
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* Trend Prediction */}
      <Card
        title={
          <span>
            <LineChartOutlined style={{ marginRight: 8 }} />
            消费趋势预测
          </span>
        }
      >
        <Alert
          message={analysis.trend_prediction.message}
          type={
            analysis.trend_prediction.warning_level === 'high'
              ? 'error'
              : analysis.trend_prediction.warning_level === 'medium'
              ? 'warning'
              : 'info'
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Row gutter={[16, 16]}>
          <Col xs={12} md={8}>
            <Statistic
              title="预测总花费"
              value={analysis.trend_prediction.predicted_total}
              prefix="¥"
              valueStyle={{
                color: getWarningLevelColor(analysis.trend_prediction.warning_level),
              }}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title="预测超支"
              value={Math.abs(analysis.trend_prediction.predicted_overspending)}
              prefix={analysis.trend_prediction.predicted_overspending > 0 ? '+¥' : '¥'}
              valueStyle={{
                color: analysis.trend_prediction.predicted_overspending > 0 ? '#ff4d4f' : '#52c41a',
              }}
            />
          </Col>
          <Col xs={12} md={8}>
            <div>
              <div style={{ fontSize: 14, color: '#999', marginBottom: 4 }}>
                预警等级
              </div>
              <Tag
                color={getWarningLevelColor(analysis.trend_prediction.warning_level)}
                style={{ fontSize: 16, padding: '4px 12px' }}
              >
                {analysis.trend_prediction.warning_level === 'low'
                  ? '低风险'
                  : analysis.trend_prediction.warning_level === 'medium'
                  ? '中风险'
                  : '高风险'}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AIBudgetAnalysis;
