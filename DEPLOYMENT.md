# Nexus Intelligence Deployment Guide

## Overview

This guide covers deploying Nexus Intelligence using Docker Compose for development and production environments.

## Prerequisites

- Docker & Docker Compose
- PostgreSQL 15+ (if not using Docker)
- Redis 6+ (if not using Docker)
- OpenAI API key
- At least 4GB RAM for development, 8GB for production

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nexus-intelligence
```

### 2. Environment Configuration

Copy the environment files and configure them:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment  
cp frontend/.env.example frontend/.env.local
```

#### Backend Environment Variables

Edit `backend/.env`:

```env
# Basic Settings
PROJECT_NAME=Nexus Intelligence
DEBUG=false

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=postgresql+asyncpg://nexus_user:nexus_password@postgres:5432/nexus_intelligence

# Redis
REDIS_URL=redis://redis:6379

# AI/ML
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4

# File Upload
MAX_FILE_SIZE=104857600
UPLOAD_DIR=uploads
```

#### Frontend Environment Variables

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Docker Deployment

#### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Production

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Scale services if needed
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
```

### 4. Database Setup

The database is automatically initialized when containers start. To run migrations manually:

```bash
# Enter backend container
docker-compose exec backend bash

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Production Deployment

### Security Considerations

1. **Change Default Secrets**: Update all default passwords and secrets
2. **Use HTTPS**: Configure SSL/TLS certificates
3. **Network Security**: Use private networks and firewalls
4. **Regular Updates**: Keep dependencies updated

### Environment-Specific Configurations

#### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: nexus_intelligence
      POSTGRES_USER: nexus_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - nexus-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - nexus-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - postgres
      - redis
    networks:
      - nexus-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=${FRONTEND_API_URL}
    depends_on:
      - backend
    networks:
      - nexus-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - nexus-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  nexus-network:
    driver: bridge
```

#### Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Monitoring and Logging

#### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# View health logs
docker-compose logs backend | grep health
```

#### Log Management

Logs are configured to rotate and can be forwarded to external systems:

```yaml
# In docker-compose.prod.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Backup and Recovery

#### Database Backups

```bash
# Create backup
docker-compose exec postgres pg_dump -U nexus_user nexus_intelligence > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U nexus_user nexus_intelligence < backup.sql
```

#### File Backups

```bash
# Backup uploaded files
docker run --rm -v nexus-intelligence_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check PostgreSQL container status
   - Verify database URL in environment variables
   - Ensure database migrations are run

2. **API Connection Errors**
   - Check backend container logs
   - Verify API URL in frontend environment
   - Check network connectivity between containers

3. **File Upload Issues**
   - Check upload directory permissions
   - Verify file size limits
   - Check storage space

### Debug Commands

```bash
# View container logs
docker-compose logs [service-name]

# Enter container shell
docker-compose exec [service-name] bash

# Check container resource usage
docker stats

# Restart specific service
docker-compose restart [service-name]
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Add load balancer configuration in nginx
```

### Performance Optimization

1. **Database**: Enable connection pooling, optimize queries
2. **Redis**: Use Redis for caching frequently accessed data
3. **CDN**: Use CDN for static assets
4. **Monitoring**: Implement application monitoring

## Security Best Practices

1. **Regular Updates**: Keep all dependencies updated
2. **Secret Management**: Use proper secret management tools
3. **Network Security**: Implement proper network segmentation
4. **Access Control**: Use principle of least privilege
5. **Monitoring**: Implement security monitoring and alerting

## Support

For deployment issues:
1. Check logs for error messages
2. Verify environment configuration
3. Ensure all prerequisites are met
4. Consult the troubleshooting section above

For additional support, create an issue in the repository with:
- Environment details
- Error messages
- Steps to reproduce
- Configuration details
