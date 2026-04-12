from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas.dataset import DatasetCreate, DatasetResponse, DatasetUpdate
from app.services.dataset_service import DatasetService

router = APIRouter()
dataset_service = DatasetService()


@router.post("/", response_model=DatasetResponse)
async def create_dataset(
    dataset_data: DatasetCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new dataset"""
    try:
        dataset = await dataset_service.create_dataset(dataset_data, user_id, db)
        return DatasetResponse.model_validate(dataset)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = None,
    description: str = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Upload a dataset file"""
    try:
        dataset = await dataset_service.upload_file(
            file=file,
            name=name or file.filename,
            description=description,
            user_id=user_id,
            db=db
        )
        return DatasetResponse.model_validate(dataset)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[DatasetResponse])
async def get_datasets(
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get user's datasets"""
    try:
        datasets = await dataset_service.get_user_datasets(
            user_id=user_id,
            db=db,
            limit=limit,
            offset=offset
        )
        return [DatasetResponse.model_validate(dataset) for dataset in datasets]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving datasets: {str(e)}"
        )


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific dataset"""
    try:
        dataset = await dataset_service.get_dataset(dataset_id, user_id, db)
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        return DatasetResponse.model_validate(dataset)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/{dataset_id}", response_model=DatasetResponse)
async def update_dataset(
    dataset_id: str,
    update_data: DatasetUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update a dataset"""
    try:
        dataset = await dataset_service.update_dataset(
            dataset_id=dataset_id,
            update_data=update_data.dict(exclude_unset=True),
            user_id=user_id,
            db=db
        )
        return DatasetResponse.model_validate(dataset)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete a dataset"""
    try:
        await dataset_service.delete_dataset(dataset_id, user_id, db)
        return {"message": "Dataset deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/{dataset_id}/preview")
async def preview_dataset(
    dataset_id: str,
    rows: int = 10,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Preview dataset data"""
    try:
        preview = await dataset_service.preview_dataset(
            dataset_id=dataset_id,
            rows=rows,
            user_id=user_id,
            db=db
        )
        return preview
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
