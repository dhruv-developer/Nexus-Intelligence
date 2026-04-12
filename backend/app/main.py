from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging

from app.api.api_v1.api import api_router
from app.core.config import settings
from app.core.security import setup_security_middleware
from app.core.database import init_db
from app.services.ai_service import AIService
from app.utils.logging import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Global AI service instance
ai_service = AIService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Nexus Intelligence Backend...")

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Initialize AI service
    await ai_service.initialize()
    logger.info("AI service initialized")

    yield

    # Shutdown
    logger.info("Shutting down Nexus Intelligence Backend...")


app = FastAPI(
    title="Nexus Intelligence API",
    description="AI-powered decision intelligence platform backend",
    version="1.0.0",
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom security middleware
setup_security_middleware(app)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header to responses"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "nexus-intelligence-backend"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Nexus Intelligence API",
        "version": "1.0.0",
        "docs": f"{settings.API_V1_STR}/docs"
    }


# ---------------------------------------------------------------------------
# DEBUG-ONLY endpoints — registered only when DEBUG=true in .env
# These endpoints are never exposed in production.
# ---------------------------------------------------------------------------
if settings.DEBUG:

    @app.get("/debug-jwt")
    async def debug_jwt():
        """Debug JWT token generation and validation (DEBUG only)"""
        from app.core.security import create_access_token, verify_token
        from datetime import datetime
        test_token = create_access_token(data={"sub": "test-user-id"})
        try:
            payload = verify_token(test_token, "access")
            return {
                "token_generated": True,
                "token_verified": True,
                "payload": payload,
                "current_time": datetime.now(timezone.utc).isoformat(),
                "token_expires": datetime.fromtimestamp(payload.get("exp")).isoformat()
            }
        except Exception as e:
            return {"token_generated": True, "token_verified": False, "error": str(e)}

    @app.get("/debug-db")
    async def debug_db():
        """Debug database connection — returns live row counts (DEBUG only)"""
        from app.core.database import get_db
        from sqlalchemy import text
        from datetime import datetime
        import time as _time
        start = _time.time()
        try:
            async for db in get_db():
                users = (await db.execute(text("SELECT COUNT(*) FROM users"))).fetchone()[0]
                datasets = (await db.execute(text("SELECT COUNT(*) FROM datasets"))).fetchone()[0]
                queries = (await db.execute(text("SELECT COUNT(*) FROM queries"))).fetchone()[0]
                return {
                    "status": "ok",
                    "execution_ms": round((_time.time() - start) * 1000, 2),
                    "counts": {"users": users, "datasets": datasets, "queries": queries},
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
        except Exception as e:
            return {"status": "error", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
