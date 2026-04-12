from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    file_name: str
    file_path: str
    file_size: int
    file_type: str


class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class DatasetResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: Optional[str] = None
    file_name: str
    file_type: str
    file_size: int
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    processing_status: str
    data_quality_score: Optional[int] = None
    is_active: bool
    is_public: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_accessed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DatasetColumnResponse(BaseModel):
    id: uuid.UUID
    name: str
    display_name: Optional[str]
    data_type: str
    null_count: Optional[int]
    unique_count: Optional[int]
    is_numeric: bool
    is_temporal: bool
    is_categorical: bool
    suggested_visualization: Optional[str]

    class Config:
        from_attributes = True
