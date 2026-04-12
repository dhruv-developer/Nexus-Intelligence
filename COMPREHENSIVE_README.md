# Nexus Intelligence - Comprehensive Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Technology Stack](#technology-stack)
5. [Installation & Setup](#installation--setup)
6. [Configuration](#configuration)
7. [API Documentation](#api-documentation)
8. [Frontend Guide](#frontend-guide)
9. [Backend Guide](#backend-guide)
10. [Database Schema](#database-schema)
11. [Data Generation](#data-generation)
12. [Deployment](#deployment)
13. [Testing](#testing)
14. [Troubleshooting](#troubleshooting)
15. [Contributing](#contributing)
16. [FAQ](#faq)

---

## Project Overview

Nexus Intelligence is a comprehensive AI-powered data analytics platform that provides intelligent insights, data visualization, and automated analysis capabilities. The platform is designed to help organizations make data-driven decisions through advanced machine learning algorithms and intuitive user interfaces.

### Key Capabilities
- **AI-Powered Analytics**: Natural language querying and automated insight generation
- **Data Management**: Upload, process, and analyze various data formats
- **Real-time Dashboards**: Interactive visualizations and real-time metrics
- **Collaborative Features**: Multi-user support with role-based access
- **Scalable Architecture**: Built for enterprise-scale data processing

---

## Architecture

### High-Level Architecture
```
Frontend (Next.js) <-> Backend API (FastAPI) <-> Database (PostgreSQL) <-> AI Services
```

### Component Breakdown

#### Frontend Layer
- **Framework**: Next.js 14 with TypeScript
- **UI Components**: Tailwind CSS with shadcn/ui
- **State Management**: React Context + Hooks
- **Authentication**: JWT tokens with refresh mechanism

#### Backend Layer
- **API Framework**: FastAPI with Python
- **Authentication**: OAuth2 + JWT
- **Database ORM**: SQLAlchemy with async support
- **AI Services**: OpenAI GPT integration

#### Data Layer
- **Primary Database**: PostgreSQL
- **File Storage**: Local filesystem with organized uploads
- **Caching**: In-memory session management
- **Data Processing**: Pandas for analytics operations

---

## Features

### Core Features

#### 1. Data Management
- **Multi-format Support**: CSV, Excel, JSON file uploads
- **Data Validation**: Automatic schema detection and validation
- **Data Processing**: Real-time data quality assessment
- **Version Control**: Track dataset versions and changes

#### 2. AI-Powered Analytics
- **Natural Language Queries**: Ask questions in plain English
- **Automated Insights**: AI-generated data insights and recommendations
- **Predictive Analytics**: Trend analysis and forecasting
- **Anomaly Detection**: Identify unusual patterns in data

#### 3. Visualization & Dashboards
- **Interactive Charts**: Multiple chart types with real-time updates
- **Custom Dashboards**: Drag-and-drop dashboard builder
- **Export Options**: PDF, Excel, and image exports
- **Responsive Design**: Mobile-friendly interface

#### 4. User Management
- **Authentication**: Secure login with OAuth providers
- **Role-Based Access**: Admin, analyst, and viewer roles
- **User Profiles**: Personalized settings and preferences
- **Activity Tracking**: Comprehensive audit logs

---

## Technology Stack

### Frontend Technologies
```json
{
  "framework": "Next.js 14",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "components": "shadcn/ui",
  "icons": "Lucide React",
  "charts": "Recharts",
  "http": "Axios",
  "state": "React Context"
}
```

### Backend Technologies
```json
{
  "framework": "FastAPI",
  "language": "Python 3.13",
  "database": "PostgreSQL",
  "orm": "SQLAlchemy",
  "auth": "OAuth2 + JWT",
  "ai": "OpenAI GPT",
  "data": "Pandas, NumPy",
  "validation": "Pydantic"
}
```

### Development Tools
```json
{
  "package_manager": "npm/pip",
  "linting": "ESLint, Pylint",
  "formatting": "Prettier, Black",
  "testing": "Jest, pytest",
  "containerization": "Docker",
  "version_control": "Git"
}
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.13+
- PostgreSQL 14+
- Git

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd nexus-intelligence
```

### Step 2: Backend Setup

#### 2.1 Create Virtual Environment
```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

#### 2.2 Install Dependencies
```bash
pip install -r requirements.txt
```

#### 2.3 Database Setup
```bash
# Create PostgreSQL database
createdb nexus_intelligence

# Run migrations
alembic upgrade head
```

#### 2.4 Environment Configuration
Create `.env` file in backend directory:
```env
DATABASE_URL=postgresql://username:password@localhost/nexus_intelligence
OPENAI_API_KEY=your_openai_api_key
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### 2.5 Start Backend Server
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Frontend Setup

#### 3.1 Install Dependencies
```bash
cd frontend
npm install
```

#### 3.2 Environment Configuration
Create `.env.local` file in frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Nexus Intelligence
```

#### 3.3 Start Frontend Server
```bash
npm run dev
```

### Step 4: Verify Installation
1. Open http://localhost:3000 in your browser
2. Register a new account or login with existing credentials
3. Navigate to different sections to verify functionality

---

## Configuration

### Backend Configuration

#### Database Settings
```python
# app/core/config.py
DATABASE_URL = "postgresql://user:password@localhost/dbname"
DATABASE_POOL_SIZE = 10
DATABASE_MAX_OVERFLOW = 20
```

#### AI Service Configuration
```python
# app/core/config.py
OPENAI_API_KEY = "your-api-key"
OPENAI_MODEL = "gpt-4"
OPENAI_TEMPERATURE = 0.7
OPENAI_MAX_TOKENS = 1000
```

#### Authentication Settings
```python
# app/core/config.py
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
```

### Frontend Configuration

#### API Configuration
```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds
```

#### Theme Configuration
```typescript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      // ... other theme colors
    }
  }
}
```

---

## API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### POST /api/v1/auth/login
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Dataset Endpoints

#### GET /api/v1/datasets/
List all datasets for the authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Sales Data",
    "description": "Monthly sales figures",
    "file_name": "sales.csv",
    "file_size": 1024000,
    "file_type": ".csv",
    "row_count": 1000,
    "column_count": 12,
    "processing_status": "completed",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/v1/datasets/upload
Upload a new dataset file.

**Request:** Multipart form data
- `file`: The dataset file
- `name`: Dataset name (optional)
- `description`: Dataset description (optional)

**Response:**
```json
{
  "id": "uuid",
  "name": "Uploaded Dataset",
  "processing_status": "pending",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Query Endpoints

#### POST /api/v1/queries/
Execute a natural language query on datasets.

**Request Body:**
```json
{
  "query": "Show me total sales by region",
  "dataset_ids": ["uuid1", "uuid2"],
  "query_type": "natural_language"
}
```

**Response:**
```json
{
  "id": "uuid",
  "query": "Show me total sales by region",
  "result": {
    "data": [...],
    "chart_type": "bar",
    "summary": "Total sales by region show North America leading with $2.5M"
  },
  "execution_time": 1.23,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Insight Endpoints

#### GET /api/v1/insights/
Get AI-generated insights for datasets.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "headline": "Sales increased by 25% in Q4",
    "explanation": "The data shows a significant upward trend...",
    "confidence_score": 0.95,
    "dataset_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

## Frontend Guide

### Component Structure

#### Layout Components
```
src/app/
  layout.tsx          # Main app layout
  page.tsx           # Home page
  dashboard/         # Dashboard section
  analytics/         # Analytics section
  datasets/          # Dataset management
  chat/              # AI chat interface
  upload/            # Data upload
  reports/           # Reports section
  forecasting/       # Forecasting section
```

#### Shared Components
```
src/components/
  ui/                # Base UI components (shadcn/ui)
  charts/            # Chart components
  forms/             # Form components
  dataset/           # Dataset-specific components
  chat/              # Chat interface components
  layout/            # Layout components
```

#### Core Services
```
src/lib/
  api.ts             # API service layer
  auth.ts            # Authentication utilities
  utils.ts           # Helper functions
  hooks/             # Custom React hooks
  contexts/          # React contexts
```

### State Management

#### Authentication Context
```typescript
// contexts/auth-context.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}
```

#### Dataset Context
```typescript
// contexts/dataset-context.tsx
interface DatasetContextType {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  uploadFile: (file: File) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  refreshDatasets: () => Promise<void>;
}
```

### Styling Guidelines

#### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        nexus: {
          100: '#f0f9ff',
          600: '#0284c7',
          900: '#0c4a6e',
        }
      }
    }
  }
}
```

#### Component Styling Patterns
```typescript
// Button component example
<button className="btn-primary">
  <Icon className="w-4 h-4 mr-2" />
  Button Text
</button>

// Card component example
<div className="dashboard-card p-6 hover-lift">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-muted-foreground">Card content</p>
</div>
```

---

## Backend Guide

### Project Structure

#### Application Structure
```
app/
  main.py              # FastAPI application entry point
  core/                # Core application logic
    config.py          # Configuration settings
    security.py        # Security utilities
    database.py        # Database connection
  api/                 # API routes
    api_v1/            # API version 1
      endpoints/       # Route endpoints
        auth.py        # Authentication routes
        datasets.py    # Dataset routes
        queries.py     # Query routes
        insights.py    # Insight routes
  models/              # Database models
    user.py            # User model
    dataset.py         # Dataset model
    query.py           # Query model
    insight.py         # Insight model
  schemas/             # Pydantic schemas
    auth.py            # Auth schemas
    dataset.py         # Dataset schemas
    query.py           # Query schemas
    insight.py         # Insight schemas
  services/            # Business logic
    auth_service.py    # Authentication service
    dataset_service.py # Dataset service
    query_service.py   # Query service
    insight_service.py # Insight service
    ai_service.py      # AI service
```

#### Database Models

#### User Model
```python
# models/user.py
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

#### Dataset Model
```python
# models/dataset.py
class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(50), nullable=False)
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    processing_status = Column(String(50), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

### Service Layer

#### Dataset Service
```python
# services/dataset_service.py
class DatasetService:
    async def create_dataset(self, dataset_data: DatasetCreate, user_id: str, db: AsyncSession) -> Dataset:
        """Create a new dataset record"""
        dataset = Dataset(**dataset_data.dict(), user_id=user_id)
        db.add(dataset)
        await db.commit()
        await db.refresh(dataset)
        return dataset
    
    async def get_user_datasets(self, user_id: str, db: AsyncSession) -> List[Dataset]:
        """Get all datasets for a user"""
        result = await db.execute(
            select(Dataset).where(Dataset.user_id == user_id).order_by(Dataset.created_at.desc())
        )
        return result.scalars().all()
    
    async def process_uploaded_file(self, file_path: str, dataset_id: str, db: AsyncSession):
        """Process uploaded file and extract metadata"""
        try:
            # Read file with pandas
            df = pd.read_csv(file_path)
            
            # Update dataset with file metadata
            await db.execute(
                update(Dataset)
                .where(Dataset.id == dataset_id)
                .values(
                    row_count=len(df),
                    column_count=len(df.columns),
                    processing_status="completed"
                )
            )
            await db.commit()
        except Exception as e:
            await db.execute(
                update(Dataset)
                .where(Dataset.id == dataset_id)
                .values(processing_status="failed", processing_error=str(e))
            )
            await db.commit()
```

#### AI Service
```python
# services/ai_service.py
class AIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def generate_insights(self, dataset_summary: str, query: str) -> str:
        """Generate AI insights for dataset"""
        prompt = f"""
        Based on the following dataset information:
        {dataset_summary}
        
        Answer this user query: {query}
        
        Provide a detailed analysis with specific insights and recommendations.
        """
        
        response = await self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a data analysis expert."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=settings.OPENAI_MAX_TOKENS,
            temperature=settings.OPENAI_TEMPERATURE
        )
        
        return response.choices[0].message.content
```

---

## Database Schema

### Entity Relationship Diagram

```
Users (1) -----> (N) Datasets
Users (1) -----> (N) Queries
Users (1) -----> (N) Insights

Datasets (1) --> (N) DatasetColumns
Datasets (1) --> (N) QueryExecutions
Datasets (1) --> (N) Insights

Queries (1) --> (N) QueryExecutions
Queries (1) --> (N) Insights

Insights (1) --> (N) InsightVisualizations
```

### Table Definitions

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

#### Datasets Table
```sql
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    row_count INTEGER,
    column_count INTEGER,
    schema_info JSONB,
    sample_data JSONB,
    processing_status VARCHAR(50) DEFAULT 'pending',
    processing_error TEXT,
    missing_values_percentage INTEGER,
    duplicate_rows_percentage INTEGER,
    data_quality_score INTEGER,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE
);
```

#### Queries Table
```sql
CREATE TABLE queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    dataset_id UUID REFERENCES datasets(id),
    query_text TEXT NOT NULL,
    query_type VARCHAR(50) DEFAULT 'natural_language',
    generated_sql TEXT,
    result_data JSONB,
    result_summary TEXT,
    execution_time DECIMAL(10,3),
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Insights Table
```sql
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    dataset_id UUID REFERENCES datasets(id),
    query_id UUID REFERENCES queries(id),
    headline TEXT NOT NULL,
    explanation TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    insight_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Data Generation

### Realistic Dataset Generator

The project includes a comprehensive dataset generator that creates realistic business data for testing and development.

#### Features
- **Multiple Dataset Types**: Sales, customers, inventory, employees, financial data
- **Realistic Distributions**: Proper statistical distributions and business logic
- **Multiple Formats**: CSV, JSON, Excel output
- **Configurable Size**: Adjustable record counts
- **Data Relationships**: Logical relationships between datasets

#### Usage

##### Generate All Datasets
```bash
cd backend
source venv/bin/activate
python scripts/run_dataset_generation.py
```

##### Custom Generation
```python
from scripts.generate_realistic_datasets import RealisticDatasetGenerator

generator = RealisticDatasetGenerator()

# Generate specific dataset
sales_data = generator.generate_sales_data(1000)
customers_data = generator.generate_customer_data(500)

# Save datasets
generator.save_dataset(sales_data, 'sales_data', 'csv')
generator.save_dataset(customers_data, 'customers_data', 'excel')
```

##### Dataset Types

###### Sales Data
```python
# Fields: transaction_id, date, time, customer_id, customer_name, 
# email, category, product_name, quantity, unit_price, discount_percent,
# total_amount, payment_method, store_location, sales_rep, customer_segment
```

###### Customer Data
```python
# Fields: customer_id, first_name, last_name, email, phone, age, gender,
# city, state, zip_code, country, registration_date, last_purchase_date,
# total_purchases, total_spent, avg_purchase_value, annual_income,
# customer_segment, satisfaction_score, loyalty_points, preferred_category
```

###### Inventory Data
```python
# Fields: product_id, sku, product_name, category, brand, description,
# cost, selling_price, margin_percent, stock_quantity, reorder_level,
# supplier, supplier_lead_time_days, warehouse_location, last_restocked_date,
# product_status, weight_kg, dimensions_cm, barcode
```

###### Employee Data
```python
# Fields: employee_id, first_name, last_name, email, phone, department,
# position, salary, hire_date, years_employed, performance_score, status,
# work_location, manager_id, skills, certifications, last_review_date
```

###### Financial Data
```python
# Fields: period, year, month, revenue, cost_of_goods_sold, gross_profit,
# operating_expenses, net_profit, profit_margin, revenue_growth,
# customers_acquired, customer_churn_rate, average_order_value
```

#### Upload Generated Data
```bash
# Upload datasets to backend
python scripts/upload_datasets_with_auth.py
```

---

## Deployment

### Production Deployment

#### Docker Deployment

##### Dockerfile (Backend)
```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

##### Dockerfile (Frontend)
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

##### Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: nexus_intelligence
      POSTGRES_USER: nexus_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://nexus_user:secure_password@postgres/nexus_intelligence
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - postgres
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    depends_on:
      - backend
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

#### Cloud Deployment

##### AWS Deployment
```bash
# Using ECS with RDS
aws ecs create-cluster --cluster-name nexus-intelligence
aws rds create-db-instance --db-instance-identifier nexus-db --db-instance-class db.t3.micro --engine postgres --master-username nexus_user --master-user-password secure_password
```

##### Vercel Deployment (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

##### Railway Deployment (Backend)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Environment Variables

#### Production Environment
```env
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/dbname
OPENAI_API_KEY=sk-...
SECRET_KEY=production-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production

# Frontend
NEXT_PUBLIC_API_URL=https://api.nexus-intelligence.com
NEXT_PUBLIC_APP_NAME=Nexus Intelligence
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## Testing

### Backend Testing

#### Unit Tests
```python
# tests/test_auth_service.py
import pytest
from app.services.auth_service import AuthService

@pytest.mark.asyncio
async def test_create_user():
    auth_service = AuthService()
    user_data = UserCreate(
        email="test@example.com",
        password="testpassword",
        full_name="Test User"
    )
    
    user = await auth_service.create_user(user_data, db_session)
    assert user.email == "test@example.com"
    assert user.full_name == "Test User"
```

#### Integration Tests
```python
# tests/test_api_endpoints.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_user():
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "testpassword",
        "full_name": "Test User"
    })
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

def test_login_user():
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

#### Run Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth_service.py
```

### Frontend Testing

#### Component Tests
```typescript
// components/__tests__/DatasetCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DatasetCard } from '../dataset/DatasetCard';

test('renders dataset card with correct information', () => {
  const mockDataset = {
    id: '1',
    name: 'Test Dataset',
    file_size: 1024,
    processing_status: 'completed',
    created_at: '2024-01-01T00:00:00Z'
  };

  render(<DatasetCard dataset={mockDataset} />);
  
  expect(screen.getByText('Test Dataset')).toBeInTheDocument();
  expect(screen.getByText('1 KB')).toBeInTheDocument();
});

test('calls onDelete when delete button is clicked', () => {
  const mockOnDelete = jest.fn();
  const mockDataset = { /* ... */ };
  
  render(<DatasetCard dataset={mockDataset} onDelete={mockOnDelete} />);
  
  fireEvent.click(screen.getByText('Delete'));
  expect(mockOnDelete).toHaveBeenCalledWith(mockDataset.id);
});
```

#### E2E Tests
```typescript
// e2e/dataset-upload.spec.ts
import { test, expect } from '@playwright/test';

test('should upload dataset successfully', async ({ page }) => {
  await page.goto('/upload');
  
  // Login first
  await page.fill('[data-testid=email]', 'test@example.com');
  await page.fill('[data-testid=password]', 'testpassword');
  await page.click('[data-testid=login-button]');
  
  // Upload file
  const fileInput = page.locator('[data-testid=file-input]');
  await fileInput.setInputFiles('test-data.csv');
  
  await page.fill('[data-testid=dataset-name]', 'Test Dataset');
  await page.click('[data-testid=upload-button]');
  
  // Verify success
  await expect(page.locator('[data-testid=success-message]')).toBeVisible();
});
```

#### Run Tests
```bash
# Frontend unit tests
npm test

# E2E tests
npm run test:e2e

# Tests with coverage
npm run test:coverage
```

---

## Troubleshooting

### Common Issues

#### Backend Issues

##### Database Connection Error
```
Error: could not connect to server
```

**Solution:**
1. Verify PostgreSQL is running
2. Check database URL in .env file
3. Ensure database exists
4. Check network connectivity

```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Create database if needed
createdb nexus_intelligence
```

##### Missing Environment Variables
```
Error: OPENAI_API_KEY not found
```

**Solution:**
1. Create .env file in backend directory
2. Add required environment variables
3. Restart the server

```env
OPENAI_API_KEY=your-api-key
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost/dbname
```

##### Module Import Errors
```
ModuleNotFoundError: No module named 'pandas'
```

**Solution:**
1. Activate virtual environment
2. Install dependencies
3. Check Python version compatibility

```bash
source venv/bin/activate
pip install -r requirements.txt
```

#### Frontend Issues

##### API Connection Error
```
Network Error: Failed to fetch
```

**Solution:**
1. Verify backend is running on correct port
2. Check API_URL in .env.local
3. Ensure CORS is configured
4. Check network connectivity

```typescript
// .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

##### Build Errors
```
Error: Type 'X' is not assignable to type 'Y'
```

**Solution:**
1. Check TypeScript types
2. Update interface definitions
3. Run type checking

```bash
npm run type-check
```

##### Authentication Issues
```
Error: 401 Unauthorized
```

**Solution:**
1. Check token expiration
2. Verify token storage
3. Refresh token if needed
4. Check authentication flow

```typescript
// Check token validity
const token = localStorage.getItem('access_token');
if (!token || isTokenExpired(token)) {
  await refreshToken();
}
```

### Performance Issues

#### Slow API Responses
**Symptoms:** API calls taking > 5 seconds

**Solutions:**
1. Add database indexes
2. Implement pagination
3. Cache frequent queries
4. Optimize database queries

```python
# Add database index
class Dataset(Base):
    __tablename__ = "datasets"
    
    user_id = Column(UUID, Index=True)  # Add index
    created_at = Column(DateTime, Index=True)  # Add index
```

#### Frontend Performance
**Symptoms:** Slow page loads, laggy interactions

**Solutions:**
1. Implement code splitting
2. Optimize bundle size
3. Use React.memo for components
4. Add loading states

```typescript
// Code splitting
const Dashboard = lazy(() => import('./dashboard'));

// React.memo
const DatasetCard = memo(({ dataset }) => {
  return <div>{dataset.name}</div>;
});
```

### Debugging Tools

#### Backend Debugging
```python
# Add logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Use debugger
import pdb; pdb.set_trace()

# Check database queries
from sqlalchemy.dialects import postgresql
print(str(query.statement.compile(dialect=postgresql.dialect())))
```

#### Frontend Debugging
```typescript
// Console logging
console.log('API Response:', response);

// React DevTools
// Install React DevTools browser extension

// Network tab debugging
// Check Network tab in browser dev tools
```

---

## Contributing

### Development Workflow

#### 1. Setup Development Environment
```bash
# Clone repository
git clone <repository-url>
cd nexus-intelligence

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup frontend
cd ../frontend
npm install
```

#### 2. Create Feature Branch
```bash
git checkout -b feature/new-feature
```

#### 3. Make Changes
- Follow coding standards
- Add tests for new features
- Update documentation
- Ensure all tests pass

#### 4. Submit Pull Request
```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

### Code Standards

#### Python Standards
```python
# Use Black for formatting
black app/

# Use isort for imports
isort app/

# Use flake8 for linting
flake8 app/

# Type hints required
def process_data(data: List[str]) -> Dict[str, int]:
    return {"count": len(data)}
```

#### TypeScript Standards
```typescript
// Use Prettier for formatting
npm run format

// Use ESLint for linting
npm run lint

// Strict TypeScript
interface User {
  id: string;
  name: string;
  email: string;
}

// Use proper types
const users: User[] = [];
```

#### Git Commit Messages
```
feat: add new feature
fix: fix bug in authentication
docs: update API documentation
style: format code with prettier
refactor: optimize database queries
test: add unit tests for user service
chore: update dependencies
```

### Testing Requirements

#### Before Submitting
1. All tests must pass
2. Code coverage > 80%
3. No linting errors
4. Documentation updated
5. Manual testing completed

#### Test Coverage
```bash
# Backend coverage
pytest --cov=app --cov-report=html

# Frontend coverage
npm run test:coverage
```

---

## FAQ

### General Questions

#### Q: What is Nexus Intelligence?
A: Nexus Intelligence is an AI-powered data analytics platform that provides natural language querying, automated insights, and interactive visualizations for business data analysis.

#### Q: What data formats are supported?
A: The platform supports CSV, Excel (.xlsx), and JSON file formats for data upload and analysis.

#### Q: Is the platform secure?
A: Yes, the platform uses industry-standard security practices including JWT authentication, encrypted data transmission, and role-based access control.

### Technical Questions

#### Q: What are the system requirements?
A: 
- **Backend**: Python 3.13+, PostgreSQL 14+, 4GB RAM minimum
- **Frontend**: Node.js 18+, 2GB RAM minimum
- **Recommended**: 8GB RAM, SSD storage for optimal performance

#### Q: Can I deploy on my own infrastructure?
A: Yes, the platform is designed for self-hosting and provides Docker containers and deployment guides for various cloud platforms.

#### Q: How does the AI integration work?
A: The platform integrates with OpenAI's GPT models for natural language processing and insight generation. You need to provide your own OpenAI API key.

### Usage Questions

#### Q: How do I upload my data?
A: Navigate to the Upload page, select your file, provide a name and description, and click upload. The system will automatically process and analyze your data.

#### Q: Can I ask questions in natural language?
A: Yes, simply type your question in the chat interface (e.g., "Show me sales by region") and the AI will generate appropriate visualizations and insights.

#### Q: How are insights generated?
A: Insights are generated using AI analysis of your data patterns, trends, and anomalies. The system identifies statistically significant patterns and presents them as actionable insights.

### Troubleshooting

#### Q: I'm getting a database connection error
A: Ensure PostgreSQL is running, check your database URL in the .env file, and verify the database exists.

#### Q: The frontend is not connecting to the backend
A: Check that both services are running, verify the API URL in .env.local, and ensure CORS is properly configured.

#### Q: My uploaded data is not showing up
A: Check the processing status of your dataset in the Datasets page. If it shows "failed", check the error message and ensure your file format is supported.

### Licensing and Support

#### Q: What license does the project use?
A: The project is licensed under the MIT License. See the LICENSE file for details.

#### Q: How can I get support?
A: 
- Check the troubleshooting section
- Review the GitHub issues
- Join our community Discord
- Contact support at support@nexus-intelligence.com

#### Q: Can I contribute to the project?
A: Yes! We welcome contributions. Please see the Contributing section for guidelines on how to get started.

---

## Quick Start Guide

### 5-Minute Setup

1. **Clone and Setup**
```bash
git clone <repository-url>
cd nexus-intelligence
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Database Setup**
```bash
createdb nexus_intelligence
echo "DATABASE_URL=postgresql://localhost/nexus_intelligence" > .env
echo "OPENAI_API_KEY=your-key-here" >> .env
```

4. **Frontend Setup**
```bash
cd ../frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

5. **Start Services**
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

6. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### First Steps

1. **Register Account**: Create a new user account
2. **Upload Data**: Upload a CSV/Excel file with your data
3. **Ask Questions**: Use natural language to query your data
4. **View Insights**: Explore AI-generated insights
5. **Create Dashboards**: Build custom visualizations

---

## Contact Information

- **Website**: https://nexus-intelligence.com
- **Documentation**: https://docs.nexus-intelligence.com
- **Support**: support@nexus-intelligence.com
- **GitHub**: https://github.com/nexus-intelligence/nexus-intelligence
- **Discord**: https://discord.gg/nexus-intelligence

---

*This comprehensive guide covers all aspects of the Nexus Intelligence platform. For specific questions or issues, please refer to the relevant sections or contact our support team.*
