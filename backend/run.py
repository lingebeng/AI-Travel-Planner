#!/usr/bin/env python3
"""
Run script for AI Travel Planner Backend
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app import create_app
from app.config import Config
from loguru import logger

if __name__ == "__main__":
    # Create Flask app
    app = create_app()

    # Run the application
    logger.info(f"Starting AI Travel Planner Backend on {Config.HOST}:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
