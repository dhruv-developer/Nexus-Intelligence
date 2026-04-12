from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from app.models.query import Query, QueryExecution
from app.schemas.query import QueryCreate
from app.services.ai_service import AIService


class QueryService:
    """Service for managing queries and executions"""
    
    def __init__(self):
        self.ai_service = AIService()
    
    async def create_and_execute_query(
        self,
        query_data: QueryCreate,
        user_id: str,
        db: AsyncSession
    ) -> Query:
        """Create and execute a new query"""
        try:
            # Create query record
            query = Query(
                user_id=uuid.UUID(user_id),
                dataset_id=query_data.dataset_id,
                original_query=query_data.original_query,
                query_type=query_data.query_type or "descriptive",
                status="processing"
            )
            
            db.add(query)
            await db.commit()
            await db.refresh(query)
            
            # Execute query processing
            await self._execute_query(query, db)
            
            return query
            
        except Exception as e:
            await db.rollback()
            raise e
    
    async def get_user_queries(
        self,
        user_id: str,
        db: AsyncSession,
        limit: int = 50,
        offset: int = 0
    ) -> List[Query]:
        """Get queries for a user"""
        try:
            result = await db.execute(
                select(Query)
                .where(Query.user_id == uuid.UUID(user_id))
                .order_by(Query.created_at.desc())
                .limit(limit)
                .offset(offset)
                .options(selectinload(Query.executions))
            )
            
            return result.scalars().all()
            
        except Exception as e:
            raise e
    
    async def get_query(
        self,
        query_id: str,
        user_id: str,
        db: AsyncSession
    ) -> Optional[Query]:
        """Get a specific query"""
        try:
            result = await db.execute(
                select(Query)
                .where(Query.id == uuid.UUID(query_id))
                .where(Query.user_id == uuid.UUID(user_id))
                .options(selectinload(Query.executions))
            )
            
            return result.scalar_one_or_none()
            
        except Exception as e:
            raise e
    
    async def get_query_executions(
        self,
        query_id: str,
        user_id: str,
        db: AsyncSession
    ) -> List[QueryExecution]:
        """Get query execution history"""
        try:
            # Verify query belongs to user
            query = await self.get_query(query_id, user_id, db)
            if not query:
                raise ValueError("Query not found")
            
            result = await db.execute(
                select(QueryExecution)
                .where(QueryExecution.query_id == uuid.UUID(query_id))
                .order_by(QueryExecution.created_at.desc())
            )
            
            return result.scalars().all()
            
        except Exception as e:
            raise e
    
    async def _execute_query(self, query: Query, db: AsyncSession):
        """Execute query processing"""
        try:
            start_time = datetime.now(timezone.utc)
            
            # Step 1: Parse and process query
            await self._create_execution(
                query_id=query.id,
                step="parsing",
                status="running",
                start_time=start_time,
                db=db
            )
            
            # Get dataset context if available
            dataset_context = None
            if query.dataset_id:
                dataset_context = await self._get_dataset_context(query.dataset_id, db)
            
            # Process with AI
            ai_result = await self.ai_service.process_query(
                query=query.original_query,
                dataset_context=dataset_context
            )
            
            # Update parsing execution
            await self._complete_execution(
                query_id=query.id,
                step="parsing",
                output_data=ai_result,
                db=db
            )
            
            # Step 2: Generate SQL/operations
            await self._create_execution(
                query_id=query.id,
                step="sql_generation",
                status="running",
                db=db
            )
            
            # Generate SQL based on AI result
            generated_sql = self._generate_sql(ai_result, dataset_context)
            
            await self._complete_execution(
                query_id=query.id,
                step="sql_generation",
                output_data={"sql": generated_sql},
                db=db
            )
            
            # Step 3: Record execution with actual timing (SQL execution against a
            # live data engine is not yet wired; we record real timestamps and 0 rows)
            exec_start = datetime.now(timezone.utc)
            await self._create_execution(
                query_id=query.id,
                step="execution",
                status="running",
                start_time=exec_start,
                db=db
            )
            
            execution_result = {
                "execution_time_ms": int((datetime.now(timezone.utc) - exec_start).total_seconds() * 1000),
                "rows_processed": 0,
                "result": []
            }

            await self._complete_execution(
                query_id=query.id,
                step="execution",
                output_data=execution_result,
                db=db
            )
            
            # Update query status
            query.status = "completed"
            query.processed_query = ai_result.get("processed_query", query.original_query)
            query.intent = ai_result.get("intent", "general")
            query.entities = ai_result.get("entities", {})
            query.confidence_score = int(ai_result.get("confidence", 0.5) * 100)
            query.generated_sql = generated_sql
            query.execution_time_ms = execution_result.get("execution_time", 0)
            query.rows_processed = execution_result.get("rows_processed", 0)
            
            await db.commit()
            
        except Exception as e:
            # Update query status to failed
            query.status = "failed"
            query.error_message = str(e)
            await db.commit()
            raise e
    
    async def _create_execution(
        self,
        query_id: uuid.UUID,
        step: str,
        status: str,
        start_time: Optional[datetime] = None,
        db: AsyncSession = None
    ):
        """Create query execution record"""
        execution = QueryExecution(
            query_id=query_id,
            execution_step=step,
            status=status,
            start_time=start_time or datetime.now(timezone.utc)
        )
        
        db.add(execution)
        await db.commit()
    
    async def _complete_execution(
        self,
        query_id: uuid.UUID,
        step: str,
        output_data: Optional[Dict[str, Any]] = None,
        db: AsyncSession = None
    ):
        """Complete query execution"""
        result = await db.execute(
            select(QueryExecution)
            .where(QueryExecution.query_id == query_id)
            .where(QueryExecution.execution_step == step)
            .where(QueryExecution.status == "running")
            .order_by(QueryExecution.created_at.desc())
        )
        
        execution = result.scalar_one_or_none()
        if execution:
            execution.status = "completed"
            execution.output_data = output_data
            execution.end_time = datetime.now(timezone.utc)
            if execution.start_time:
                execution.duration_ms = int((execution.end_time - execution.start_time).total_seconds() * 1000)
            
            await db.commit()
    
    async def _get_dataset_context(self, dataset_id: uuid.UUID, db: AsyncSession) -> Optional[Dict[str, Any]]:
        """Get dataset context for AI processing"""
        try:
            from app.models.dataset import Dataset
            
            result = await db.execute(
                select(Dataset)
                .where(Dataset.id == dataset_id)
            )
            
            dataset = result.scalar_one_or_none()
            if not dataset:
                return None
            
            return {
                "dataset_id": str(dataset.id),
                "name": dataset.name,
                "row_count": dataset.row_count,
                "column_count": dataset.column_count,
                "schema": dataset.schema_info
            }
            
        except Exception as e:
            return None
    
    def _generate_sql(self, ai_result: Dict[str, Any], dataset_context: Optional[Dict[str, Any]]) -> str:
        """Generate SQL query based on AI result"""
        # Mock SQL generation - in real implementation, this would be more sophisticated
        intent = ai_result.get("intent", "general")
        entities = ai_result.get("entities", {})
        
        if intent == "revenue_analysis":
            return "SELECT SUM(revenue) as total_revenue, DATE_TRUNC('month', date) as month FROM sales GROUP BY month ORDER BY month DESC LIMIT 12;"
        elif intent == "trend_analysis":
            return "SELECT date, value FROM metrics ORDER BY date DESC LIMIT 100;"
        else:
            return "SELECT * FROM data LIMIT 100;"
