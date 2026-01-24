"""
Standalone API Server for Railway Deployment
This runs ONLY the FastAPI server without the bot
"""

import os
import uvicorn
from api.main import app, init_app

# Create a minimal mock instance for API-only mode
# This allows the API to work even without the full bot running
class MockBot:
    """Minimal mock bot instance for API-only mode"""
    def __init__(self):
        self.running = False
        self._running = False
        self._paused = False
        self._scan_count = 0
        self._tokens_analyzed = 0
        self._high_score_count = 0
        
    async def start(self):
        """Mock start method"""
        pass
        
    async def stop(self):
        """Mock stop method"""
        pass

if __name__ == "__main__":
    # Initialize app with mock bot instance (for API-only mode)
    # This allows routes that need bot instance to work
    mock_bot = MockBot()
    api_app = init_app(mock_bot)
    
    # Get port from environment variable (Railway/Heroku) or default to 8000
    port = int(os.environ.get("PORT", 8000))
    
    print(f"🚀 Starting SolanaHunter API Server on port {port}")
    print(f"📡 API-only mode (bot disabled)")
    
    # Run the server
    uvicorn.run(
        api_app,
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True
    )