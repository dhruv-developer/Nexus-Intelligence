from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class QueryCreate(BaseModel):
    original_query: str
    dataset_id: Optional[uuid.UUID] = None
    query_type: Optional[str] = "descriptive"


class QueryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    dataset_id: Optional[uuid.UUID] = None
    original_query: str
    processed_query: Optional[str] = None
    query_type: str
    intent: Optional[str] = None
    entities: Optional[Dict[str, Any]] = None
    confidence_score: Optional[int] = None
    status: str
    execution_time_ms: Optional[int] = None
    rows_processed: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class QueryExecutionResponse(BaseModel):
    id: uuid.UUID
    query_id: uuid.UUID
    execution_step: str
    status: str
    input_data: Optional[Dict[str, Any]]
    output_data: Optional[Dict[str, Any]]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    duration_ms: Optional[int]
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
