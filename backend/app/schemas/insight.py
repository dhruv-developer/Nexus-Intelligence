from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class InsightCreate(BaseModel):
    title: str
    headline: str
    explanation: str
    summary: Optional[str] = None
    insight_type: str
    confidence_score: Optional[float] = None
    significance_score: Optional[float] = None
    key_drivers: Optional[List[str]] = []
    recommendations: Optional[List[str]] = []
    query_id: Optional[uuid.UUID] = None
    dataset_id: Optional[uuid.UUID] = None


class InsightResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    query_id: Optional[uuid.UUID] = None
    dataset_id: Optional[uuid.UUID] = None
    title: str
    headline: str
    explanation: str
    summary: Optional[str] = None
    insight_type: str
    confidence_score: Optional[float] = None
    significance_score: Optional[float] = None
    key_drivers: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    status: str
    is_bookmarked: bool
    is_shared: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InsightVisualizationResponse(BaseModel):
    id: uuid.UUID
    insight_id: uuid.UUID
    chart_type: str
    title: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    data: Dict[str, Any]
    is_interactive: bool
    display_order: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
