# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci  # Install all dependencies, including devDependencies
COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist/ ./dist/
RUN npm ci --only=production --ignore-scripts
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]