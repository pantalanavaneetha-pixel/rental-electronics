# Multi-stage build for full-stack Electronic Rental Settlement App
# File: Dockerfile

# Stage 1: Build the React client
FROM node:18-alpine AS client-builder
WORKDIR /app

# Copy root lockfile and packages
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm install

# Copy frontend source and build Vite bundle
COPY frontend/ ./frontend/
RUN npm run build -w frontend

# Stage 2: Setup production server
FROM node:18-alpine
WORKDIR /app

# Copy packaging manifests and install production-only backend packages
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --omit=dev

# Copy backend server code
COPY backend/ ./backend/

# Inject Vite production assets into Express public/client folder
COPY --from=client-builder /app/frontend/dist ./backend/public/client

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

# Start Express server
CMD ["node", "backend/server.js"]
