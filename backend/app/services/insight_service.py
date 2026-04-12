from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from app.models.insight import Insight, InsightVisualization
from app.schemas.insight import InsightCreate


class InsightService:
    """Service for managing insights and visualizations"""
    
    async def create_insight(
        self,
        insight_data: InsightCreate,
        user_id: str,
        db: AsyncSession
    ) -> Insight:
        """Create a new insight"""
        try:
            insight = Insight(
                user_id=uuid.UUID(user_id),
                query_id=insight_data.query_id,
                dataset_id=insight_data.dataset_id,
                title=insight_data.title,
                headline=insight_data.headline,
                explanation=insight_data.explanation,
                summary=insight_data.summary,
                insight_type=insight_data.insight_type,
                confidence_score=insight_data.confidence_score,
                significance_score=insight_data.significance_score,
                key_drivers=insight_data.key_drivers,
                recommendations=insight_data.recommendations,
                status="published"
            )
            
            db.add(insight)
            await db.commit()
            await db.refresh(insight)
            
            return insight
            
        except Exception as e:
            await db.rollback()
            raise e
    
    async def get_user_insights(
        self,
        user_id: str,
        db: AsyncSession,
        limit: int = 50,
        offset: int = 0,
        query_id: Optional[str] = None,
        dataset_id: Optional[str] = None
    ) -> List[Insight]:
        """Get insights for a user"""
        try:
            query = select(Insight).where(Insight.user_id == uuid.UUID(user_id))
            
            if query_id:
                query = query.where(Insight.query_id == uuid.UUID(query_id))
            if dataset_id:
                query = query.where(Insight.dataset_id == uuid.UUID(dataset_id))
            
            result = await db.execute(
                query
                .order_by(Insight.created_at.desc())
                .limit(limit)
                .offset(offset)
                .options(selectinload(Insight.visualizations))
            )
            
            return result.scalars().all()
            
        except Exception as e:
            raise e
    
    async def get_insight(
        self,
        insight_id: str,
        user_id: str,
        db: AsyncSession
    ) -> Optional[Insight]:
        """Get a specific insight"""
        try:
            result = await db.execute(
                select(Insight)
                .where(Insight.id == uuid.UUID(insight_id))
                .where(Insight.user_id == uuid.UUID(user_id))
                .options(selectinload(Insight.visualizations))
            )
            
            return result.scalar_one_or_none()
            
        except Exception as e:
            raise e
    
    async def toggle_bookmark(
        self,
        insight_id: str,
        user_id: str,
        db: AsyncSession
    ) -> Insight:
        """Toggle insight bookmark status"""
        try:
            insight = await self.get_insight(insight_id, user_id, db)
            if not insight:
                raise ValueError("Insight not found")
            
            insight.is_bookmarked = not insight.is_bookmarked
            await db.commit()
            await db.refresh(insight)
            
            return insight
            
        except Exception as e:
            await db.rollback()
            raise e
    
    async def get_insight_visualizations(
        self,
        insight_id: str,
        user_id: str,
        db: AsyncSession
    ) -> List[InsightVisualization]:
        """Get insight visualizations"""
        try:
            # Verify insight belongs to user
            insight = await self.get_insight(insight_id, user_id, db)
            if not insight:
                raise ValueError("Insight not found")
            
            result = await db.execute(
                select(InsightVisualization)
                .where(InsightVisualization.insight_id == uuid.UUID(insight_id))
                .order_by(InsightVisualization.display_order)
            )
            
            return result.scalars().all()
            
        except Exception as e:
            raise e
    
    async def create_visualization(
        self,
        insight_id: str,
        chart_type: str,
        data: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None,
        title: Optional[str] = None,
        user_id: str = None,
        db: AsyncSession = None
    ) -> InsightVisualization:
        """Create insight visualization"""
        try:
            # Verify insight exists
            if user_id:
                insight = await self.get_insight(insight_id, user_id, db)
                if not insight:
                    raise ValueError("Insight not found")
            
            # Get display order
            result = await db.execute(
                select(InsightVisualization)
                .where(InsightVisualization.insight_id == uuid.UUID(insight_id))
            )
            existing_viz = result.scalars().all()
            display_order = len(existing_viz)
            
            visualization = InsightVisualization(
                insight_id=uuid.UUID(insight_id),
                chart_type=chart_type,
                title=title,
                data=data,
                config=config or {},
                display_order=display_order
            )
            
            db.add(visualization)
            await db.commit()
            await db.refresh(visualization)
            
            return visualization
            
        except Exception as e:
            await db.rollback()
            raise e
