from typing import Dict, List, Optional, Any
import json
import logging
import os
import re
import pandas as pd
from datetime import datetime, timezone

from openai import AsyncOpenAI
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.callbacks import get_openai_callback

from app.core.config import settings

logger = logging.getLogger(__name__)

# Max rows to send to the model for context (keeps token cost low)
MAX_DATA_ROWS = 80


class AIService:
    """Service for AI-powered query processing and insight generation"""

    def __init__(self):
        self.client = None
        self.chat_model = None
        self.initialized = False

    async def initialize(self):
        """Initialize AI service with OpenAI client"""
        try:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.chat_model = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                temperature=settings.OPENAI_TEMPERATURE,
                openai_api_key=settings.OPENAI_API_KEY,
                max_tokens=settings.OPENAI_MAX_TOKENS
            )
            self.initialized = True
            logger.info("AI service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AI service: {e}")
            raise

    # ─────────────────────────────────────────────────────────────────────────
    # Public API — used by the chat endpoint
    # ─────────────────────────────────────────────────────────────────────────

    async def answer_with_data(
        self,
        question: str,
        datasets: List[Dict[str, Any]],   # list of {name, file_path, row_count, column_count}
        dataset_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Core chat method: load real CSV data, build a grounded prompt, and
        return an answer together with structured insights.
        """
        if not self.initialized:
            await self.initialize()

        # ── 1. Load data from disk ─────────────────────────────────────────
        data_blocks: List[str] = []
        for ds in datasets:
            file_path = ds.get("file_path", "")
            name      = ds.get("name", os.path.basename(file_path))
            if not file_path or not os.path.exists(file_path):
                continue
            try:
                ext = os.path.splitext(file_path)[1].lower()
                if ext == ".csv":
                    df = pd.read_csv(file_path)
                elif ext in (".xlsx", ".xls"):
                    df = pd.read_excel(file_path)
                else:
                    continue

                rows_used = min(len(df), MAX_DATA_ROWS)
                sample    = df.head(rows_used)

                stats_lines = []
                for col in df.select_dtypes(include="number").columns[:10]:
                    stats_lines.append(
                        f"  {col}: min={df[col].min():.2f} max={df[col].max():.2f} "
                        f"mean={df[col].mean():.2f} sum={df[col].sum():.2f}"
                    )

                block = (
                    f"### Dataset: {name} ({len(df)} rows × {len(df.columns)} columns)\n"
                    f"Columns: {', '.join(df.columns.tolist())}\n"
                    + (f"Numeric stats:\n" + "\n".join(stats_lines) + "\n" if stats_lines else "")
                    + f"\nFirst {rows_used} rows (CSV):\n"
                    + sample.to_csv(index=False)
                )
                data_blocks.append(block)
            except Exception as e:
                logger.warning(f"Could not load {file_path}: {e}")

        has_data = bool(data_blocks)

        # ── 2. Build system prompt ─────────────────────────────────────────
        if has_data:
            system_prompt = (
                "You are Nexus Intelligence, an expert data analyst AI embedded in a banking analytics platform.\n"
                "You have been given the user's ACTUAL uploaded data below. "
                "Answer the user's question using ONLY the data provided — be specific, cite numbers, "
                "identify top performers, trends, anomalies, and give concrete recommendations.\n"
                "Do NOT say you cannot access data. The data IS provided to you.\n\n"
                "After your main answer, output a JSON block wrapped in ```json ... ``` with this structure:\n"
                "```json\n"
                "{\n"
                '  "title": "Short result title",\n'
                '  "headline": "One-sentence key finding",\n'
                '  "explanation": "Full answer text (same as your main answer)",\n'
                '  "key_drivers": ["finding 1", "finding 2", ...],\n'
                '  "recommendations": ["action 1", "action 2", ...],\n'
                '  "confidence_score": 0.85\n'
                "}\n"
                "```\n\n"
                "DATA:\n"
                + "\n\n".join(data_blocks)
            )
        else:
            system_prompt = (
                "You are Nexus Intelligence, an AI analyst for a banking analytics platform.\n"
                "The user has not yet uploaded any datasets, or the datasets could not be read.\n"
                "Politely tell them to upload a dataset first, and explain what kinds of analysis "
                "you can perform once they do.\n\n"
                "Still output a JSON block:\n"
                "```json\n"
                "{\n"
                '  "title": "No data available",\n'
                '  "headline": "Please upload a dataset to get data-driven answers",\n'
                '  "explanation": "...",\n'
                '  "key_drivers": [],\n'
                '  "recommendations": ["Upload a CSV or Excel file from the Datasets page"],\n'
                '  "confidence_score": 0.0\n'
                "}\n"
                "```"
            )

        # ── 3. Call the model ──────────────────────────────────────────────
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=question)
            ]
            with get_openai_callback() as cb:
                response = await self.chat_model.ainvoke(messages)

            raw = response.content

            # ── 4. Split prose reply from JSON block ───────────────────────
            json_match = re.search(r"```json\s*(\{.*?\})\s*```", raw, re.DOTALL)
            if json_match:
                prose = raw[:json_match.start()].strip()
                try:
                    structured = json.loads(json_match.group(1))
                except Exception:
                    structured = {}
            else:
                prose      = raw.strip()
                structured = {}

            # If prose is empty, use explanation from JSON
            if not prose:
                prose = structured.get("explanation", raw)

            return {
                "reply":     prose,
                "insights":  structured,
                "has_data":  has_data,
                "tokens_used": cb.total_tokens,
                "processing_time": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:
            logger.error(f"AI answer_with_data error: {e}")
            return {
                "reply": f"I encountered an error processing your request: {e}",
                "insights": {},
                "has_data": has_data,
                "error": str(e),
            }

    # ─────────────────────────────────────────────────────────────────────────
    # Legacy helpers (kept for forecast / scenario / query service compatibility)
    # ─────────────────────────────────────────────────────────────────────────

    async def process_query(self, query: str, dataset_context: Optional[Dict] = None) -> Dict[str, Any]:
        """Intent classification — used by query_service only"""
        if not self.initialized:
            await self.initialize()
        try:
            system_prompt = self._get_query_processing_prompt(dataset_context)
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=query)
            ]
            with get_openai_callback() as cb:
                response = await self.chat_model.ainvoke(messages)
            result = self._parse_query_response(response.content)
            result["tokens_used"] = cb.total_tokens
            return result
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {"error": str(e), "query_type": "unknown", "entities": {}, "confidence": 0}

    async def generate_insight(self, query_result: Dict, data_summary: Dict) -> Dict[str, Any]:
        """Structured insight generation (used by query_service)"""
        if not self.initialized:
            await self.initialize()
        try:
            system_prompt = self._get_insight_generation_prompt(data_summary)
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=json.dumps(query_result, indent=2))
            ]
            with get_openai_callback() as cb:
                response = await self.chat_model.ainvoke(messages)
            insight = self._parse_insight_response(response.content)
            insight["tokens_used"] = cb.total_tokens
            return insight
        except Exception as e:
            logger.error(f"Error generating insight: {e}")
            return {"error": str(e), "headline": "Unable to generate insight", "explanation": str(e)}

    async def generate_forecast(self, data: List[Dict], forecast_periods: int = 4) -> Dict[str, Any]:
        """Generate time series forecast"""
        if not self.initialized:
            await self.initialize()
        try:
            data_summary = self._summarize_time_series_data(data)
            system_prompt = self._get_forecasting_prompt(data_summary, forecast_periods)
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=json.dumps(data, indent=2))
            ]
            with get_openai_callback() as cb:
                response = await self.chat_model.ainvoke(messages)
            forecast = self._parse_forecast_response(response.content)
            forecast.update({
                "tokens_used": cb.total_tokens,
                "forecast_periods": forecast_periods,
                "generated_at": datetime.now(timezone.utc).isoformat(),
            })
            return forecast
        except Exception as e:
            logger.error(f"Error generating forecast: {e}")
            return {"error": str(e), "forecast": [], "confidence": 0.0}

    async def simulate_scenario(self, base_data: Dict, scenario_params: Dict) -> Dict[str, Any]:
        """Simulate different scenarios"""
        if not self.initialized:
            await self.initialize()
        try:
            system_prompt = self._get_scenario_simulation_prompt(base_data, scenario_params)
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=json.dumps({"base_data": base_data, "scenario": scenario_params}, indent=2))
            ]
            with get_openai_callback() as cb:
                response = await self.chat_model.ainvoke(messages)
            sim = self._parse_scenario_response(response.content)
            sim["tokens_used"] = cb.total_tokens
            return sim
        except Exception as e:
            logger.error(f"Error simulating scenario: {e}")
            return {"error": str(e), "results": {}, "overall_impact": "unknown"}

    # ─────────────────────────────────────────────────────────────────────────
    # Private prompt helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _get_query_processing_prompt(self, dataset_context: Optional[Dict]) -> str:
        base = (
            "You are a business intelligence AI. Analyse the user query and return ONLY a JSON object:\n"
            '{"query_type":"descriptive|diagnostic|predictive|prescriptive","intent":"...","time_period":"...",'
            '"dimensions":[...],"confidence":0-100,"entities":{}}'
        )
        if dataset_context:
            base += f"\n\nDataset Context:\n{json.dumps(dataset_context, indent=2)}"
        return base

    def _get_insight_generation_prompt(self, data_summary: Dict) -> str:
        return (
            f"You are a business intelligence expert. Data Summary: {json.dumps(data_summary, indent=2)}\n"
            "Analyse and return ONLY JSON:\n"
            '{"headline":"...","explanation":"...","key_drivers":[...],"recommendations":[...],'
            '"confidence":0.0-1.0,"significance":0.0-1.0}'
        )

    def _get_forecasting_prompt(self, data_summary: Dict, periods: int) -> str:
        return (
            f"You are a forecasting expert. Generate a {periods}-period forecast. "
            f"Data: {json.dumps(data_summary, indent=2)}\n"
            'Return ONLY JSON: {"forecast":[{"period":"...","value":0,"confidence_low":0,"confidence_high":0}],'
            '"trend":"upward|downward|stable","seasonality":"present|absent","confidence":0.0,"methodology":"..."}'
        )

    def _get_scenario_simulation_prompt(self, base_data: Dict, scenario: Dict) -> str:
        return (
            f"Business analyst. Base: {json.dumps(base_data, indent=2)} Scenario: {json.dumps(scenario, indent=2)}\n"
            'Return ONLY JSON: {"results":{},"overall_impact":"positive|negative|neutral",'
            '"key_factors":[...],"confidence":0.0}'
        )

    def _parse_query_response(self, response: str) -> Dict[str, Any]:
        try:
            clean = re.sub(r"```json|```", "", response).strip()
            return json.loads(clean)
        except Exception:
            return {"query_type": "descriptive", "intent": "general_analysis",
                    "time_period": "unknown", "dimensions": [], "confidence": 50,
                    "entities": {}, "raw_response": response}

    def _parse_insight_response(self, response: str) -> Dict[str, Any]:
        try:
            clean = re.sub(r"```json|```", "", response).strip()
            return json.loads(clean)
        except Exception:
            return {"headline": "Analysis Complete", "explanation": response,
                    "key_drivers": [], "recommendations": [], "confidence": 0.5}

    def _parse_forecast_response(self, response: str) -> Dict[str, Any]:
        try:
            clean = re.sub(r"```json|```", "", response).strip()
            return json.loads(clean)
        except Exception:
            return {"forecast": [], "trend": "unknown", "seasonality": "unknown",
                    "confidence": 0.5, "raw_response": response}

    def _parse_scenario_response(self, response: str) -> Dict[str, Any]:
        try:
            clean = re.sub(r"```json|```", "", response).strip()
            return json.loads(clean)
        except Exception:
            return {"results": {}, "overall_impact": "unknown",
                    "key_factors": [], "confidence": 0.5, "raw_response": response}

    def _summarize_time_series_data(self, data: List[Dict]) -> Dict[str, Any]:
        if not data:
            return {"message": "No data available"}
        values = [item.get("value", 0) for item in data if isinstance(item.get("value"), (int, float))]
        return {
            "data_points": len(data),
            "value_range": {"min": min(values), "max": max(values)} if values else None,
            "average": sum(values) / len(values) if values else None,
            "time_range": {
                "start": data[0].get("date") if data else None,
                "end": data[-1].get("date") if data else None
            }
        }
