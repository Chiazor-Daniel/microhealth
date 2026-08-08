FROM node:22-slim AS builder

WORKDIR /app

# Install frontend dependencies and build
COPY package*.json ./
RUN npm install

COPY . .
ENV VITE_API_URL=/api
RUN npm run build

# Move built frontend into backend so Express can serve it
RUN mkdir -p /app/backend/frontend/dist \
  && cp -r /app/dist/* /app/backend/frontend/dist/

# Final runtime image
FROM node:22-slim

# Install build tools for better-sqlite3 native bindings
RUN apt-get update && apt-get install -y python3 make g++ curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm install

COPY backend/. .

# Copy built frontend into backend/frontend/dist
COPY --from=builder /app/backend/frontend/dist ./frontend/dist

# Create SQLite data directory
RUN mkdir -p /app/data

EXPOSE 3001

# Run migrations then start server (seed separately on first deploy)
CMD ["sh", "-c", "npm run db:migrate && npm start"]
