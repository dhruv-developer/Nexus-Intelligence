"""
Tests for dataset service
"""

import pytest
import asyncio
import pandas as pd
from unittest.mock import AsyncMock, patch, mock_open
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.services.dataset_service import DatasetService
from app.schemas.dataset import DatasetCreate, DatasetUpdate
from app.models.dataset import Dataset, DatasetColumn
from app.models.user import User


class TestDatasetService:
    """Test cases for DatasetService"""

    @pytest.fixture
    def dataset_service(self):
        """Create dataset service instance"""
        return DatasetService()

    @pytest.fixture
    def sample_user(self):
        """Sample user for testing"""
        return User(
            id="user-uuid",
            email="test@example.com",
            full_name="Test User",
            is_active=True
        )

    @pytest.fixture
    def dataset_data(self):
        """Sample dataset data for testing"""
        return DatasetCreate(
            name="Test Dataset",
            description="Test dataset description",
            file_name="test.csv",
            file_path="/uploads/test.csv",
            file_size=1024,
            file_type=".csv"
        )

    @pytest.fixture
    def sample_dataset(self, sample_user, dataset_data):
        """Sample dataset for testing"""
        return Dataset(
            id="dataset-uuid",
            user_id=sample_user.id,
            name=dataset_data.name,
            description=dataset_data.description,
            file_name=dataset_data.file_name,
            file_path=dataset_data.file_path,
            file_size=dataset_data.file_size,
            file_type=dataset_data.file_type,
            processing_status="pending",
            is_active=True,
            is_public=False,
            created_at=datetime.now(timezone.utc)
        )

    @pytest.mark.asyncio
    async def test_create_dataset_success(self, dataset_service, dataset_data, sample_user):
        """Test successful dataset creation"""
        mock_db = AsyncMock(spec=AsyncSession)
        
        with patch('sqlalchemy.ext.asyncio.AsyncSession.add') as mock_add:
            with patch('sqlalchemy.ext.asyncio.AsyncSession.commit') as mock_commit:
                with patch('sqlalchemy.ext.asyncio.AsyncSession.refresh') as mock_refresh:
                    mock_add.return_value = None
                    mock_commit.return_value = None
                    mock_refresh.return_value = None
                    
                    result = await dataset_service.create_dataset(dataset_data, sample_user.id, mock_db)
                    
                    assert result.name == dataset_data.name
                    assert result.user_id == sample_user.id
                    assert result.processing_status == "pending"
                    mock_add.assert_called_once()
                    mock_commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_datasets_success(self, dataset_service, sample_user, sample_dataset):
        """Test successful retrieval of user datasets"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = [sample_dataset]
        mock_db.execute.return_value = mock_result
        
        result = await dataset_service.get_user_datasets(sample_user.id, mock_db)
        
        assert len(result) == 1
        assert result[0].id == sample_dataset.id
        assert result[0].user_id == sample_user.id

    @pytest.mark.asyncio
    async def test_get_dataset_success(self, dataset_service, sample_dataset):
        """Test successful dataset retrieval by ID"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = sample_dataset
        mock_db.execute.return_value = mock_result
        
        result = await dataset_service.get_dataset(sample_dataset.id, mock_db)
        
        assert result.id == sample_dataset.id
        assert result.name == sample_dataset.name

    @pytest.mark.asyncio
    async def test_get_dataset_not_found(self, dataset_service):
        """Test dataset retrieval for non-existent dataset"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        result = await dataset_service.get_dataset("non-existent-id", mock_db)
        
        assert result is None

    @pytest.mark.asyncio
    async def test_update_dataset_success(self, dataset_service, sample_dataset):
        """Test successful dataset update"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = sample_dataset
        mock_db.execute.return_value = mock_result
        
        update_data = DatasetUpdate(
            name="Updated Dataset Name",
            description="Updated description"
        )
        
        with patch('sqlalchemy.ext.asyncio.AsyncSession.commit') as mock_commit:
            with patch('sqlalchemy.ext.asyncio.AsyncSession.refresh') as mock_refresh:
                mock_commit.return_value = None
                mock_refresh.return_value = None
                
                result = await dataset_service.update_dataset(sample_dataset.id, update_data, mock_db)
                
                assert result.name == "Updated Dataset Name"
                assert result.description == "Updated description"
                mock_commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_dataset_not_found(self, dataset_service):
        """Test update for non-existent dataset should fail"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        update_data = DatasetUpdate(name="Updated Name")
        
        with pytest.raises(ValueError, match="Dataset not found"):
            await dataset_service.update_dataset("non-existent-id", update_data, mock_db)

    @pytest.mark.asyncio
    async def test_delete_dataset_success(self, dataset_service, sample_dataset):
        """Test successful dataset deletion"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = sample_dataset
        mock_db.execute.return_value = mock_result
        
        with patch('sqlalchemy.ext.asyncio.AsyncSession.delete') as mock_delete:
            with patch('sqlalchemy.ext.asyncio.AsyncSession.commit') as mock_commit:
                mock_delete.return_value = None
                mock_commit.return_value = None
                
                await dataset_service.delete_dataset(sample_dataset.id, mock_db)
                
                mock_delete.assert_called_once()
                mock_commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_dataset_not_found(self, dataset_service):
        """Test deletion for non-existent dataset should fail"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        with pytest.raises(ValueError, match="Dataset not found"):
            await dataset_service.delete_dataset("non-existent-id", mock_db)

    @pytest.mark.asyncio
    async def test_process_uploaded_file_success(self, dataset_service, sample_dataset):
        """Test successful file processing"""
        mock_db = AsyncMock(spec=AsyncSession)
        
        # Mock CSV file data
        csv_data = "name,age,city\nJohn,25,NYC\nJane,30,LA\nBob,35,Chicago"
        mock_df = pd.DataFrame({
            'name': ['John', 'Jane', 'Bob'],
            'age': [25, 30, 35],
            'city': ['NYC', 'LA', 'Chicago']
        })
        
        with patch('pandas.read_csv', return_value=mock_df):
            with patch('sqlalchemy.ext.asyncio.AsyncSession.execute') as mock_execute:
                with patch('sqlalchemy.ext.asyncio.AsyncSession.commit') as mock_commit:
                    mock_execute.return_value = None
                    mock_commit.return_value = None
                    
                    await dataset_service.process_uploaded_file(
                        sample_dataset.file_path, 
                        sample_dataset.id, 
                        mock_db
                    )
                    
                    # Verify database was updated with file metadata
                    assert mock_execute.call_count >= 1
                    mock_commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_process_uploaded_file_error(self, dataset_service, sample_dataset):
        """Test file processing with error should update status to failed"""
        mock_db = AsyncMock(spec=AsyncSession)
        
        with patch('pandas.read_csv', side_effect=Exception("File read error")):
            with patch('sqlalchemy.ext.asyncio.AsyncSession.execute') as mock_execute:
                with patch('sqlalchemy.ext.asyncio.AsyncSession.commit') as mock_commit:
                    mock_execute.return_value = None
                    mock_commit.return_value = None
                    
                    await dataset_service.process_uploaded_file(
                        sample_dataset.file_path, 
                        sample_dataset.id, 
                        mock_db
                    )
                    
                    # Verify error status was set
                    assert mock_execute.call_count >= 1
                    mock_commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_dataset_statistics_success(self, dataset_service, sample_dataset):
        """Test successful dataset statistics retrieval"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = sample_dataset
        mock_db.execute.return_value = mock_result
        
        # Mock DataFrame for statistics
        mock_df = pd.DataFrame({
            'col1': [1, 2, 3, 4, 5],
            'col2': ['a', 'b', 'c', 'd', 'e'],
            'col3': [1.1, 2.2, 3.3, 4.4, 5.5]
        })
        
        with patch('pandas.read_csv', return_value=mock_df):
            stats = await dataset_service.get_dataset_statistics(sample_dataset.id, mock_db)
            
            assert 'basic_info' in stats
            assert 'column_info' in stats
            assert 'sample_data' in stats
            assert stats['basic_info']['row_count'] == 5
            assert stats['basic_info']['column_count'] == 3

    @pytest.mark.asyncio
    async def test_get_dataset_statistics_file_not_found(self, dataset_service, sample_dataset):
        """Test statistics retrieval when file doesn't exist"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = sample_dataset
        mock_db.execute.return_value = mock_result
        
        with patch('pandas.read_csv', side_effect=FileNotFoundError("File not found")):
            with pytest.raises(ValueError, match="Dataset file not found"):
                await dataset_service.get_dataset_statistics(sample_dataset.id, mock_db)

    @pytest.mark.asyncio
    async def test_create_dataset_columns_success(self, dataset_service, sample_dataset):
        """Test successful creation of dataset columns"""
        mock_db = AsyncMock(spec=AsyncSession)
        
        # Mock DataFrame
        mock_df = pd.DataFrame({
            'name': ['John', 'Jane'],
            'age': [25, 30],
            'salary': [50000.0, 60000.0]
        })
        
        with patch('sqlalchemy.ext.asyncio.AsyncSession.add') as mock_add:
            with patch('sqlalchemy.ext.asyncio.AsyncSession.commit') as mock_commit:
                mock_add.return_value = None
                mock_commit.return_value = None
                
                await dataset_service.create_dataset_columns(
                    sample_dataset.id, 
                    mock_df, 
                    mock_db
                )
                
                # Verify columns were created
                assert mock_add.call_count == 3  # 3 columns
                mock_commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_dataset_columns_success(self, dataset_service, sample_dataset):
        """Test successful retrieval of dataset columns"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        
        # Mock columns
        mock_columns = [
            DatasetColumn(
                id="col-1",
                dataset_id=sample_dataset.id,
                name="name",
                data_type="string",
                is_nullable=True,
                position=1
            ),
            DatasetColumn(
                id="col-2",
                dataset_id=sample_dataset.id,
                name="age",
                data_type="integer",
                is_nullable=False,
                position=2
            )
        ]
        
        mock_result.scalars.return_value.all.return_value = mock_columns
        mock_db.execute.return_value = mock_result
        
        result = await dataset_service.get_dataset_columns(sample_dataset.id, mock_db)
        
        assert len(result) == 2
        assert result[0].name == "name"
        assert result[1].name == "age"

    @pytest.mark.asyncio
    async def test_validate_file_type_success(self, dataset_service):
        """Test successful file type validation"""
        # Test valid file types
        assert await dataset_service.validate_file_type("test.csv") == True
        assert await dataset_service.validate_file_type("test.xlsx") == True
        assert await dataset_service.validate_file_type("test.json") == True

    @pytest.mark.asyncio
    async def test_validate_file_type_invalid(self, dataset_service):
        """Test invalid file type validation"""
        # Test invalid file types
        assert await dataset_service.validate_file_type("test.txt") == False
        assert await dataset_service.validate_file_type("test.pdf") == False
        assert await dataset_service.validate_file_type("test.doc") == False

    @pytest.mark.asyncio
    async def test_calculate_data_quality_score(self, dataset_service):
        """Test data quality score calculation"""
        # Mock DataFrame with good quality
        good_df = pd.DataFrame({
            'col1': [1, 2, 3, 4, 5],  # No missing values
            'col2': ['a', 'b', 'c', 'd', 'e']  # No missing values
        })
        
        score = await dataset_service.calculate_data_quality_score(good_df)
        assert score >= 90  # Should be high quality
        
        # Mock DataFrame with missing values
        poor_df = pd.DataFrame({
            'col1': [1, 2, None, 4, 5],  # Missing values
            'col2': ['a', None, 'c', 'd', 'e']  # Missing values
        })
        
        score = await dataset_service.calculate_data_quality_score(poor_df)
        assert score < 90  # Should be lower quality

    @pytest.mark.asyncio
    async def test_export_dataset_csv(self, dataset_service, sample_dataset):
        """Test dataset export to CSV"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = sample_dataset
        mock_db.execute.return_value = mock_result
        
        # Mock DataFrame
        mock_df = pd.DataFrame({
            'name': ['John', 'Jane'],
            'age': [25, 30]
        })
        
        with patch('pandas.read_csv', return_value=mock_df):
            with patch('pandas.DataFrame.to_csv', return_value=None) as mock_to_csv:
                export_path = "/tmp/export.csv"
                
                await dataset_service.export_dataset(sample_dataset.id, export_path, "csv", mock_db)
                
                mock_to_csv.assert_called_once_with(export_path, index=False)

    @pytest.mark.asyncio
    async def test_export_dataset_excel(self, dataset_service, sample_dataset):
        """Test dataset export to Excel"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = sample_dataset
        mock_db.execute.return_value = mock_result
        
        # Mock DataFrame
        mock_df = pd.DataFrame({
            'name': ['John', 'Jane'],
            'age': [25, 30]
        })
        
        with patch('pandas.read_csv', return_value=mock_df):
            with patch('pandas.DataFrame.to_excel', return_value=None) as mock_to_excel:
                export_path = "/tmp/export.xlsx"
                
                await dataset_service.export_dataset(sample_dataset.id, export_path, "excel", mock_db)
                
                mock_to_excel.assert_called_once_with(export_path, index=False)

    @pytest.mark.asyncio
    async def test_export_dataset_unsupported_format(self, dataset_service, sample_dataset):
        """Test dataset export with unsupported format should fail"""
        mock_db = AsyncMock(spec=AsyncSession)
        
        with pytest.raises(ValueError, match="Unsupported export format"):
            await dataset_service.export_dataset(sample_dataset.id, "/tmp/export.txt", "txt", mock_db)
