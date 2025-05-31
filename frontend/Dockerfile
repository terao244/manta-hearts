FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build Next.js app (skip for development)
# RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "run", "dev"]