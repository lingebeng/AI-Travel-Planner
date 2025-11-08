#!/usr/bin/env python3
"""
测试语音识别API
"""

import os

import requests


# 使用prepare目录中的测试音频，或者创建一个简单的测试
def test_voice_api():
    url = "http://localhost:5001/api/voice/recognize"

    # 创建一个简单的测试WAV文件（静音）
    # 或者你可以使用实际的音频文件

    # 使用一个小的测试音频
    test_audio_path = "/tmp/test_audio.wav"

    # 创建一个简单的WAV文件头（静音）
    import struct
    import wave

    # 创建一个1秒的静音WAV文件
    with wave.open(test_audio_path, "wb") as wav_file:
        wav_file.setnchannels(1)  # mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(16000)  # 16kHz

        # 写入1秒的静音数据
        duration = 1
        num_frames = duration * 16000
        frames = struct.pack("<" + ("h" * num_frames), *([0] * num_frames))
        wav_file.writeframes(frames)

    print(f"Created test audio file: {test_audio_path}")

    # 发送请求
    with open(test_audio_path, "rb") as audio_file:
        files = {"audio": ("test.wav", audio_file, "audio/wav")}
        response = requests.post(url, files=files)

    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

    # 清理
    os.remove(test_audio_path)


if __name__ == "__main__":
    test_voice_api()
