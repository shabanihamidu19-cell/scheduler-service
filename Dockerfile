FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY . .

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 4001

ENV NODE_ENV=production

CMD ["node", "src/app.js"]
