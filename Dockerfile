FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies (including better-sqlite3 build deps)
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm install --only=production \
    && apk del .build-deps

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p data logs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the bot after running migrations
CMD ["sh", "-c", "npm run db:migrate && node src/bot.js"]
