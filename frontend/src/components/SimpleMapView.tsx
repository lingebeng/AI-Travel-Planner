import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { EnvironmentOutlined, CompassOutlined, LoadingOutlined } from '@ant-design/icons';
import './SimpleMapView.scss';

interface SimpleMapViewProps {
  itinerary: any;
  activeDay?: number;
  onLocationClick?: (location: any) => void;
}

const SimpleMapView: React.FC<SimpleMapViewProps> = ({ itinerary, activeDay = 1, onLocationClick }) => {
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [mapKey, setMapKey] = useState(0); // 用于强制重新加载地图

  // 高德地图 API Key
  const AMAP_KEY = '38f0c3f8b200b1ac9a0c6f7fc977ac07';

  // 当目的地改变时，重置地图状态
  useEffect(() => {
    setMapLoading(true);
    setMapError(false);
    setMapKey(prev => prev + 1); // 强制重新加载图片
  }, [itinerary?.metadata?.destination]);

  // 获取高德地图静态图片URL
  const getStaticMapUrl = () => {
    const destination = itinerary?.metadata?.destination || '上海';

    // 常见城市的经纬度坐标（高德地图坐标系）
    const cityCoords: { [key: string]: { lng: number, lat: number } } = {
      '上海': { lng: 121.4737, lat: 31.2304 },
      '北京': { lng: 116.4074, lat: 39.9042 },
      '广州': { lng: 113.2644, lat: 23.1291 },
      '深圳': { lng: 114.0579, lat: 22.5431 },
      '杭州': { lng: 120.1551, lat: 30.2741 },
      '南京': { lng: 118.7969, lat: 32.0603 },
      '苏州': { lng: 120.5954, lat: 31.2989 },
      '成都': { lng: 104.0665, lat: 30.5728 },
      '重庆': { lng: 106.5516, lat: 29.5630 },
      '西安': { lng: 108.9399, lat: 34.3416 },
      '武汉': { lng: 114.3054, lat: 30.5931 },
      '天津': { lng: 117.2010, lat: 39.0842 },
      '厦门': { lng: 118.0894, lat: 24.4798 },
      '青岛': { lng: 120.3826, lat: 36.0671 },
      '大连': { lng: 121.6147, lat: 38.9140 },
      '宁波': { lng: 121.5440, lat: 29.8683 },
    };

    const coords = cityCoords[destination] || cityCoords['上海'];

    // 使用高德地图静态图API
    // 参数说明：location=经度,纬度 zoom=缩放级别 size=图片尺寸 markers=标记点
    const url = `https://restapi.amap.com/v3/staticmap?location=${coords.lng},${coords.lat}&zoom=12&size=800*400&markers=mid,,A:${coords.lng},${coords.lat}&key=${AMAP_KEY}`;

    return url;
  };

  // Navigate to external map service
  const openInMap = (location?: string) => {
    const query = location || itinerary?.metadata?.destination || '上海';

    // Option 1: Open in Amap
    const amapUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}&city=&coordinate=gaode`;

    // Option 2: Open in Baidu Map
    // const baiduUrl = `https://map.baidu.com/search/${encodeURIComponent(query)}`;

    // Option 3: Open in Google Maps
    // const googleUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

    window.open(amapUrl, '_blank');
  };

  // Render location list instead of map markers
  const renderLocationsList = () => {
    const currentDay = itinerary?.daily_itinerary?.find((d: any) => d.day === activeDay);

    if (!currentDay) return null;

    return (
      <div className="locations-list">
        <h4>第 {activeDay} 天地点</h4>
        <div className="locations-grid">
          {currentDay.items?.map((item: any, index: number) => (
            <div
              key={index}
              className="location-item"
              onClick={() => {
                openInMap(item.location);
                onLocationClick?.(item);
              }}
            >
              <span className="location-number">{index + 1}</span>
              <div className="location-info">
                <div className="location-title">{item.title}</div>
                <div className="location-address">
                  <EnvironmentOutlined /> {item.location}
                </div>
                <div className="location-time">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="simple-map-view">
      {/* 地图缩略图 */}
      <div className="map-image-container">
        {mapError ? (
          <div className="map-placeholder" style={{ background: 'linear-gradient(135deg, #e6fffa 0%, #dcfce7 100%)' }}>
            <CompassOutlined className="placeholder-icon" />
            <h3>{itinerary?.metadata?.destination || '目的地'}</h3>
            <p>地图加载失败，点击下方地点查看位置</p>
            <Button
              type="primary"
              size="small"
              onClick={() => openInMap()}
            >
              在地图中查看全部地点
            </Button>
          </div>
        ) : (
          <>
            <img
              key={mapKey}
              src={getStaticMapUrl()}
              alt={`${itinerary?.metadata?.destination}地图`}
              onLoad={() => setMapLoading(false)}
              onError={() => {
                setMapError(true);
                setMapLoading(false);
              }}
              style={{ display: mapLoading ? 'none' : 'block' }}
            />
            {mapLoading && (
              <div className="map-loading">
                <LoadingOutlined spin style={{ fontSize: 32 }} />
                <p>地图加载中...</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Locations List */}
      {renderLocationsList()}

      {/* Action Buttons */}
      <div className="map-actions">
        <Button
          type="primary"
          icon={<EnvironmentOutlined />}
          onClick={() => openInMap()}
          block
        >
          在高德地图中查看完整路线
        </Button>
      </div>
    </div>
  );
};

export default SimpleMapView;