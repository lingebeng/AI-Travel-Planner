import React, { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { message } from 'antd';
import './MapView.scss';

interface MapViewProps {
  itinerary: any;
  activeDay?: number;
  onLocationClick?: (location: any) => void;
}

// Note: You need to replace with your actual Amap API key
const AMAP_KEY = 'YOUR_AMAP_WEB_KEY';
const AMAP_SECURITY_CODE = 'YOUR_SECURITY_CODE';

const MapView: React.FC<MapViewProps> = ({ itinerary, activeDay = 1, onLocationClick }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Set security configuration
    window._AMapSecurityConfig = {
      securityJsCode: AMAP_SECURITY_CODE,
    };

    // Load Amap
    AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: [
        'AMap.Marker',
        'AMap.Polyline',
        'AMap.InfoWindow',
        'AMap.Geocoder',
        'AMap.PlaceSearch',
        'AMap.Driving',
        'AMap.Walking',
        'AMap.Scale',
        'AMap.ToolBar',
        'AMap.Geolocation'
      ]
    }).then((AMap) => {
      if (!mapContainerRef.current) return;

      // Initialize map
      const map = new AMap.Map(mapContainerRef.current, {
        zoom: 12,
        center: [121.473701, 31.230416], // Default center (Shanghai)
        viewMode: '2D',
        mapStyle: 'amap://styles/fresh',
      });

      // Add controls
      map.addControl(new AMap.Scale());
      map.addControl(new AMap.ToolBar({
        position: 'RT'
      }));

      // Add geolocation
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        buttonOffset: new AMap.Pixel(10, 10),
        zoomToAccuracy: true,
        buttonPosition: 'RB'
      });
      map.addControl(geolocation);

      mapInstanceRef.current = map;
      setMapLoaded(true);

      // Load itinerary locations
      if (itinerary) {
        loadItineraryLocations(map, AMap);
      }
    }).catch((e) => {
      console.error('Failed to load Amap:', e);
      message.error('地图加载失败，请检查网络连接');
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, []);

  // Update markers when active day changes
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current && itinerary) {
      updateActiveDay();
    }
  }, [activeDay, mapLoaded]);

  const loadItineraryLocations = async (map: any, AMap: any) => {
    if (!itinerary?.daily_itinerary) return;

    const geocoder = new AMap.Geocoder({
      city: itinerary.metadata?.destination || '全国'
    });

    const allMarkers: any[] = [];
    const bounds = new AMap.Bounds();

    // Process each day's locations
    for (const day of itinerary.daily_itinerary) {
      const dayMarkers: any[] = [];

      for (const item of day.items || []) {
        if (item.location) {
          try {
            // Geocode the location
            const result = await new Promise((resolve, reject) => {
              geocoder.getLocation(item.location, (status: string, result: any) => {
                if (status === 'complete' && result.geocodes.length) {
                  resolve(result.geocodes[0]);
                } else {
                  reject(new Error('Geocoding failed'));
                }
              });
            });

            const location = (result as any).location;

            // Create marker
            const marker = new AMap.Marker({
              position: [location.lng, location.lat],
              title: item.title,
              content: createMarkerContent(day.day, item),
              extData: { day: day.day, item }
            });

            // Add click event
            marker.on('click', () => {
              showInfoWindow(map, AMap, marker, item);
              if (onLocationClick) {
                onLocationClick(item);
              }
            });

            dayMarkers.push(marker);
            bounds.extend([location.lng, location.lat]);
          } catch (error) {
            console.error(`Failed to geocode location: ${item.location}`, error);
          }
        }
      }

      // Connect locations with polyline
      if (dayMarkers.length > 1) {
        const path = dayMarkers.map(m => m.getPosition());
        const polyline = new AMap.Polyline({
          path: path,
          strokeColor: getColorForDay(day.day),
          strokeOpacity: 0.8,
          strokeWeight: 3,
          strokeStyle: 'solid',
          strokeDasharray: [10, 5],
          extData: { day: day.day }
        });
        map.add(polyline);
      }

      allMarkers.push(...dayMarkers);
    }

    // Add all markers to map
    map.add(allMarkers);
    markersRef.current = allMarkers;

    // Fit map to show all markers
    if (allMarkers.length > 0) {
      map.setBounds(bounds, false, [50, 50, 50, 50]);
    }
  };

  const createMarkerContent = (day: number, item: any) => {
    const typeIcon = getIconForType(item.type);
    const color = getColorForDay(day);

    return `
      <div class="custom-marker" style="background: ${color};">
        <span class="marker-icon">${typeIcon}</span>
        <span class="marker-day">D${day}</span>
      </div>
    `;
  };

  const showInfoWindow = (map: any, AMap: any, marker: any, item: any) => {
    const content = `
      <div class="info-window">
        <h3>${item.title}</h3>
        <p class="time">${item.time} | ${item.duration || ''}</p>
        <p class="description">${item.description || ''}</p>
        ${item.estimated_cost ? `<p class="cost">预计费用：¥${item.estimated_cost}</p>` : ''}
        ${item.tips ? `<p class="tips">💡 ${item.tips}</p>` : ''}
        <div class="actions">
          <button onclick="window.navigateToLocation('${item.location}')">
            📍 导航到这里
          </button>
        </div>
      </div>
    `;

    const infoWindow = new AMap.InfoWindow({
      content: content,
      offset: new AMap.Pixel(0, -30)
    });

    infoWindow.open(map, marker.getPosition());
  };

  const updateActiveDay = () => {
    if (!markersRef.current.length) return;

    // Update marker visibility based on active day
    markersRef.current.forEach(marker => {
      const markerDay = marker.getExtData().day;
      if (activeDay === 0 || markerDay === activeDay) {
        marker.show();
      } else {
        marker.hide();
      }
    });

    // Center map on active day's locations
    if (activeDay > 0) {
      const dayMarkers = markersRef.current.filter(m => m.getExtData().day === activeDay);
      if (dayMarkers.length > 0) {
        const bounds = new (window as any).AMap.Bounds();
        dayMarkers.forEach(m => bounds.extend(m.getPosition()));
        mapInstanceRef.current.setBounds(bounds, false, [50, 50, 50, 50]);
      }
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'attraction': return '🏛️';
      case 'restaurant': return '🍽️';
      case 'hotel': return '🏨';
      case 'transportation': return '🚌';
      case 'shopping': return '🛍️';
      default: return '📍';
    }
  };

  const getColorForDay = (day: number) => {
    const colors = [
      '#22c55e', // Green
      '#0ea5e9', // Blue
      '#f97316', // Orange
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#f59e0b', // Amber
    ];
    return colors[(day - 1) % colors.length];
  };

  // Global navigation function
  useEffect(() => {
    (window as any).navigateToLocation = (location: string) => {
      // Open in Amap app or web
      const url = `https://uri.amap.com/marker?position=&name=${encodeURIComponent(location)}&coordinate=gaode&callnative=1`;
      window.open(url, '_blank');
    };
  }, []);

  return (
    <div className="map-view-container">
      <div ref={mapContainerRef} className="map-container" />
      {!mapLoaded && (
        <div className="map-loading">
          <div className="spinner"></div>
          <p>地图加载中...</p>
        </div>
      )}
    </div>
  );
};

export default MapView;