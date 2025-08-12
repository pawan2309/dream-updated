# syntax=docker/dockerfile:1
FROM node:18-alpine

WORKDIR /app

# Install production deps first for caching (scoped path)
COPY backend/externalapi/package.json ./backend/externalapi/package.json
RUN cd backend/externalapi && npm install --omit=dev

# Copy entire backend to keep relative imports intact
COPY backend ./backend

ENV NODE_ENV=production
ENV NODE_PATH=/app/backend/externalapi/node_modules
EXPOSE 4001

WORKDIR /app/backend/externalapi
CMD ["node", "index.js"]