"""
Authentication utilities and middleware
"""

from functools import wraps
from typing import Optional

from flask import jsonify, request
from loguru import logger

from .supabase_client import supabase


def get_user_from_token(token: str) -> Optional[dict]:
    """
    Verify JWT token and get user information

    Args:
        token: JWT token from Authorization header

    Returns:
        dict: User information if token is valid, None otherwise
    """
    try:
        # Get user info from Supabase
        user = supabase.auth.get_user(token)

        if user and user.user:
            return {
                "id": user.user.id,
                "email": user.user.email,
                "user_metadata": user.user.user_metadata,
            }
        return None
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None


def require_auth(f):
    """
    Decorator to protect routes that require authentication

    Usage:
        @app.route('/protected')
        @require_auth
        def protected_route(current_user):
            return jsonify({"user": current_user})
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Debug logging
        logger.info(f"require_auth decorator called for function: {f.__name__}")
        logger.info(f"Request path: {request.path}")
        logger.info(f"Args: {args}, Kwargs: {kwargs}")

        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            logger.warning(f"Missing Authorization header for {request.path}")
            return jsonify(
                {"success": False, "error": "Missing Authorization header"}
            ), 401

        # Extract token (format: "Bearer <token>")
        try:
            token = auth_header.split(" ")[1]
            logger.info(f"Token extracted: {token[:20]}...")
        except IndexError:
            logger.warning(f"Invalid Authorization header format for {request.path}")
            return jsonify(
                {"success": False, "error": "Invalid Authorization header format"}
            ), 401

        # Verify token and get user
        user = get_user_from_token(token)

        if not user:
            logger.warning(f"Token verification failed for {request.path}")
            return jsonify({"success": False, "error": "Invalid or expired token"}), 401

        logger.info(f"User authenticated successfully: {user.get('email')}")

        # Pass user info to the route handler
        try:
            result = f(current_user=user, *args, **kwargs)
            logger.info(f"Route handler {f.__name__} executed successfully")
            return result
        except Exception as e:
            logger.error(f"Error in route handler {f.__name__}: {e}")
            raise

    return decorated_function


def optional_auth(f):
    """
    Decorator for routes that work with or without authentication

    Usage:
        @app.route('/public')
        @optional_auth
        def public_route(current_user=None):
            if current_user:
                return jsonify({"message": f"Hello {current_user['email']}"})
            return jsonify({"message": "Hello guest"})
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")

        user = None
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
                user = get_user_from_token(token)
            except (IndexError, Exception) as e:
                logger.warning(f"Optional auth failed: {e}")

        # Pass user info (or None) to the route handler
        return f(current_user=user, *args, **kwargs)

    return decorated_function
