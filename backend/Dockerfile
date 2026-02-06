# Simple Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Expose port
EXPOSE 3001

# Start command - push schema to DB at startup (creates tables if not exist)
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.js"]
