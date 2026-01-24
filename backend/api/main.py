"""
FastAPI REST API Server for SolanaHunter Dashboard

📋 מה הקובץ הזה עושה:
-------------------
מספק REST API endpoints לדשבורד:
- GET /api/tokens - רשימת טוקנים
- GET /api/bot/status - מצב הבוט
- POST /api/bot/start - הפעלת בוט
- ועוד...

💡 איך זה עובד:
1. יוצר FastAPI app
2. מגדיר CORS (לאפשר קריאות מ-frontend)
3. כולל את כל ה-routes
4. מספק health check endpoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os

from api.routes import tokens, bot, portfolio, trading, analytics, settings, dexscreener
from api.dependencies import set_solanahunter_instance

# יצירת FastAPI app
app = FastAPI(
    title="SolanaHunter API",
    description="REST API for SolanaHunter Dashboard",
    version="1.0.0",
)

# CORS configuration - מאפשר קריאות מ-frontend
# FastAPI לא תומך ב-wildcards ב-allow_origins, אז משתמשים ב-allow_origin_regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://solana-hunter.vercel.app",  # Production domain
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # כל ה-Vercel preview deployments
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routes
app.include_router(tokens.router, prefix="/api/tokens", tags=["tokens"])
app.include_router(bot.router, prefix="/api/bot", tags=["bot"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(trading.router, prefix="/api/trading", tags=["trading"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(dexscreener.router, prefix="/api/dexscreener", tags=["dexscreener"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "SolanaHunter API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "type": type(exc).__name__}
    )


def init_app(solanahunter_instance):
    """Initialize the app with SolanaHunter instance"""
    set_solanahunter_instance(solanahunter_instance)
    return app


def run_server(host: str = "0.0.0.0", port: int = None):
    """Run the FastAPI server"""
    # Get port from environment variable (Railway/Heroku) or use provided/default
    if port is None:
        port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host=host, port=port)
