/**
 * Voice Expense Input Component
 * Records voice and parses expense using AI
 */

import React, { useState, useRef } from 'react';
import { Button, message } from 'antd';
import { AudioOutlined, LoadingOutlined } from '@ant-design/icons';
import { expenseService, VoiceParseResult } from '../services/expenseService';
import { API_ENDPOINTS } from '../config/api';

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      message.info('正在录音，点击停止按钮结束');
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
      // Step 1: Transcribe audio to text
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await fetch(API_ENDPOINTS.VOICE_TRANSCRIBE, {
        method: 'POST',
        body: formData,
      });

      const transcribeData = await transcribeResponse.json();

      if (!transcribeData.success || !transcribeData.text) {
        throw new Error(transcribeData.error || '语音识别失败');
      }

      const voiceText = transcribeData.text;
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
