# app/main.py
# FastAPI application factory — entry point for the Hubble AI Engine

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.observability.logging import setup_logging, get_logger
from app.observability.langsmith import setup_langsmith
from app.models.model_registry import model_registry
from app.services.redis_service import redis_service
from app.services.mongo_service import mongo_service
from app.services.gemini_service import gemini_service
from app.pipeline.workflow import get_workflow
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Startup:
    1. Configure logging
    2. Setup LangSmith tracing
    3. Connect MongoDB & Redis
    4. Initialize Gemini service
    5. Load all ML models
    6. Compile LangGraph workflow

    Shutdown:
    1. Disconnect MongoDB & Redis
    """
    logger = get_logger(__name__)
    settings = get_settings()

    # ── Startup ──
    logger.info("=" * 60)
    logger.info("🚀 HUBBLE AI ENGINE — Starting up...")
    logger.info("=" * 60)

    # 1. LangSmith
    langsmith_ok = setup_langsmith()
    logger.info("langsmith", enabled=langsmith_ok)

    # 2. MongoDB
    logger.info("connecting_mongodb")
    await mongo_service.connect()

    # 3. Redis
    logger.info("connecting_redis")
    await redis_service.connect()

    # 4. Gemini
    logger.info("initializing_gemini")
    gemini_service.initialize()

    # 5. ML Models
    logger.info("loading_models")
    model_status = await model_registry.load_all()
    logger.info("models_loaded", status=model_status)

    # 6. LangGraph Workflow
    logger.info("compiling_workflow")
    get_workflow()

    logger.info("=" * 60)
    logger.info("✅ HUBBLE AI ENGINE — Ready!")
    logger.info(f"   Environment: {settings.env}")
    logger.info(f"   Port: {settings.port}")
    logger.info(f"   Docs: http://localhost:{settings.port}/docs")
    logger.info("=" * 60)

    yield  # ── Application runs here ──

    # ── Shutdown ──
    logger.info("🛑 HUBBLE AI ENGINE — Shutting down...")
    await redis_service.disconnect()
    await mongo_service.disconnect()
    logger.info("Shutdown complete")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    # Configure logging first
    setup_logging()

    app = FastAPI(
        title="Hubble AI Engine — Cyberbullying Detection API",
        description=(
            "Production-grade content moderation pipeline with layered AI analysis. "
            "Supports text, image, and video inputs with risk-based routing."
        ),
        version="4.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if not settings.is_production else [
            "https://hubble.app",
            "https://www.hubble.app",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount routes
    app.include_router(api_router)

    # Root redirect
    @app.get("/", include_in_schema=False)
    async def root():
        return JSONResponse({
            "name": "Hubble AI Engine",
            "version": "4.0.0",
            "docs": "/docs",
            "health": "/health",
            "endpoints": {
                "text": "POST /api/v1/analyze/text",
                "image": "POST /api/v1/analyze/image",
                "video": "POST /api/v1/analyze/video",
                "history": "GET /api/v1/history/{user_id}",
            },
        })

    return app


# Create the app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=not settings.is_production,
    )
