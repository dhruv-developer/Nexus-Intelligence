from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas.query import QueryCreate, QueryResponse, QueryExecutionResponse
from app.services.query_service import QueryService

router = APIRouter()
query_service = QueryService()


@router.post("/", response_model=QueryResponse)
async def create_query(
    query_data: QueryCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create and execute a new query"""
    try:
        query = await query_service.create_and_execute_query(query_data, user_id, db)
        # Refresh inside the async session so all columns are loaded before
        # Pydantic accesses them (avoids MissingGreenlet on expired attributes).
        await db.refresh(query)
        return QueryResponse.model_validate(query)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[QueryResponse])
async def get_queries(
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get user's queries"""
    try:
        queries = await query_service.get_user_queries(
            user_id=user_id,
            db=db,
            limit=limit,
            offset=offset
        )
        return [QueryResponse.model_validate(q) for q in queries]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving queries: {str(e)}"
        )


@router.get("/{query_id}", response_model=QueryResponse)
async def get_query(
    query_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific query"""
    try:
        query = await query_service.get_query(query_id, user_id, db)
        if not query:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Query not found"
            )
        return QueryResponse.model_validate(query)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/{query_id}/executions", response_model=List[QueryExecutionResponse])
async def get_query_executions(
    query_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get query execution history"""
    try:
        executions = await query_service.get_query_executions(query_id, user_id, db)
        return [QueryExecutionResponse.model_validate(e) for e in executions]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
