# app/services/gemini_service.py
# Gemini API integration via LangChain for deep analysis reasoning

from app.config import get_settings
from app.observability.logging import get_logger

logger = get_logger(__name__)


class GeminiService:
    """
    Google Gemini API client powered by LangChain.

    Used in the deep analysis path for contextual reasoning
    about flagged content. Replaces the old raw REST calls
    with structured LangChain invocations for:
    - Reliable structured output (JSON)
    - Automatic retry and fallback
    - LangSmith trace integration
    """

    def __init__(self):
        self.settings = get_settings()
        self.llm = None
        self._current_key_idx = 0
        self._initialized = False

    def initialize(self) -> None:
        """Initialize the LangChain Gemini client."""
        keys = self.settings.gemini_keys_list
        if not keys:
            logger.warning("gemini_no_keys", reason="No API keys configured")
            return

        try:
            from langchain_google_genai import ChatGoogleGenerativeAI

            self.llm = ChatGoogleGenerativeAI(
                model=self.settings.gemini_model,
                google_api_key=keys[self._current_key_idx],
                temperature=0.1,
                max_output_tokens=1024,
                convert_system_message_to_human=True,
            )
            self._initialized = True
            logger.info("gemini_initialized", model=self.settings.gemini_model)
        except Exception as e:
            logger.error("gemini_init_failed", error=str(e))

    def _rotate_key(self) -> bool:
        """Rotate to the next API key. Returns False if all keys exhausted."""
        keys = self.settings.gemini_keys_list
        if not keys:
            return False

        self._current_key_idx = (self._current_key_idx + 1) % len(keys)
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI

            self.llm = ChatGoogleGenerativeAI(
                model=self.settings.gemini_model,
                google_api_key=keys[self._current_key_idx],
                temperature=0.1,
                max_output_tokens=1024,
                convert_system_message_to_human=True,
            )
            logger.info("gemini_key_rotated", key_index=self._current_key_idx)
            return True
        except Exception:
            return False

    async def analyze_text(self, text: str, context: dict | None = None) -> dict:
        """
        Perform deep contextual analysis of flagged text.

        Args:
            text: The flagged text content.
            context: Additional context (fast filter results, categories, etc.).

        Returns:
            Structured analysis with verdict, reasoning, and severity.
        """
        if not self._initialized:
            return {"error": "Gemini not initialized", "is_confirmed": False}

        from langchain_core.messages import SystemMessage, HumanMessage

        system_prompt = """You are an expert content moderator specializing in cyberbullying detection.
You are analyzing content that has been flagged as potentially harmful by automated filters.

Your task: Provide a detailed, contextual analysis. Consider:
- Intent and context (sarcasm, jokes, genuine threats)
- Severity level (mild rudeness vs. serious threats)
- Whether this constitutes cyberbullying
- Impact on minors (under 18)

Respond in this exact JSON format:
{
    "is_confirmed": true/false,
    "severity": "low" | "medium" | "high" | "critical",
    "categories": ["category1", "category2"],
    "reasoning": "Detailed explanation of your analysis",
    "recommended_action": "allow" | "warn" | "block" | "escalate",
    "confidence": 0.0-1.0
}"""

        context_str = ""
        if context:
            context_str = f"\n\nPre-filter context: {context}"

        human_message = f"""Analyze this flagged content:{context_str}

Content: "{text}"

Provide your JSON analysis:"""

        return await self._invoke(system_prompt, human_message)

    async def analyze_image(self, image_base64: str, context: dict | None = None) -> dict:
        """
        Perform deep analysis of a flagged image.

        Args:
            image_base64: Base64-encoded image.
            context: Additional context from fast filter.

        Returns:
            Structured analysis dict.
        """
        if not self._initialized:
            return {"error": "Gemini not initialized", "is_confirmed": False}

        from langchain_core.messages import SystemMessage, HumanMessage

        system_prompt = """You are an expert content moderator analyzing images for content harmful to minors.

Analyze the image for:
- Violence, gore, weapons
- Nudity, sexual content
- Drug/alcohol imagery
- Self-harm or suicide content
- Hate symbols, extremist content
- Cyberbullying imagery (humiliating photos, etc.)

Respond in this exact JSON format:
{
    "is_confirmed": true/false,
    "severity": "low" | "medium" | "high" | "critical",
    "categories": ["category1", "category2"],
    "reasoning": "Description of what was found",
    "recommended_action": "allow" | "warn" | "block" | "escalate",
    "confidence": 0.0-1.0
}"""

        context_str = f"\nPre-filter flags: {context}" if context else ""

        human_content = [
            {"type": "text", "text": f"Analyze this flagged image:{context_str}\n\nProvide your JSON analysis:"},
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
            },
        ]

        return await self._invoke_multimodal(system_prompt, human_content)

    async def _invoke(self, system_prompt: str, human_message: str) -> dict:
        """Invoke Gemini with retry on rate limits."""
        from langchain_core.messages import SystemMessage, HumanMessage
        import json

        keys = self.settings.gemini_keys_list
        attempts = max(len(keys), 1)

        for attempt in range(attempts):
            try:
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=human_message),
                ]
                response = await self.llm.ainvoke(messages)
                return self._parse_response(response.content)

            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "quota" in error_str.lower():
                    logger.warning("gemini_rate_limited", attempt=attempt)
                    if not self._rotate_key():
                        break
                else:
                    logger.error("gemini_invoke_failed", error=error_str)
                    return {"error": error_str, "is_confirmed": False}

        return {"error": "All Gemini API keys exhausted", "is_confirmed": False}

    async def _invoke_multimodal(self, system_prompt: str, human_content: list) -> dict:
        """Invoke Gemini with multimodal content."""
        from langchain_core.messages import SystemMessage, HumanMessage

        keys = self.settings.gemini_keys_list
        attempts = max(len(keys), 1)

        for attempt in range(attempts):
            try:
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=human_content),
                ]
                response = await self.llm.ainvoke(messages)
                return self._parse_response(response.content)

            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "quota" in error_str.lower():
                    if not self._rotate_key():
                        break
                else:
                    return {"error": error_str, "is_confirmed": False}

        return {"error": "All Gemini API keys exhausted", "is_confirmed": False}

    def _parse_response(self, text: str) -> dict:
        """Parse JSON from Gemini response text."""
        import json, re

        try:
            # Extract JSON block (handle markdown code fences)
            json_match = re.search(r"\{[\s\S]*\}", text)
            if json_match:
                return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

        logger.warning("gemini_parse_failed", raw_text=text[:200])
        return {
            "error": "Failed to parse Gemini response",
            "is_confirmed": False,
            "raw_response": text[:500],
        }

    @property
    def is_initialized(self) -> bool:
        return self._initialized


# Global singleton
gemini_service = GeminiService()
