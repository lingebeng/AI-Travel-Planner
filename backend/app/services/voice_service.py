#!/usr/bin/env python3
"""
Voice recognition service for AI Travel Planner
Based on prepare/语音识别.py
"""

import os
import uuid
from pathlib import Path
from typing import Any, Dict, Optional

import speech_recognition as sr
from loguru import logger
from pydub import AudioSegment


class VoiceService:
    """Service for handling voice recognition"""

    def __init__(self):
        """Initialize the voice service"""
        self.recognizer = sr.Recognizer()

        # Configure recognizer parameters
        self.recognizer.energy_threshold = 300
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 2.5  # Silence duration to end recording

        # Create temp directory for audio files
        self.temp_dir = Path("/tmp/ai_travel_planner")
        self.temp_dir.mkdir(exist_ok=True)

    def convert_to_wav(self, input_path: str) -> Optional[str]:
        """
        Convert audio file to WAV format using pydub

        Args:
            input_path: Path to input audio file

        Returns:
            str: Path to converted WAV file, or None if failed
        """
        try:
            # Generate output filename
            output_path = str(Path(input_path).with_suffix(".wav"))

            logger.info(f"Converting {input_path} to WAV format...")

            # Detect input format
            input_ext = Path(input_path).suffix.lower().lstrip(".")
            if input_ext == "webm":
                # Load webm file
                audio = AudioSegment.from_file(input_path, format="webm")
            else:
                # Try to auto-detect format
                audio = AudioSegment.from_file(input_path)

            # Convert to WAV with proper settings for speech recognition
            # - 16000 Hz sample rate (good for speech)
            # - Mono channel
            # - 16-bit PCM
            audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)

            # Export as WAV
            audio.export(output_path, format="wav", codec="pcm_s16le")

            if os.path.exists(output_path):
                logger.info(f"Converted audio to WAV: {output_path}")
                return output_path
            else:
                logger.error("Conversion failed - output file not created")
                return None

        except Exception as e:
            logger.error(f"Error converting audio: {e}")
            return None

    def recognize_from_file(
        self, audio_file_path: str, language: str = "zh-CN"
    ) -> Dict[str, Any]:
        """
        Recognize speech from an audio file

        Args:
            audio_file_path: Path to the audio file
            language: Language code for recognition (default: zh-CN for Chinese)

        Returns:
            dict: Contains 'success' (bool), 'error' (str), 'transcription' (str)
        """
        wav_path = audio_file_path
        converted = False

        try:
            # Check if file needs conversion
            if not audio_file_path.lower().endswith(".wav"):
                logger.info(f"Converting {audio_file_path} to WAV format...")
                wav_path = self.convert_to_wav(audio_file_path)
                if not wav_path:
                    return {
                        "success": False,
                        "error": "无法转换音频格式，请确保已安装ffmpeg",
                        "transcription": None,
                    }
                converted = True

            # Read and recognize audio
            with sr.AudioFile(wav_path) as source:
                logger.info(f"Reading audio file: {wav_path}")
                # Adjust for ambient noise
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = self.recognizer.record(source)
                logger.info("Starting recognition...")

        except FileNotFoundError:
            logger.error(f"File not found: {audio_file_path}")
            return {
                "success": False,
                "error": f"文件未找到: {audio_file_path}",
                "transcription": None,
            }
        except Exception as e:
            logger.error(f"Error reading file: {e}")
            return {
                "success": False,
                "error": f"读取文件出错: {str(e)}",
                "transcription": None,
            }

        response = {"success": True, "error": None, "transcription": None}

        try:
            # Use Google Speech Recognition (free)
            logger.info("Calling Google Speech Recognition API...")
            response["transcription"] = self.recognizer.recognize_google(
                audio, language=language
            )
            logger.info(f"Recognition successful: {response['transcription']}")
        except sr.RequestError as e:
            # API request failed
            logger.error(f"API request failed: {e}")
            response["success"] = False
            response["error"] = "API请求失败，请检查网络连接"
        except sr.UnknownValueError:
            # Cannot recognize speech
            logger.warning("Could not recognize speech content")
            response["success"] = False
            response["error"] = "无法识别语音内容，请说得更清楚一些"
        finally:
            # Clean up converted file
            if converted and wav_path and os.path.exists(wav_path):
                try:
                    os.remove(wav_path)
                    logger.debug(f"Cleaned up converted file: {wav_path}")
                except Exception as e:
                    logger.warning(f"Failed to clean up {wav_path}: {e}")

        return response

    def save_uploaded_file(self, file_storage) -> Optional[str]:
        """
        Save an uploaded file to temporary directory

        Args:
            file_storage: Flask FileStorage object

        Returns:
            str: Path to the saved file, or None if failed
        """
        try:
            # Generate unique filename
            file_ext = Path(file_storage.filename).suffix or ".wav"
            temp_filename = f"{uuid.uuid4()}{file_ext}"
            temp_path = self.temp_dir / temp_filename

            # Save the file
            file_storage.save(str(temp_path))
            logger.info(f"Saved uploaded file to: {temp_path}")

            return str(temp_path)
        except Exception as e:
            logger.error(f"Failed to save uploaded file: {e}")
            return None

    def cleanup_temp_file(self, file_path: str):
        """
        Clean up temporary file

        Args:
            file_path: Path to the file to delete
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.debug(f"Cleaned up temp file: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to clean up temp file {file_path}: {e}")


# Create a singleton instance
voice_service = VoiceService()
