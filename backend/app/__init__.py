"""
AI Travel Planner Backend Application
"""

import sys

from flask import Flask
from flask_cors import CORS
from loguru import logger


def create_app():
    """Factory function to create Flask application"""

    # Configure loguru
    logger.remove()  # Remove default handler
    logger.add(
        sys.stdout,
        colorize=True,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | <cyan>{name}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    )

    app = Flask(__name__)

    # Load configuration
    from .config import Config

    app.config.from_object(Config)

    # Validate required configuration
    try:
        Config.validate()
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise

    # Initialize CORS
    CORS(app, origins=Config.CORS_ORIGINS)

    # Register routes
    from .routes import register_routes

    register_routes(app)

    logger.info("AI Travel Planner Backend initialized successfully")

    return app
