"""
LiveKit Agent Worker
Entry point for running the voice agent server
"""

import os
import logging
from dotenv import load_dotenv

from livekit.agents import WorkerOptions, cli
from agent import entrypoint

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger("worker")


def main():
    """Start the LiveKit agent worker"""
    logger.info("Starting LiveKit Voice Agent Worker")
    logger.info(f"Backend URL: {os.getenv('BACKEND_URL', 'http://localhost:8000')}")
    logger.info(f"LiveKit URL: {os.getenv('LIVEKIT_URL', 'ws://localhost:7880')}")
    
    # Run the agent worker
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )


if __name__ == "__main__":
    main()
