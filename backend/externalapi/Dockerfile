FROM node:18-alpine

WORKDIR /app

# Copy package files from externalapi directory
COPY backend/externalapi/package*.json ./

# Install dependencies
RUN npm install

# Copy the entire backend directory structure
COPY backend/ ./backend/

# Set working directory to externalapi
WORKDIR /app/backend/externalapi

# Expose port
EXPOSE 4001

# Start the application
CMD ["npm", "run", "dev"]
