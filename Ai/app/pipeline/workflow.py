# app/pipeline/workflow.py
# LangGraph state machine — orchestrates the full moderation pipeline

from __future__ import annotations
from typing import Any, TypedDict, Literal
from dataclasses import asdict

from langgraph.graph import StateGraph, END

from app.pipeline.preprocessor import (
    Preprocessor,
    ProcessedText,
    ProcessedImage,
    ProcessedVideo,
)
from app.pipeline.fast_filter import FastFilter, FilterResult
from app.pipeline.risk_scorer import RiskScorer, RiskScore
from app.pipeline.deep_analyzer import DeepAnalyzer, DeepAnalysisResult
from app.pipeline.decision_engine import DecisionEngine, Decision
from app.services.mongo_service import mongo_service
from app.services.redis_service import redis_service
from app.observability.logging import get_logger

logger = get_logger(__name__)


# ──────────────────────────────────────────────
# Pipeline State Schema
# ──────────────────────────────────────────────

class PipelineState(TypedDict, total=False):
    """State that flows through the LangGraph pipeline."""
    # Input
    input_type: str  # "text", "image", "video"
    raw_content: Any  # str for text, bytes for image/video
    user_id: str | None

    # Preprocessed
    processed_text: ProcessedText | None
    processed_image: ProcessedImage | None
    processed_video: ProcessedVideo | None

    # Pipeline stages
    filter_result: FilterResult | None
    filter_results: list[FilterResult]  # For video (multiple frames)
    risk_score: RiskScore | None
    deep_result: DeepAnalysisResult | None
    decision: Decision | None

    # Context
    user_history: dict | None

    # Metadata
    error: str | None


# ──────────────────────────────────────────────
# Pipeline Node Functions
# ──────────────────────────────────────────────

preprocessor = Preprocessor()
fast_filter = FastFilter()
risk_scorer = RiskScorer()
deep_analyzer = DeepAnalyzer()
decision_engine = DecisionEngine()


async def preprocess_node(state: PipelineState) -> dict:
    """Node 1: Preprocess the raw input."""
    input_type = state["input_type"]
    raw = state["raw_content"]

    try:
        if input_type == "text":
            processed = preprocessor.process_text(raw)
            return {"processed_text": processed}

        elif input_type == "image":
            processed = preprocessor.process_image(raw)
            return {"processed_image": processed}

        elif input_type == "video":
            processed = preprocessor.process_video(raw)
            return {"processed_video": processed}

        else:
            return {"error": f"Unknown input type: {input_type}"}

    except Exception as e:
        logger.error("preprocess_failed", error=str(e))
        return {"error": f"Preprocessing failed: {str(e)}"}


async def fetch_user_history_node(state: PipelineState) -> dict:
    """Node 1b: Fetch user moderation history (parallel with preprocess)."""
    user_id = state.get("user_id")
    if not user_id:
        return {"user_history": None}

    # Try Redis cache first
    cached = await redis_service.get_user_history(user_id)
    if cached:
        return {"user_history": cached}

    # Fall back to MongoDB
    history = await mongo_service.get_user_history(user_id)
    if history:
        await redis_service.cache_user_history(user_id, history)
    return {"user_history": history}


async def fast_filter_node(state: PipelineState) -> dict:
    """Node 2: Run fast AI filter."""
    input_type = state["input_type"]

    try:
        if input_type == "text" and state.get("processed_text"):
            result = fast_filter.filter_text(state["processed_text"])
            return {"filter_result": result}

        elif input_type == "image" and state.get("processed_image"):
            result = fast_filter.filter_image(state["processed_image"])
            return {"filter_result": result}

        elif input_type == "video" and state.get("processed_video"):
            # Analyze each frame, take the worst result
            video = state["processed_video"]
            frame_results = []
            for frame in video.frames:
                result = fast_filter.filter_image(frame)
                frame_results.append(result)

            # Use the highest-risk frame as the representative result
            if frame_results:
                worst = max(frame_results, key=lambda r: r.max_score)
                return {
                    "filter_result": worst,
                    "filter_results": frame_results,
                }
            else:
                return {
                    "filter_result": FilterResult(
                        input_type="video",
                        is_flagged=False,
                        max_score=0.0,
                    )
                }

        return {"error": "No processed content available for filtering"}

    except Exception as e:
        logger.error("fast_filter_failed", error=str(e))
        return {"error": f"Fast filter failed: {str(e)}"}


