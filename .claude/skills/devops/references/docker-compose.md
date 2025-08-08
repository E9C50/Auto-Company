# Docker Compose

Multi-container application orchestration.

## Basic Structure

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/app
    depends_on:
      - db
      - redis
    volumes:
      - ./src:/app/src
    networks:
      - app-network
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    networks:
      - app-network
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

## Commands

```bash
# Start services
docker compose up
docker compose up -d

# Build images before starting
docker compose up --build

# Scale service
docker compose up -d --scale web=3

# Stop services
docker compose down

# Stop and remove volumes
docker compose down --volumes

# Logs
docker compose logs
docker compose logs -f web

# Execute command
docker compose exec web sh
docker compose exec db psql -U user -d app

# List services
docker compose ps

# Restart service
docker compose restart web

# Pull images
docker compose pull

# Validate
docker compose config
```

## Environment-Specific Configs

**compose.yml (base):**
```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
```

**compose.override.yml (dev, auto-loaded):**
```yaml
services:
  web:
    volumes:
      - ./src:/app/src  # Live reload
    environment:
      - NODE_ENV=development
      - DEBUG=true
    command: npm run dev
```

**compose.prod.yml (production):**
```yaml
services:
  web:
    image: registry.example.com/myapp:1.0
    restart: always
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

**Usage:**
```bash
# Development (uses compose.yml + compose.override.yml)
docker compose up

# Production
docker compose -f compose.yml -f compose.prod.yml up -d
```

