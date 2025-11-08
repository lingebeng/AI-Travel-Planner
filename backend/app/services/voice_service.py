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
        try:
            with sr.AudioFile(audio_file_path) as source:
                logger.info(f"Reading audio file: {audio_file_path}")
                audio = self.recognizer.record(source)
                logger.info("Starting recognition...")
        except FileNotFoundError:
            logger.error(f"File not found: {audio_file_path}")
            return {
                "success": False,
                "error": f"File not found: {audio_file_path}",
                "transcription": None,
            }
        except Exception as e:
            logger.error(f"Error reading file: {e}")
            return {
                "success": False,
                "error": f"Error reading file: {str(e)}",
                "transcription": None,
            }

        response = {"success": True, "error": None, "transcription": None}

        try:
            # Use Google Speech Recognition (free)
            response["transcription"] = self.recognizer.recognize_google(
                audio, language=language
            )
            logger.info(f"Recognition successful: {response['transcription'][:50]}...")
        except sr.RequestError as e:
            # API request failed
            logger.error(f"API request failed: {e}")
            response["success"] = False
            response["error"] = "API request failed, please check network connection"
        except sr.UnknownValueError:
            # Cannot recognize speech
            logger.warning("Could not recognize speech content")
            response["success"] = False
            response["error"] = "Could not recognize speech content"

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