async def risk_score_node(state: PipelineState) -> dict:
    """Node 3: Compute composite risk score."""
    filter_result = state.get("filter_result")
    if not filter_result:
        return {"error": "No filter result to score"}

    try:
        user_history = state.get("user_history")
        score = risk_scorer.score(filter_result, user_history)
        return {"risk_score": score}
    except Exception as e:
        logger.error("risk_score_failed", error=str(e))
        return {"error": f"Risk scoring failed: {str(e)}"}


def route_by_risk(state: PipelineState) -> str:
    """
    Conditional router: decides whether to do deep analysis or skip to decision.

    - LOW / MEDIUM → skip directly to decision
    - HIGH → go to deep analysis
    """
    risk = state.get("risk_score")
    if risk and risk.level == "HIGH":
        return "deep_analysis"
    return "decide"


async def deep_analysis_node(state: PipelineState) -> dict:
    """Node 4 (conditional): Deep analysis with CLIP + Gemini."""
    input_type = state["input_type"]
    filter_result = state.get("filter_result")

    try:
        if input_type == "text" and state.get("processed_text"):
            result = await deep_analyzer.analyze_text(
                state["processed_text"].cleaned,
                filter_result,
            )
            return {"deep_result": result}

        elif input_type in ("image", "video") and state.get("processed_image"):
            result = await deep_analyzer.analyze_image(
                state["processed_image"].image,
                filter_result,
            )
            return {"deep_result": result}

        elif input_type == "video" and state.get("processed_video"):
            # Use the worst frame for deep analysis
            video = state["processed_video"]
            if video.frames:
                # Find the worst frame based on filter_results
                worst_frame = video.frames[0]
                filter_results = state.get("filter_results", [])
                if filter_results:
                    worst_idx = max(
                        range(len(filter_results)),
                        key=lambda i: filter_results[i].max_score,
                    )
                    if worst_idx < len(video.frames):
                        worst_frame = video.frames[worst_idx]

                result = await deep_analyzer.analyze_image(
                    worst_frame.image,
                    filter_result,
                )
                return {"deep_result": result}

        return {"deep_result": None}

    except Exception as e:
        logger.error("deep_analysis_failed", error=str(e))
        return {"deep_result": None}


async def decision_node(state: PipelineState) -> dict:
    """Node 5: Final decision."""
    risk = state.get("risk_score")
    if not risk:
        # Emergency fallback
        return {
            "decision": Decision(
                action="WARNING",
                reason="Pipeline error: no risk score available",
                severity="medium",
            )
        }

    try:
        deep_result = state.get("deep_result")
        user_history = state.get("user_history")
        decision = decision_engine.decide(risk, deep_result, user_history)
        return {"decision": decision}
    except Exception as e:
        logger.error("decision_failed", error=str(e))
        return {
            "decision": Decision(
                action="WARNING",
                reason=f"Decision engine error: {str(e)}",
                severity="medium",
            )
        }


# ──────────────────────────────────────────────
# Build the LangGraph Workflow
# ──────────────────────────────────────────────

def build_moderation_workflow():
    """
    Construct and compile the LangGraph moderation pipeline.

    Flow:
        preprocess → fast_filter → risk_score
            ├─ LOW/MEDIUM → decide
            └─ HIGH → deep_analysis → decide

    Returns:
        Compiled LangGraph workflow.
    """
    graph = StateGraph(PipelineState)

    # Add nodes
    graph.add_node("preprocess", preprocess_node)
    graph.add_node("fetch_history", fetch_user_history_node)
    graph.add_node("fast_filter", fast_filter_node)
    graph.add_node("risk_score", risk_score_node)
    graph.add_node("deep_analysis", deep_analysis_node)
    graph.add_node("decide", decision_node)

    # Define edges
    graph.set_entry_point("preprocess")

    # After preprocess, run fast filter
    graph.add_edge("preprocess", "fast_filter")

    # After fast filter, compute risk score
    graph.add_edge("fast_filter", "risk_score")

    # Conditional routing based on risk level
    graph.add_conditional_edges(
        "risk_score",
        route_by_risk,
        {
            "deep_analysis": "deep_analysis",
            "decide": "decide",
        },
    )

    # Deep analysis flows to decision
    graph.add_edge("deep_analysis", "decide")

    # Decision is the terminal node
    graph.add_edge("decide", END)

    # Compile
    workflow = graph.compile()
    logger.info("moderation_workflow_compiled")
    return workflow


# Global compiled workflow (initialized at startup)
moderation_workflow = None


def get_workflow():
    """Get or create the compiled moderation workflow."""
    global moderation_workflow
    if moderation_workflow is None:
        moderation_workflow = build_moderation_workflow()
    return moderation_workflow
