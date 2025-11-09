/**
 * Voice Expense Input Component
 * Records voice and parses expense using AI
 */

import React, { useState, useRef } from 'react';
import { Button, message } from 'antd';
import { AudioOutlined, LoadingOutlined } from '@ant-design/icons';
import { expenseService, VoiceParseResult } from '../services/expenseService';
import { supabase } from '../lib/supabase';

interface VoiceExpenseInputProps {
  onParsed: (result: VoiceParseResult) => void;
  disabled?: boolean;
}

const VoiceExpenseInput: React.FC<VoiceExpenseInputProps> = ({
  onParsed,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 检查是否支持webm格式
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        // 检查录音大小
        if (audioBlob.size < 1000) {
          message.warning('录音时间太短，请重新录制');
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        await processAudio(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      message.info('🎤 正在录音... 请清晰说出开销内容（建议3-5秒）', 5);
    } catch (error) {
      console.error('Failed to start recording:', error);
      message.error('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Get auth token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('未登录，请先登录');
      }

      // Step 1: Transcribe audio to text
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await fetch('http://localhost:5001/api/voice/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const transcribeData = await transcribeResponse.json();

      // 后端返回格式：{success: bool, error: string, transcription: string}
      if (!transcribeData.success || !transcribeData.transcription) {
        throw new Error(transcribeData.error || '语音识别失败');
      }

      const voiceText = transcribeData.transcription;
      message.success(`识别结果: ${voiceText}`);

      // Step 2: Parse text into expense data using AI
      const parseResult = await expenseService.parseVoiceExpense(voiceText);

      // Check confidence
      if (parseResult.confidence < 0.5) {
        message.warning('AI 解析置信度较低，请检查识别结果');
      }

      // Call parent callback
      onParsed(parseResult);
      message.success('开销信息已解析');
    } catch (error: any) {
      console.error('Failed to process audio:', error);
      message.error(error.message || '处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      type={isRecording ? 'primary' : 'default'}
      danger={isRecording}
      icon={isProcessing ? <LoadingOutlined /> : <AudioOutlined />}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled || isProcessing}
      size="large"
    >
      {isProcessing
        ? '处理中...'
        : isRecording
        ? '停止录音'
        : '语音输入'}
    </Button>
  );
};

export default VoiceExpenseInput;
