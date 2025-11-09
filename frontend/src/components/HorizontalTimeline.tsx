import React from 'react';
import { Card, Tag, Typography } from 'antd';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CameraOutlined,
  CoffeeOutlined,
  HomeOutlined,
  CarOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import './HorizontalTimeline.scss';

const { Text, Paragraph } = Typography;

interface TimelineItem {
  time: string;
  duration: string;
  type: string;
  title: string;
  description: string;
  location: string;
  estimated_cost: number;
  tips?: string;
}

interface HorizontalTimelineProps {
  items: TimelineItem[];
  onLocationClick: (item: TimelineItem) => void;
}

const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({ items, onLocationClick }) => {
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

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'attraction':
        return '景点';
      case 'restaurant':
        return '餐饮';
      case 'hotel':
        return '住宿';
      case 'transportation':
        return '交通';
      case 'shopping':
        return '购物';
      default:
        return '其他';
    }
  };

  return (
    <div className="horizontal-timeline">
      <div className="timeline-container">
        {items.map((item, index) => (
          <div key={index} className="timeline-item-wrapper">
            {/* 时间点 */}
            <div className="timeline-node">
              <div
                className="node-circle"
                style={{ backgroundColor: getItemColor(item.type) }}
              >
                {getItemIcon(item.type)}
              </div>
              <div className="time-label">{item.time}</div>
            </div>

            {/* 连接线 */}
            {index < items.length - 1 && (
              <div className="timeline-line">
                <div className="line" style={{ borderColor: getItemColor(item.type) }} />
                <div className="duration-label">
                  <ClockCircleOutlined /> {item.duration}
                </div>
              </div>
            )}

            {/* 内容卡片 */}
            <Card
              className="timeline-card"
              hoverable
              onClick={() => onLocationClick(item)}
              style={{ borderColor: getItemColor(item.type) }}
            >
              <div className="card-header">
                <Tag color={getItemColor(item.type)}>{getTypeLabel(item.type)}</Tag>
                <Text strong style={{ fontSize: '16px' }}>
                  {item.title}
                </Text>
              </div>

              <Paragraph
                ellipsis={{ rows: 2 }}
                style={{ margin: '8px 0', color: '#666' }}
              >
                {item.description}
              </Paragraph>

              <div className="card-footer">
                <div className="location">
                  <EnvironmentOutlined style={{ color: getItemColor(item.type) }} />
                  <Text type="secondary">{item.location}</Text>
                </div>
                {item.estimated_cost > 0 && (
                  <div className="cost">
                    <DollarOutlined style={{ color: getItemColor(item.type) }} />
                    <Text type="secondary">¥{item.estimated_cost}</Text>
                  </div>
                )}
              </div>

              {item.tips && (
                <div className="tips">
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    💡 {item.tips}
                  </Text>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalTimeline;
