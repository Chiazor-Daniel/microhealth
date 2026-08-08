FROM node:22-slim

# Install build tools for better-sqlite3 native bindings
RUN apt-get update && apt-get install -y python3 make g++ curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose backend port
EXPOSE 3001

# Run migrations then start the server
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm start"]
