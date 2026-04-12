from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class ChatMessage(BaseModel):
    content: str
    dataset_context: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    message: str
    insights: Optional[Dict[str, Any]] = None
    query_type: str
    confidence: float
    suggestions: Optional[List[str]] = []
    timestamp: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChatHistoryResponse(BaseModel):
    id: uuid.UUID
    user_message: str
    ai_response: str
    insights: Optional[Dict[str, Any]]
    query_type: str
    confidence: float
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ForecastRequest(BaseModel):
    data: List[Dict[str, Any]]
    periods: int = 4
    metric_column: str = "value"
    date_column: str = "date"


class ScenarioRequest(BaseModel):
    base_data: Dict[str, Any]
    scenario_params: Dict[str, Any]
    comparison_metrics: List[str] = []


class InsightRequest(BaseModel):
    query_result: Dict[str, Any]
    data_summary: Dict[str, Any]
    insight_types: Optional[List[str]] = None  # trend, anomaly, correlation, etc.
