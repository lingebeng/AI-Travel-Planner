#!/usr/bin/env python3
"""
语音识别Demo
使用 SpeechRecognition 库实现语音转文字功能
"""

import speech_recognition as sr


def recognize_speech_from_mic(timeout=10, phrase_time_limit=None):
    """
    从麦克风录音并识别语音转为文字

    Args:
        timeout (int): 等待开始说话的超时时间（秒），默认10秒
        phrase_time_limit (int): 单次录音的最大时长（秒），None表示不限制

    Returns:
        dict: 包含 'success' (bool), 'error' (str), 'transcription' (str)
    """
    recognizer = sr.Recognizer()
    microphone = sr.Microphone()

    # 调整识别器参数以更好地处理长语音
    recognizer.energy_threshold = 300  # 降低能量阈值
    recognizer.dynamic_energy_threshold = True
    recognizer.pause_threshold = 2.5  # 识别为停顿的静音时长（秒），增加到2.5秒

    # 调整环境噪音
    with microphone as source:
        print("正在调整环境噪音，请稍候...")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        print("准备就绪，请说话...")
        if phrase_time_limit:
            print(f"(最长录音时间: {phrase_time_limit}秒)")
        else:
            print("(无时长限制，停顿2.5秒后自动结束)")

        try:
            # 录音 - 移除phrase_time_limit限制或设置为更大的值
            audio = recognizer.listen(
                source,
                timeout=timeout,
                phrase_time_limit=phrase_time_limit
            )
            print("录音完成，正在识别...")
        except sr.WaitTimeoutError:
            return {
                'success': False,
                'error': '等待超时，未检测到语音',
                'transcription': None
            }

    # 识别语音
    response = {
        'success': True,
        'error': None,
        'transcription': None
    }

    try:
        # 使用 Google Speech Recognition（免费）
        response['transcription'] = recognizer.recognize_google(
            audio,
            language='zh-CN'  # 中文识别
        )
    except sr.RequestError:
        # API 请求失败
        response['success'] = False
        response['error'] = 'API请求失败，请检查网络连接'
    except sr.UnknownValueError:
        # 无法识别语音
        response['error'] = '无法识别语音内容'

    return response


def recognize_speech_from_file(audio_file_path):
    """
    从音频文件识别语音转为文字

    Args:
        audio_file_path (str): 音频文件路径（支持 WAV 格式）

    Returns:
        dict: 包含 'success' (bool), 'error' (str), 'transcription' (str)
    """
    recognizer = sr.Recognizer()

    try:
        with sr.AudioFile(audio_file_path) as source:
            print(f"正在读取音频文件: {audio_file_path}")
            audio = recognizer.record(source)
            print("正在识别...")
    except FileNotFoundError:
        return {
            'success': False,
            'error': f'文件不存在: {audio_file_path}',
            'transcription': None
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'读取文件出错: {str(e)}',
            'transcription': None
        }

    response = {
        'success': True,
        'error': None,
        'transcription': None
    }

    try:
        response['transcription'] = recognizer.recognize_google(
            audio,
            language='zh-CN'
        )
    except sr.RequestError:
        response['success'] = False
        response['error'] = 'API请求失败，请检查网络连接'
    except sr.UnknownValueError:
        response['error'] = '无法识别语音内容'

    return response


def main():
    """主函数"""
    print("=" * 50)
    print("语音识别Demo")
    print("=" * 50)
    print("\n请选择识别模式：")
    print("1. 从麦克风录音识别（自动结束）")
    print("2. 从麦克风录音识别（指定时长）")
    print("3. 从音频文件识别")
    print("0. 退出")

    while True:
        choice = input("\n请输入选项 (0/1/2/3): ").strip()

        if choice == '0':
            print("退出程序")
            break
        elif choice == '1':
            # 无时长限制，停顿1秒自动结束
            result = recognize_speech_from_mic()
            print("\n" + "-" * 50)
            if result['success'] and result['transcription']:
                print(f"识别结果: {result['transcription']}")
            elif result['error']:
                print(f"错误: {result['error']}")
            print("-" * 50)
        elif choice == '2':
            # 自定义录音时长
            try:
                duration = int(input("请输入最长录音时间（秒）: ").strip())
                result = recognize_speech_from_mic(phrase_time_limit=duration)
                print("\n" + "-" * 50)
                if result['success'] and result['transcription']:
                    print(f"识别结果: {result['transcription']}")
                elif result['error']:
                    print(f"错误: {result['error']}")
                print("-" * 50)
            except ValueError:
                print("无效的时间输入")
        elif choice == '3':
            file_path = input("请输入音频文件路径 (WAV格式): ").strip()
            result = recognize_speech_from_file(file_path)
            print("\n" + "-" * 50)
            if result['success'] and result['transcription']:
                print(f"识别结果: {result['transcription']}")
            elif result['error']:
                print(f"错误: {result['error']}")
            print("-" * 50)
        else:
            print("无效选项，请重新输入")


if __name__ == "__main__":
    main()
