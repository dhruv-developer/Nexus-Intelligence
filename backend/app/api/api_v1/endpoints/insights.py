from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas.insight import InsightCreate, InsightResponse, InsightVisualizationResponse
from app.services.insight_service import InsightService

router = APIRouter()
insight_service = InsightService()


@router.post("/", response_model=InsightResponse)
async def create_insight(
    insight_data: InsightCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new insight"""
    try:
        insight = await insight_service.create_insight(insight_data, user_id, db)
        return InsightResponse.model_validate(insight)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[InsightResponse])
async def get_insights(
    limit: int = 50,
    offset: int = 0,
    query_id: str = None,
    dataset_id: str = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get user's insights"""
    try:
        insights = await insight_service.get_user_insights(
            user_id=user_id,
            db=db,
            limit=limit,
            offset=offset,
            query_id=query_id,
            dataset_id=dataset_id
        )
        return [InsightResponse.model_validate(insight) for insight in insights]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving insights: {str(e)}"
        )


@router.get("/{insight_id}", response_model=InsightResponse)
async def get_insight(
    insight_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific insight"""
    try:
        insight = await insight_service.get_insight(insight_id, user_id, db)
        if not insight:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insight not found"
            )
        return InsightResponse.model_validate(insight)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/{insight_id}/bookmark")
async def toggle_bookmark(
    insight_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Toggle insight bookmark status"""
    try:
        insight = await insight_service.toggle_bookmark(insight_id, user_id, db)
        return {"is_bookmarked": insight.is_bookmarked}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/{insight_id}/visualizations", response_model=List[InsightVisualizationResponse])
async def get_insight_visualizations(
    insight_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get insight visualizations"""
    try:
        visualizations = await insight_service.get_insight_visualizations(insight_id, user_id, db)
        return [InsightVisualizationResponse.model_validate(viz) for viz in visualizations]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
