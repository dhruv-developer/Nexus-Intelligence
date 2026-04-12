from fastapi import APIRouter

from app.api.api_v1.endpoints import auth, users, datasets, queries, insights, chat

api_router = APIRouter()

# Authentication endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# User endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Dataset endpoints
api_router.include_router(datasets.router, prefix="/datasets", tags=["datasets"])

# Query endpoints
api_router.include_router(queries.router, prefix="/queries", tags=["queries"])

# Insight endpoints
api_router.include_router(insights.router, prefix="/insights", tags=["insights"])

# Chat endpoints
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
