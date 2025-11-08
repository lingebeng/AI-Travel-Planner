#!/usr/bin/env python3
"""
测试语音识别transcribe API和webm转换
"""

import os
import struct
import subprocess
import wave

import requests


def create_test_webm():
    """创建一个测试webm音频文件"""
    # 先创建WAV
    wav_path = "/tmp/test_voice.wav"

    with wave.open(wav_path, "wb") as wav_file:
        wav_file.setnchannels(1)  # mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(16000)  # 16kHz

        # 写入2秒的静音数据
        duration = 2
        num_frames = duration * 16000
        frames = struct.pack("<" + ("h" * num_frames), *([0] * num_frames))
        wav_file.writeframes(frames)

    # 使用ffmpeg转换为webm
    webm_path = "/tmp/test_voice.webm"
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        wav_path,
        "-acodec",
        "libopus",
        "-ar",
        "16000",
        "-ac",
        "1",
        webm_path,
    ]

    result = subprocess.run(cmd, capture_output=True)
    if result.returncode == 0:
        print(f"✓ Created test webm file: {webm_path}")
        os.remove(wav_path)
        return webm_path
    else:
        print(f"✗ Failed to create webm: {result.stderr.decode()}")
        return None


def test_transcribe_api():
    """测试transcribe API"""
    url = "http://localhost:5001/api/voice/transcribe"

    # 创建测试webm文件
    webm_path = create_test_webm()
    if not webm_path:
        print("Failed to create test file")
        return

    try:
        # 发送请求
        print(f"\n📤 Sending webm file to {url}...")
        with open(webm_path, "rb") as audio_file:
            files = {"audio": ("recording.webm", audio_file, "audio/webm")}
            response = requests.post(url, files=files, timeout=30)

        print(f"\n📊 Status Code: {response.status_code}")
        print(f"📄 Response: {response.json()}")

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("\n✓ 识别成功！")
                print(f"  转录内容: {result.get('transcription', 'N/A')}")
            else:
                print(f"\n✗ 识别失败: {result.get('error')}")
        else:
            print("\n✗ API请求失败")

    except Exception as e:
        print(f"\n✗ 测试出错: {e}")
    finally:
        # 清理
        if os.path.exists(webm_path):
            os.remove(webm_path)
            print("\n🧹 清理了测试文件")


if __name__ == "__main__":
    print("=== 测试语音识别API (webm转换) ===\n")
    test_transcribe_api()
