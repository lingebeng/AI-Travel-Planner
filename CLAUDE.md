# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Travel Planner is a web-based intelligent travel planning application. It uses AI/LLM to understand user requirements and automatically generate detailed travel itineraries with budget estimates. The project is built with Python backend (Flask), React frontend (TypeScript), and integrates voice recognition, map services, and cloud storage.

### Core Features

1. **Intelligent Itinerary Planning**: Voice or text input for travel preferences (destination, dates, budget, companions, interests). AI generates personalized routes including transportation, accommodation, attractions, and restaurants.

2. **Budget Management**: AI-powered budget analysis and expense tracking with voice input support.

3. **User Management & Cloud Sync**: User authentication with cloud-synced travel plans, preferences, and expense records across devices.

## Technology Stack

- **Backend**: Python 3.12+ with Flask
- **Frontend**: React with TypeScript
- **LLM**: DeepSeek (for itinerary planning and budget estimation)
- **Voice Recognition**: SpeechRecognition library (Google Speech API for Chinese/English)
- **Maps**: Amap (高德地图) API for location services and navigation
- **Database/Auth**: Supabase
- **UI Components**: Ant Design
- **Deployment**: Docker

## Project Structure

- `main.py` - Main application entry point
- `prepare/` - Preparation and example code
  - `语音识别.py` - Voice recognition demo with microphone and file-based speech-to-text
- `pyproject.toml` - Python dependencies and project configuration
- `TODO.md` - Project task tracking (in Chinese)

## Development Commands

### Environment Setup

```bash
# Python version: 3.12 (see .python-version)
# Install dependencies using uv (recommended) or pip
uv sync
# Or with pip
pip install -e .
```

### Code Quality

```bash
# Install pre-commit hooks (includes ruff linting/formatting and typos)
pre-commit install

# Run pre-commit manually on all files
pre-commit run --all-files

# Format and lint code with ruff
ruff check --fix .
ruff format .
```

### Running the Application

```bash
python main.py
```

### Voice Recognition Demo

```bash
# Test voice recognition functionality
python prepare/语音识别.py
```

## Code Style & Standards

- **Linter/Formatter**: Ruff configured in `pyproject.toml`
  - Target Python version: 3.14 (forward compatibility)
  - Auto-fix enabled
  - Import sorting enabled
  - Line length limit ignored (E501)
  - Quotes: double quotes
  - Indentation: spaces
  - Line endings: LF

- **Pre-commit Hooks**: Automatically enforced via `.pre-commit-config.yaml`
  - Ruff check and format
  - Trailing whitespace removal
  - Large file detection
  - Typo checking

## Voice Recognition Architecture

The `prepare/语音识别.py` module provides:
- `recognize_speech_from_mic()`: Real-time microphone recording with automatic or timed duration
- `recognize_speech_from_file()`: Audio file transcription (WAV format)
- Configurable parameters:
  - Energy threshold: 300 (adjustable for noise levels)
  - Pause threshold: 2.5 seconds (silence duration to end recording)
  - Language: zh-CN (Chinese), easily changed to other languages
- Uses Google Speech Recognition API (requires internet connection)

## Important Security Notes

- **Never commit API keys** to the repository, especially for public GitHub repos
- API keys should be managed via:
  - Environment variables
  - Configuration files (add to `.gitignore`)
  - Settings page in the application UI
- See TODO.md and project requirements for API key management guidelines

## Docker & Deployment

The project must be containerized with Docker for submission. Docker image should be:
- Built and pushed to Alibaba Cloud container registry (recommended via GitHub Actions)
- Runnable with provided documentation in README
- Include API keys in documentation if not using Alibaba Cloud Bailian platform (keys must remain valid for 3 months)

## Git Workflow

Maintain detailed and frequent commit history for project evaluation. Current commits show preparation phase with voice recognition integration and documentation updates.
