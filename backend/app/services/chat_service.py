from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import json

from app.models.query import Query
from app.models.insight import Insight
from app.schemas.chat import ChatHistoryResponse


class ChatService:
    """Service for managing chat conversations and history"""
    
    async def save_conversation(
        self,
        user_id: str,
        user_message: str,
        ai_response: Dict[str, Any],
        insights: Optional[Dict[str, Any]],
        db: AsyncSession
    ) -> Query:
        """Save conversation to database"""
        try:
            # Create query record
            query = Query(
                user_id=uuid.UUID(user_id),
                original_query=user_message,
                processed_query=user_message,
                query_type=ai_response.get("query_type", "descriptive"),
                intent=ai_response.get("intent", "general"),
                entities=ai_response.get("entities", {}),
                confidence_score=int(ai_response.get("confidence", 0.5) * 100),
                status="completed",
                execution_time_ms=0,  # Will be calculated properly later
                created_at=datetime.now(timezone.utc)
            )
            
            db.add(query)
            await db.commit()
            await db.refresh(query)
            
            # Create insight record if available
            if insights and insights.get("headline"):
                insight = Insight(
                    user_id=uuid.UUID(user_id),
                    query_id=query.id,
                    title=insights.get("headline", "AI Generated Insight"),
                    headline=insights.get("headline", ""),
                    explanation=insights.get("explanation", ""),
                    summary=insights.get("explanation", "")[:200] + "..." if len(insights.get("explanation", "")) > 200 else insights.get("explanation", ""),
                    insight_type="trend",  # Default type
                    confidence_score=insights.get("confidence", 0.5),
                    significance_score=insights.get("significance", 0.5),
                    key_drivers=insights.get("key_drivers", []),
                    recommendations=insights.get("recommendations", []),
                    status="published",
                    created_at=datetime.now(timezone.utc)
                )
                
                db.add(insight)
                await db.commit()
            
            return query
            
        except Exception as e:
            await db.rollback()
            raise e
    
    async def get_conversation_history(
        self,
        user_id: str,
        db: AsyncSession,
        limit: int = 50,
        offset: int = 0
    ) -> List[ChatHistoryResponse]:
        """Get conversation history for a user"""
        try:
            result = await db.execute(
                select(Query)
                .where(Query.user_id == uuid.UUID(user_id))
                .where(Query.status == "completed")
                .order_by(Query.created_at.desc())
                .limit(limit)
                .offset(offset)
                .options(selectinload(Query.insights))
            )
            
            queries = result.scalars().all()
            
            history = []
            for query in queries:
                # Get the first insight if available
                insight = query.insights[0] if query.insights else None
                
                history_item = ChatHistoryResponse(
                    id=query.id,
                    user_message=query.original_query,
                    ai_response=query.processed_query or "Response processed",
                    insights={
                        "headline": insight.headline,
                        "explanation": insight.explanation,
                        "confidence": insight.confidence_score,
                        "recommendations": insight.recommendations
                    } if insight else None,
                    query_type=query.query_type,
                    confidence=query.confidence_score / 100.0,
                    created_at=query.created_at
                )
                
                history.append(history_item)
            
            return history
            
        except Exception as e:
            raise e
    
    async def clear_conversation_history(
        self,
        user_id: str,
        db: AsyncSession
    ) -> bool:
        """Clear conversation history for a user"""
        try:
            # Delete all queries for the user
            await db.execute(
                delete(Query).where(Query.user_id == uuid.UUID(user_id))
            )
            
            await db.commit()
            return True
            
        except Exception as e:
            await db.rollback()
            raise e
    
    async def get_conversation_by_id(
        self,
        conversation_id: str,
        user_id: str,
        db: AsyncSession
    ) -> Optional[Query]:
        """Get a specific conversation by ID"""
        try:
            result = await db.execute(
                select(Query)
                .where(Query.id == uuid.UUID(conversation_id))
                .where(Query.user_id == uuid.UUID(user_id))
                .options(selectinload(Query.insights))
            )
            
            return result.scalar_one_or_none()
            
        except Exception as e:
            raise e
    
    async def update_conversation(
        self,
        conversation_id: str,
        user_id: str,
        update_data: Dict[str, Any],
        db: AsyncSession
    ) -> Optional[Query]:
        """Update a conversation"""
        try:
            query = await self.get_conversation_by_id(conversation_id, user_id, db)
            if not query:
                return None
            
            # Update allowed fields
            for field, value in update_data.items():
                if hasattr(query, field):
                    setattr(query, field, value)
            
            query.updated_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(query)
            
            return query
            
        except Exception as e:
            await db.rollback()
            raise e
    
    async def get_conversation_stats(
        self,
        user_id: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Get conversation statistics for a user"""
        try:
            # Total queries
            total_result = await db.execute(
                select(Query).where(Query.user_id == uuid.UUID(user_id))
            )
            total_queries = len(total_result.scalars().all())
            
            # Queries by type
            type_stats = {}
            for query_type in ["descriptive", "diagnostic", "predictive", "prescriptive"]:
                result = await db.execute(
                    select(Query)
                    .where(Query.user_id == uuid.UUID(user_id))
                    .where(Query.query_type == query_type)
                )
                type_stats[query_type] = len(result.scalars().all())
            
            # Average confidence
            confidence_result = await db.execute(
                select(Query.confidence_score)
                .where(Query.user_id == uuid.UUID(user_id))
                .where(Query.confidence_score.isnot(None))
            )
            confidence_scores = confidence_result.scalars().all()
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
            
            return {
                "total_queries": total_queries,
                "queries_by_type": type_stats,
                "average_confidence": avg_confidence / 100.0,  # Convert to 0-1 scale
                "last_activity": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            raise e
