"""
Supabase client initialization
"""

from loguru import logger
from supabase import Client, create_client

from .config import Config


# Create Supabase client
def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    try:
        client = create_client(
            Config.SUPABASE_URL,
            Config.SUPABASE_SERVICE_KEY,  # Backend uses service role key for full access
        )
        logger.info("Supabase client initialized successfully")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        raise


# Global client instance
supabase = get_supabase_client()
