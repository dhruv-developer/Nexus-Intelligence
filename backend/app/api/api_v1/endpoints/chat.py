from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timezone
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas.chat import ChatMessage, ChatResponse, ChatHistoryResponse
from app.services.chat_service import ChatService
from app.services.ai_service import AIService
from app.models.dataset import Dataset

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
chat_service = ChatService()
ai_service = AIService()


async def _get_user_datasets(user_id: str, db: AsyncSession, dataset_id: str = None) -> list:
    """Load the user's completed datasets from DB and return dicts with file paths."""
    try:
        query = select(Dataset).where(
            Dataset.user_id == user_id,
            Dataset.processing_status == "completed",
            Dataset.is_active == True
        )
        if dataset_id:
            query = query.where(Dataset.id == dataset_id)

        result = await db.execute(query)
        datasets = result.scalars().all()

        return [
            {
                "id": str(ds.id),
                "name": ds.name,
                "file_path": ds.file_path,
                "row_count": ds.row_count,
                "column_count": ds.column_count,
                "description": ds.description,
            }
            for ds in datasets
        ]
    except Exception as e:
        return []


@router.post("/message", response_model=ChatResponse)
@limiter.limit("60/minute")
async def send_message(
    request: Request,
    message: ChatMessage,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Send a chat message and get a data-grounded AI response"""
    try:
        # Load real datasets from disk
        dataset_id = None
        if message.dataset_context and isinstance(message.dataset_context, dict):
            dataset_id = message.dataset_context.get("dataset_id")

        datasets = await _get_user_datasets(user_id, db, dataset_id)

        # Get a grounded answer using real data
        result = await ai_service.answer_with_data(
            question=message.content,
            datasets=datasets,
            dataset_context=message.dataset_context,
        )

        reply    = result.get("reply", "")
        insights = result.get("insights") or {}
        confidence = float(insights.get("confidence_score", 0.8))

        # Save to conversation history
        await chat_service.save_conversation(
            user_id=user_id,
            user_message=message.content,
            ai_response=result,
            insights=insights if insights else None,
            db=db
        )

        return ChatResponse(
            message=reply,
            insights=insights if insights else None,
            query_type=insights.get("query_type", "descriptive"),
            confidence=confidence,
            suggestions=[],
            timestamp=datetime.now(timezone.utc)
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )


@router.get("/history", response_model=List[ChatHistoryResponse])
async def get_chat_history(
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get chat history for the current user"""
    try:
        history = await chat_service.get_conversation_history(
            user_id=user_id,
            db=db,
            limit=limit,
            offset=offset
        )
        return history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving chat history: {str(e)}"
        )


@router.delete("/history")
async def clear_chat_history(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Clear chat history for the current user"""
    try:
        await chat_service.clear_conversation_history(user_id=user_id, db=db)
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing chat history: {str(e)}"
        )


@router.post("/forecast")
async def generate_forecast(
    forecast_request: dict,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Generate forecast for given data"""
    try:
        data    = forecast_request.get("data", [])
        periods = forecast_request.get("periods", 4)

        if not data:
            # Auto-load from datasets if no explicit data
            datasets = await _get_user_datasets(user_id, db)
            if datasets:
                result = await ai_service.answer_with_data(
                    question=f"Generate a {periods}-period forecast with confidence bands. "
                             "Identify seasonal patterns and trends. Return values as a time series.",
                    datasets=datasets,
                )
                return result

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data provided for forecasting"
            )

        forecast = await ai_service.generate_forecast(data=data, forecast_periods=periods)
        return forecast

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating forecast: {str(e)}"
        )


@router.post("/simulate")
async def simulate_scenario(
    scenario_request: dict,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Simulate different scenarios"""
    try:
        base_data      = scenario_request.get("base_data", {})
        scenario_params = scenario_request.get("scenario_params", {})
        if not base_data or not scenario_params:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Base data and scenario parameters are required"
            )
        simulation = await ai_service.simulate_scenario(
            base_data=base_data,
            scenario_params=scenario_params
        )
        return simulation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error simulating scenario: {str(e)}"
        )
