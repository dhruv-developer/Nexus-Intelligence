"""
Tests for authentication service
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.auth_service import AuthService
from app.schemas.auth import UserCreate, UserLogin
from app.models.user import User
from app.core.security import get_password_hash


class TestAuthService:
    """Test cases for AuthService"""

    @pytest.fixture
    def auth_service(self):
        """Create auth service instance"""
        return AuthService()

    @pytest.fixture
    def user_data(self):
        """Sample user data for testing"""
        return UserCreate(
            email="test@example.com",
            password="testpassword123",
            full_name="Test User"
        )

    @pytest.fixture
    def login_data(self):
        """Sample login data for testing"""
        return UserLogin(
            email="test@example.com",
            password="testpassword123"
        )

    @pytest.mark.asyncio
    async def test_create_user_success(self, auth_service, user_data):
        """Test successful user creation"""
        # Mock database session
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None  # User doesn't exist
        mock_db.execute.return_value = mock_result
        
        # Mock user object
        mock_user = User(
            id="test-uuid",
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=get_password_hash(user_data.password),
            is_active=True,
            is_superuser=False
        )
        
        with patch.object(auth_service, 'get_user_by_email', return_value=None):
            with patch('sqlalchemy.ext.asyncio.AsyncSession.add') as mock_add:
                with patch('sqlalchemy.ext.asyncio.AsyncSession.commit') as mock_commit:
                    with patch('sqlalchemy.ext.asyncio.AsyncSession.refresh') as mock_refresh:
                        mock_add.return_value = None
                        mock_commit.return_value = None
                        mock_refresh.return_value = None
                        
                        # Create user
                        result = await auth_service.create_user(user_data, mock_db)
                        
                        # Verify user was created
                        assert result.email == user_data.email
                        assert result.full_name == user_data.full_name
                        assert result.is_active == True
                        mock_add.assert_called_once()
                        mock_commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, auth_service, user_data):
        """Test user creation with duplicate email should fail"""
        mock_db = AsyncMock(spec=AsyncSession)
        
        # Mock existing user
        existing_user = User(
            id="existing-uuid",
            email=user_data.email,
            full_name="Existing User",
            hashed_password="hashed_password",
            is_active=True
        )
        
        with patch.object(auth_service, 'get_user_by_email', return_value=existing_user):
            with pytest.raises(ValueError, match="User with this email already exists"):
                await auth_service.create_user(user_data, mock_db)

    @pytest.mark.asyncio
    async def test_authenticate_user_success(self, auth_service, login_data):
        """Test successful user authentication"""
        mock_db = AsyncMock(spec=AsyncSession)
        
        # Mock user with hashed password
        hashed_password = get_password_hash(login_data.password)
        mock_user = User(
            id="test-uuid",
            email=login_data.email,
            full_name="Test User",
            hashed_password=hashed_password,
            is_active=True
        )
        
        with patch.object(auth_service, 'get_user_by_email', return_value=mock_user):
            result = await auth_service.authenticate_user(login_data.email, login_data.password, mock_db)
            
            assert result.email == login_data.email
            assert result.id == "test-uuid"

    @pytest.mark.asyncio
    async def test_authenticate_user_invalid_email(self, auth_service, login_data):
        """Test authentication with non-existent email should fail"""
        mock_db = AsyncMock(spec=AsyncSession)
        
        with patch.object(auth_service, 'get_user_by_email', return_value=None):
            with pytest.raises(ValueError, match="Invalid credentials"):
                await auth_service.authenticate_user(login_data.email, login_data.password, mock_db)

    @pytest.mark.asyncio
    async def test_authenticate_user_invalid_password(self, auth_service, login_data):
        """Test authentication with wrong password should fail"""
        mock_db = AsyncMock(spec=AsyncSession)
        
        # Mock user with different password
        mock_user = User(
            id="test-uuid",
            email=login_data.email,
            full_name="Test User",
            hashed_password=get_password_hash("different_password"),
            is_active=True
        )
        
        with patch.object(auth_service, 'get_user_by_email', return_value=mock_user):
            with pytest.raises(ValueError, match="Invalid credentials"):
                await auth_service.authenticate_user(login_data.email, "wrong_password", mock_db)

    @pytest.mark.asyncio
    async def test_authenticate_user_oauth_user(self, auth_service, login_data):
        """Test authentication for OAuth user (no password) should fail"""
        mock_db = AsyncMock(spec=AsyncSession)
        
        # Mock OAuth user (no hashed password)
        mock_user = User(
            id="test-uuid",
            email=login_data.email,
            full_name="OAuth User",
            hashed_password=None,  # OAuth user
            is_active=True
        )
        
        with patch.object(auth_service, 'get_user_by_email', return_value=mock_user):
            with pytest.raises(ValueError, match="User uses OAuth authentication"):
                await auth_service.authenticate_user(login_data.email, login_data.password, mock_db)

    @pytest.mark.asyncio
    async def test_get_user_by_email_success(self, auth_service):
        """Test successful user retrieval by email"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        
        # Mock user
        mock_user = User(
            id="test-uuid",
            email="test@example.com",
            full_name="Test User",
            hashed_password="hashed_password",
            is_active=True
        )
        
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result
        
        result = await auth_service.get_user_by_email("test@example.com", mock_db)
        
        assert result.email == "test@example.com"
        assert result.id == "test-uuid"

    @pytest.mark.asyncio
    async def test_get_user_by_id_success(self, auth_service):
        """Test successful user retrieval by ID"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        
        # Mock user
        mock_user = User(
            id="test-uuid",
            email="test@example.com",
            full_name="Test User",
            hashed_password="hashed_password",
            is_active=True
        )
        
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result
        
        result = await auth_service.get_user_by_id("test-uuid", mock_db)
        
        assert result.id == "test-uuid"
        assert result.email == "test@example.com"

    @pytest.mark.asyncio
    async def test_update_user_success(self, auth_service):
        """Test successful user update"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        
        # Mock existing user
        mock_user = User(
            id="test-uuid",
            email="test@example.com",
            full_name="Test User",
            hashed_password="hashed_password",
            is_active=True
        )
        
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result
        
        # Update data
        update_data = {
            "full_name": "Updated User",
            "is_active": False
        }
        
        with patch('sqlalchemy.ext.asyncio.AsyncSession.commit') as mock_commit:
            with patch('sqlalchemy.ext.asyncio.AsyncSession.refresh') as mock_refresh:
                mock_commit.return_value = None
                mock_refresh.return_value = None
                
                result = await auth_service.update_user("test-uuid", update_data, mock_db)
                
                assert result.full_name == "Updated User"
                assert result.is_active == False
                mock_commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_user_not_found(self, auth_service):
        """Test update for non-existent user should fail"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        update_data = {"full_name": "Updated User"}
        
        with pytest.raises(ValueError, match="User not found"):
            await auth_service.update_user("non-existent-uuid", update_data, mock_db)

    @pytest.mark.asyncio
    async def test_change_password_success(self, auth_service):
        """Test successful password change"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        
        # Mock user with current password
        current_password = "current_password"
        mock_user = User(
            id="test-uuid",
            email="test@example.com",
            full_name="Test User",
            hashed_password=get_password_hash(current_password),
            is_active=True
        )
        
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result
        
        new_password = "new_password123"
        
        with patch('sqlalchemy.ext.asyncio.AsyncSession.commit') as mock_commit:
            mock_commit.return_value = None
            
            result = await auth_service.change_password("test-uuid", current_password, new_password, mock_db)
            
            assert result.id == "test-uuid"
            mock_commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_change_password_wrong_current_password(self, auth_service):
        """Test password change with wrong current password should fail"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        
        # Mock user
        mock_user = User(
            id="test-uuid",
            email="test@example.com",
            full_name="Test User",
            hashed_password=get_password_hash("actual_password"),
            is_active=True
        )
        
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result
        
        with pytest.raises(ValueError, match="Invalid current password"):
            await auth_service.change_password("test-uuid", "wrong_password", "new_password", mock_db)

    @pytest.mark.asyncio
    async def test_change_password_oauth_user(self, auth_service):
        """Test password change for OAuth user should fail"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = AsyncMock()
        
        # Mock OAuth user (no password)
        mock_user = User(
            id="test-uuid",
            email="test@example.com",
            full_name="OAuth User",
            hashed_password=None,
            is_active=True
        )
        
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result
        
        with pytest.raises(ValueError, match="User uses OAuth authentication"):
            await auth_service.change_password("test-uuid", "any_password", "new_password", mock_db)
