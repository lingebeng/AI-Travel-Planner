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
  const [mapUrl, setMapUrl] = useState<string>(''); // 存储地图URL

  // 高德地图 API Key
  const AMAP_KEY = '38f0c3f8b200b1ac9a0c6f7fc977ac07';

  // 当目的地改变时，重新获取地图
  useEffect(() => {
    const destination = itinerary?.metadata?.destination;
    if (destination) {
      setMapLoading(true);
      setMapError(false);
      fetchMapUrl(destination);
    }
  }, [itinerary?.metadata?.destination]);

  // 通过高德API获取城市坐标并生成地图URL
  const fetchMapUrl = async (destination: string) => {
    try {
      // 使用高德地图地理编码API获取城市坐标
      const geocodeUrl = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(destination)}&key=${AMAP_KEY}`;

      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
        const location = data.geocodes[0].location; // 格式: "lng,lat"
        const [lng, lat] = location.split(',');

        // 生成静态地图URL
        const staticMapUrl = `https://restapi.amap.com/v3/staticmap?location=${lng},${lat}&zoom=12&size=800*400&markers=mid,,A:${lng},${lat}&key=${AMAP_KEY}`;

        setMapUrl(staticMapUrl);
        setMapKey(prev => prev + 1); // 强制重新加载
      } else {
        console.warn('未找到城市坐标，使用默认位置');
        // 使用默认位置（上海）
        const defaultUrl = `https://restapi.amap.com/v3/staticmap?location=121.4737,31.2304&zoom=12&size=800*400&markers=mid,,A:121.4737,31.2304&key=${AMAP_KEY}`;
        setMapUrl(defaultUrl);
        setMapKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('获取地图失败:', error);
      setMapError(true);
      setMapLoading(false);
    }
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
        ) : mapUrl ? (
          <>
            <img
              key={mapKey}
              src={mapUrl}
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
                <p>正在加载地图...</p>
              </div>
            )}
          </>
        ) : (
          <div className="map-loading">
            <LoadingOutlined spin style={{ fontSize: 32 }} />
            <p>正在获取城市坐标...</p>
          </div>
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