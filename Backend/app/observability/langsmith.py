# app/observability/langsmith.py
# LangSmith tracing integration for pipeline observability

import os
from app.config import get_settings
from app.observability.logging import get_logger

logger = get_logger(__name__)


def setup_langsmith() -> bool:
    """
    Configure LangSmith tracing via environment variables.
    LangChain/LangGraph automatically pick up these env vars.

    Returns:
        True if LangSmith is configured, False otherwise.
    """
    settings = get_settings()

    if not settings.langsmith_api_key:
        logger.info("langsmith_disabled", reason="No API key provided")
        return False

    os.environ["LANGCHAIN_TRACING_V2"] = str(settings.langsmith_tracing_v2).lower()
    os.environ["LANGCHAIN_API_KEY"] = settings.langsmith_api_key
    os.environ["LANGCHAIN_PROJECT"] = settings.langsmith_project

    logger.info(
        "langsmith_enabled",
        project=settings.langsmith_project,
    )
    return True


def get_trace_config(
    run_name: str,
    input_type: str,
    metadata: dict | None = None,
) -> dict:
    """
    Build configuration dict for LangGraph invoke calls.
    This attaches metadata and tags to the LangSmith trace.

    Args:
        run_name: Human-readable name for this trace run.
        input_type: The content type being analyzed (text/image/video).
        metadata: Additional key-value metadata.

    Returns:
        Config dict to pass to workflow.invoke().
    """
    tags = [f"input:{input_type}", "hubble-moderation"]
    config = {
        "run_name": run_name,
        "tags": tags,
        "metadata": metadata or {},
    }
    return {"configurable": config}
