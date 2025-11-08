import React, { useState, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Button,
  Space,
  message,
  Spin,
  Typography,
  Row,
  Col,
  Tooltip,
  Progress
} from 'antd';
import {
  AudioOutlined,
  AudioMutedOutlined,
  SendOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import { plannerService } from '../services/plannerService';
import './PlannerPage.scss';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const PlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // 检查是否支持webm格式
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // 检查录音大小
        if (audioBlob.size < 1000) {
          message.warning('录音时间太短，请重新录制');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        await handleVoiceInput(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      message.info('🎤 录音中... 请清晰说出您的旅行需求（建议5-10秒）', 5);
    } catch (error) {
      console.error('Failed to start recording:', error);
      message.error('无法访问麦克风，请检查权限设置');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      message.success('录音结束，正在识别...');
    }
  };

  // Handle voice input
  const handleVoiceInput = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      setProgress(20);

      // Convert to audio file and send to backend
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      setProgress(40);
      const transcription = await plannerService.transcribeAudio(formData);

      setProgress(60);
      if (transcription) {
        // Parse transcription and fill form
        parseTranscription(transcription);
        message.success(`✅ 识别成功：${transcription}`);
      } else {
        message.warning('未能识别到语音内容，请重新尝试：\n1. 确保环境安静\n2. 说话清晰响亮\n3. 录音时长5-10秒', 8);
      }
    } catch (error: any) {
      console.error('Voice recognition failed:', error);
      const errorMsg = error.response?.data?.error || error.message;

      if (errorMsg?.includes('网络') || errorMsg?.includes('API')) {
        message.error('网络连接失败，请检查网络后重试');
      } else if (errorMsg?.includes('无法识别')) {
        message.warning('无法识别语音，建议：\n• 在安静环境录音\n• 说话清晰且声音足够大\n• 录音时长5-10秒\n• 距离麦克风15-30cm', 10);
      } else {
        message.error('语音识别失败，请重试');
      }
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  // Parse transcription and fill form
  const parseTranscription = (text: string) => {
    // This is a simplified parser - in production, you'd use NLP
    form.setFieldValue('preferences', text);

    // Try to extract destination
    const destMatch = text.match(/去(.+?)旅行|到(.+?)玩|(.+?)旅游/);
    if (destMatch) {
      const destination = destMatch[1] || destMatch[2] || destMatch[3];
      form.setFieldValue('destination', destination);
    }

    // Try to extract people count
    const peopleMatch = text.match(/(\d+)个?人/);
    if (peopleMatch) {
      form.setFieldValue('people_count', parseInt(peopleMatch[1]));
    }

    // Try to extract budget
    const budgetMatch = text.match(/预算[^\d]*(\d+)/);
    if (budgetMatch) {
      form.setFieldValue('budget', parseInt(budgetMatch[1]));
    }
  };

  // Submit form
  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      setProgress(10);

      // Format dates
      const formattedValues = {
        ...values,
        start_date: values.dates[0].format('YYYY-MM-DD'),
        end_date: values.dates[1].format('YYYY-MM-DD'),
        dates: undefined
      };

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Call API to generate itinerary
      const result = await plannerService.generateItinerary(formattedValues);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        message.success('行程生成成功！');
        // Navigate to itinerary page
        navigate(`/itinerary/${result.data.id || 'preview'}`, {
          state: { itinerary: result.data }
        });
      } else {
        // Show detailed error message
        const errorMsg = result.error || '行程生成失败，请重试';
        message.error(errorMsg);
        console.error('Generation failed:', result);
      }
    } catch (error: any) {
      console.error('Failed to generate itinerary:', error);
      const errorMessage = error.response?.data?.error || error.message || '行程生成失败，请检查网络连接后重试';
      message.error(errorMessage);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  // Disable past dates
  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current < dayjs().startOf('day');
  };

  return (
    <div className="planner-page">
      <div className="planner-container">
        {/* Header */}
        <div className="planner-header">
          <Title level={2} className="page-title">
            开始规划您的旅程
          </Title>
          <Paragraph className="page-description">
            通过语音或文字输入您的需求，AI 将为您生成专属的旅行计划
          </Paragraph>
        </div>

        {/* Main Form */}
        <Card className="planner-card">
          {isLoading && (
            <div className="loading-overlay">
              <Spin
                indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
                tip={`正在生成您的旅行计划... ${progress}%`}
              />
              <Progress
                percent={progress}
                strokeColor={{
                  '0%': '#22c55e',
                  '100%': '#0ea5e9',
                }}
                showInfo={false}
                style={{ marginTop: 20, maxWidth: 300 }}
              />
            </div>
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              people_count: 2,
              budget: 5000
            }}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <EnvironmentOutlined />
                      目的地
                    </Space>
                  }
                  name="destination"
                  rules={[{ required: true, message: '请输入目的地' }]}
                >
                  <Input
                    placeholder="例如：上海、杭州、西安"
                    size="large"
                    prefix={<EnvironmentOutlined />}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <CalendarOutlined />
                      出行日期
                    </Space>
                  }
                  name="dates"
                  rules={[{ required: true, message: '请选择出行日期' }]}
                >
                  <RangePicker
                    size="large"
                    style={{ width: '100%' }}
                    disabledDate={disabledDate}
                    placeholder={['开始日期', '结束日期']}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <TeamOutlined />
                      出行人数
                    </Space>
                  }
                  name="people_count"
                  rules={[{ required: true, message: '请输入出行人数' }]}
                >
                  <InputNumber
                    min={1}
                    max={20}
                    size="large"
                    style={{ width: '100%' }}
                    placeholder="请输入出行人数"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <DollarOutlined />
                      预算（元）
                    </Space>
                  }
                  name="budget"
                  rules={[{ required: true, message: '请输入预算' }]}
                >
                  <InputNumber
                    min={100}
                    max={1000000}
                    size="large"
                    style={{ width: '100%' }}
                    placeholder="请输入总预算"
                    formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="特殊需求或偏好"
                  name="preferences"
                >
                  <TextArea
                    rows={4}
                    placeholder="例如：想去看海、喜欢历史文化、需要亲子友好的景点..."
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Voice Input Section */}
            <div className="voice-section">
              <Tooltip title={isRecording ? '点击停止录音' : '点击开始语音输入'}>
                <Button
                  type={isRecording ? 'primary' : 'default'}
                  shape="circle"
                  size="large"
                  icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`voice-button ${isRecording ? 'recording' : ''}`}
                  danger={isRecording}
                />
              </Tooltip>
              <Text type="secondary" style={{ marginLeft: 16 }}>
                {isRecording ? '正在录音...' : '点击使用语音输入'}
              </Text>
            </div>

            {/* Submit Button */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SendOutlined />}
                loading={isLoading}
                className="submit-button"
                block
              >
                生成旅行计划
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Tips */}
        <Card className="tips-card">
          <Title level={4}>小贴士</Title>
          <ul className="tips-list">
            <li>语音输入示例："我想去杭州玩3天，预算5000元，2个人"</li>
            <li>填写越详细，生成的计划越贴合您的需求</li>
            <li>生成后可以随时调整和优化行程</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default PlannerPage;