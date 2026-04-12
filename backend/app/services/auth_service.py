from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
import uuid

from app.models.user import User
from app.schemas.auth import UserCreate
from app.core.security import get_password_hash, verify_password
from app.core.config import settings


class AuthService:
    """Service for authentication and user management"""
    
    async def create_user(self, user_data: UserCreate, db: AsyncSession) -> User:
        """Create a new user"""
        # Check if user already exists
        existing_user = await self.get_user_by_email(user_data.email, db)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            plan="free",
            is_active=True,
            is_verified=False
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return user
    
    async def authenticate_user(self, email: str, password: str, db: AsyncSession) -> User:
        """Authenticate user with email and password"""
        user = await self.get_user_by_email(email, db)
        if not user:
            raise ValueError("Invalid credentials")
        
        if not user.hashed_password:
            raise ValueError("User uses OAuth authentication")
        
        if not verify_password(password, user.hashed_password):
            raise ValueError("Invalid credentials")
        
        if not user.is_active:
            raise ValueError("User account is deactivated")
        
        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        await db.commit()
        
        return user
    
    async def get_user_by_email(self, email: str, db: AsyncSession) -> User | None:
        """Get user by email"""
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_id(self, user_id: str, db: AsyncSession) -> User | None:
        """Get user by ID"""
        try:
            uuid_id = uuid.UUID(user_id)
            result = await db.execute(
                select(User).where(User.id == uuid_id)
            )
            return result.scalar_one_or_none()
        except ValueError:
            return None
    
    async def update_user(self, user_id: str, update_data: dict, db: AsyncSession) -> User:
        """Update user information"""
        user = await self.get_user_by_id(user_id, db)
        if not user:
            raise ValueError("User not found")
        
        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)
        
        await db.commit()
        await db.refresh(user)
        
        return user
    
    async def deactivate_user(self, user_id: str, db: AsyncSession) -> User:
        """Deactivate user account"""
        return await self.update_user(user_id, {"is_active": False}, db)
    
    async def verify_user(self, user_id: str, db: AsyncSession) -> User:
        """Verify user email"""
        return await self.update_user(user_id, {"is_verified": True}, db)
    
    async def change_password(self, user_id: str, old_password: str, new_password: str, db: AsyncSession) -> User:
        """Change user password"""
        user = await self.get_user_by_id(user_id, db)
        if not user:
            raise ValueError("User not found")
        
        if not user.hashed_password:
            raise ValueError("User uses OAuth authentication")
        
        if not verify_password(old_password, user.hashed_password):
            raise ValueError("Invalid current password")
        
        user.hashed_password = get_password_hash(new_password)
        await db.commit()
        await db.refresh(user)
        
        return user
