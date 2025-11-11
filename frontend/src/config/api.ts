// API 配置
// 在生产环境（Docker）中使用空字符串，让请求走 Nginx 代理
// 在开发环境中使用 localhost:5001
export const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production' ? '' : 'http://localhost:5001');

export const API_ENDPOINTS = {
  // 认证
  AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  AUTH_ME: `${API_BASE_URL}/api/auth/me`,

  // 行程
  ITINERARY_GENERATE: `${API_BASE_URL}/api/itinerary/generate`,
  ITINERARY_SAVE: `${API_BASE_URL}/api/itinerary/save`,
  ITINERARY_LIST: `${API_BASE_URL}/api/itinerary/list`,
  ITINERARY_GET: (id: string) => `${API_BASE_URL}/api/itinerary/${id}`,
  ITINERARY_UPDATE: (id: string) => `${API_BASE_URL}/api/itinerary/${id}`,
  ITINERARY_DELETE: (id: string) => `${API_BASE_URL}/api/itinerary/${id}`,

  // 语音
  VOICE_RECOGNIZE: `${API_BASE_URL}/api/voice/recognize`,
  VOICE_TRANSCRIBE: `${API_BASE_URL}/api/voice/transcribe`,

  // 地图
  MAP_GEOCODE: `${API_BASE_URL}/api/map/geocode`,
  MAP_SEARCH: `${API_BASE_URL}/api/map/search`,
  MAP_ROUTE: `${API_BASE_URL}/api/map/route`,
  MAP_WEATHER: `${API_BASE_URL}/api/map/weather`,
};
