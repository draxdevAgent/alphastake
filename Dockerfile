FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY dist/ ./dist/
COPY api/ ./api/

# Expose port
EXPOSE 3456

# Run the API
CMD ["node", "dist/api/server-standalone.js"]
