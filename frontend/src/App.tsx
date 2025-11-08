import React from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// Import components
import HomePage from './pages/HomePage';
import PlannerPage from './pages/PlannerPage';
import ItineraryPage from './pages/ItineraryPage';
import AppHeader from './components/AppHeader';

// Import global styles
import './styles/global.scss';
import { colors } from './styles/theme';

// Set dayjs locale
dayjs.locale('zh-cn');

const { Content } = Layout;

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          // Primary color - Fresh mint green
          colorPrimary: colors.primary[500],
          colorPrimaryBg: colors.primary[50],
          colorPrimaryBgHover: colors.primary[100],
          colorPrimaryBorder: colors.primary[200],
          colorPrimaryBorderHover: colors.primary[300],
          colorPrimaryHover: colors.primary[600],
          colorPrimaryActive: colors.primary[700],
          colorPrimaryTextHover: colors.primary[600],
          colorPrimaryText: colors.primary[500],
          colorPrimaryTextActive: colors.primary[700],

          // Secondary colors
          colorSuccess: colors.status.success,
          colorWarning: colors.status.warning,
          colorError: colors.status.error,
          colorInfo: colors.status.info,

          // Border and background
          borderRadius: 12,
          colorBgContainer: '#ffffff',
          colorBgLayout: colors.background.secondary,
          colorBorder: '#e4e4e7',

          // Typography
          fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", Arial, sans-serif',
          fontSize: 16,

          // Motion
          motionUnit: 0.1,
          motionBase: 0,
          motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          motionEaseOut: 'cubic-bezier(0.0, 0, 0.2, 1)',

          // Shadow
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          boxShadowSecondary: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
        },
        algorithm: theme.defaultAlgorithm,
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 40,
            fontSize: 15,
            paddingContentHorizontal: 24,
          },
          Card: {
            borderRadius: 16,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          },
          Input: {
            borderRadius: 8,
            controlHeight: 40,
            fontSize: 15,
          },
          DatePicker: {
            borderRadius: 8,
            controlHeight: 40,
          },
          Select: {
            borderRadius: 8,
            controlHeight: 40,
          },
        },
      }}
    >
      <Router>
        <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
          <AppHeader />
          <Content style={{ padding: '24px' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/itinerary/:id" element={<ItineraryPage />} />
            </Routes>
          </Content>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;