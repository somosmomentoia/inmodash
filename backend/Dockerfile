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

# Start command - migrations run at startup when DATABASE_URL is available
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
