from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import pandas as pd
import os

from app.models.dataset import Dataset, DatasetColumn
from app.schemas.dataset import DatasetCreate, DatasetUpdate
from app.core.config import settings
from app.core.security import SecurityValidator


class DatasetService:
    """Service for managing datasets and file operations"""
    
    async def create_dataset(
        self,
        dataset_data: DatasetCreate,
        user_id: str,
        db: AsyncSession
    ) -> Dataset:
        """Create a new dataset record"""
        try:
            dataset = Dataset(
                user_id=uuid.UUID(user_id),
                name=dataset_data.name,
                description=dataset_data.description,
                file_name=dataset_data.file_name,
                file_path=dataset_data.file_path,
                file_size=dataset_data.file_size,
                file_type=dataset_data.file_type,
                processing_status="pending"
            )
            
            db.add(dataset)
            await db.commit()
            await db.refresh(dataset)
            
            # Process dataset to extract metadata (row count, schema, columns)
            await self._process_dataset(dataset.id, db)
            await db.refresh(dataset)
            
            return dataset
            
        except Exception as e:
            await db.rollback()
            raise e
    
    async def upload_file(
        self,
        file,
        name: str,
        description: str,
        user_id: str,
        db: AsyncSession
    ) -> Dataset:
        """Upload and process a dataset file"""
        try:
            # Validate file
            content = await file.read()
            SecurityValidator.validate_file_content(content, file.filename)
            
            # Save file
            file_path = await self._save_file(file.filename, content)
            
            # Create dataset record
            dataset_data = DatasetCreate(
                name=name,
                description=description,
                file_name=file.filename,
                file_path=file_path,
                file_size=len(content),
                file_type=os.path.splitext(file.filename)[1].lower()
            )
            
            return await self.create_dataset(dataset_data, user_id, db)
            
        except Exception as e:
            raise e
    
    async def get_user_datasets(
        self,
        user_id: str,
        db: AsyncSession,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dataset]:
        """Get datasets for a user"""
        try:
            result = await db.execute(
                select(Dataset)
                .where(Dataset.user_id == uuid.UUID(user_id))
                .where(Dataset.is_active == True)
                .order_by(Dataset.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            
            return result.scalars().all()
            
        except Exception as e:
            raise e
    
    async def get_dataset(
        self,
        dataset_id: str,
        user_id: str,
        db: AsyncSession
    ) -> Optional[Dataset]:
        """Get a specific dataset"""
        try:
            result = await db.execute(
                select(Dataset)
                .where(Dataset.id == uuid.UUID(dataset_id))
                .where(Dataset.user_id == uuid.UUID(user_id))
                .where(Dataset.is_active == True)
                .options(selectinload(Dataset.columns))
            )
            
            dataset = result.scalar_one_or_none()
            if dataset:
                # Update last accessed
                dataset.last_accessed_at = datetime.now(timezone.utc)
                await db.commit()
            
            return dataset
            
        except Exception as e:
            raise e
    
    async def update_dataset(
        self,
        dataset_id: str,
        update_data: Dict[str, Any],
        user_id: str,
        db: AsyncSession
    ) -> Dataset:
        """Update a dataset"""
        try:
            dataset = await self.get_dataset(dataset_id, user_id, db)
            if not dataset:
                raise ValueError("Dataset not found")
            
            for field, value in update_data.items():
                if hasattr(dataset, field):
                    setattr(dataset, field, value)
            
            dataset.updated_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(dataset)
            
            return dataset
            
        except Exception as e:
            await db.rollback()
            raise e
    
    async def delete_dataset(
        self,
        dataset_id: str,
        user_id: str,
        db: AsyncSession
    ) -> bool:
        """Delete a dataset"""
        try:
            dataset = await self.get_dataset(dataset_id, user_id, db)
            if not dataset:
                raise ValueError("Dataset not found")
            
            # Soft delete
            dataset.is_active = False
            await db.commit()
            
            # Delete file (optional - keep for recovery)
            # await self._delete_file(dataset.file_path)
            
            return True
            
        except Exception as e:
            await db.rollback()
            raise e
    
    async def preview_dataset(
        self,
        dataset_id: str,
        rows: int,
        user_id: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Preview dataset data"""
        try:
            dataset = await self.get_dataset(dataset_id, user_id, db)
            if not dataset:
                raise ValueError("Dataset not found")
            
            if dataset.processing_status != "completed":
                raise ValueError("Dataset not processed yet")
            
            # Read sample data
            df = pd.read_csv(dataset.file_path, nrows=rows)
            
            return {
                "columns": list(df.columns),
                "data": df.to_dict(orient="records"),
                "total_rows": dataset.row_count,
                "sample_rows": len(df)
            }
            
        except Exception as e:
            raise e
    
    async def _save_file(self, filename: str, content: bytes) -> str:
        """Save uploaded file to disk"""
        try:
            # Create upload directory if it doesn't exist
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            
            # Generate unique filename
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            unique_filename = f"{timestamp}_{filename}"
            file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
            
            # Save file
            with open(file_path, "wb") as f:
                f.write(content)
            
            return file_path
            
        except Exception as e:
            raise e
    
    async def _process_dataset(self, dataset_id: uuid.UUID, db: AsyncSession):
        """Process dataset and extract metadata"""
        try:
            # Get dataset
            result = await db.execute(
                select(Dataset).where(Dataset.id == dataset_id)
            )
            dataset = result.scalar_one_or_none()
            
            if not dataset:
                return
            
            # Update status to processing
            dataset.processing_status = "processing"
            await db.commit()
            
            # Read and analyze file
            try:
                if dataset.file_type == ".csv":
                    df = pd.read_csv(dataset.file_path)
                elif dataset.file_type in [".xlsx", ".xls"]:
                    df = pd.read_excel(dataset.file_path)
                else:
                    raise ValueError("Unsupported file type")
                
                # Update dataset metadata
                dataset.row_count = len(df)
                dataset.column_count = len(df.columns)
                dataset.processing_status = "completed"
                
                # Calculate data quality score
                missing_percentage = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
                dataset.missing_values_percentage = int(missing_percentage)
                dataset.data_quality_score = max(0, 100 - int(missing_percentage))
                
                # Create column records
                await self._create_column_records(dataset.id, df, db)
                
                await db.commit()
                
            except Exception as e:
                dataset.processing_status = "failed"
                dataset.processing_error = str(e)
                await db.commit()
                
        except Exception as e:
            await db.rollback()
            raise e
    
    async def _create_column_records(self, dataset_id: uuid.UUID, df: pd.DataFrame, db: AsyncSession):
        """Create column records for dataset"""
        try:
            for column_name in df.columns:
                series = df[column_name]
                
                # Determine data type
                dtype = str(series.dtype)
                if dtype.startswith('int') or dtype.startswith('float'):
                    data_type = "numeric"
                    is_numeric = True
                elif dtype == 'object':
                    data_type = "string"
                    is_numeric = False
                elif dtype.startswith('datetime'):
                    data_type = "datetime"
                    is_numeric = False
                else:
                    data_type = "string"
                    is_numeric = False
                
                column = DatasetColumn(
                    dataset_id=dataset_id,
                    name=column_name,
                    display_name=column_name.replace('_', ' ').title(),
                    data_type=data_type,
                    null_count=int(series.isnull().sum()),
                    unique_count=int(series.nunique()),
                    is_numeric=is_numeric,
                    is_temporal=data_type == "datetime",
                    is_categorical=not is_numeric and series.nunique() < len(series) * 0.5
                )
                
                db.add(column)
            
            await db.commit()
            
        except Exception as e:
            raise e
