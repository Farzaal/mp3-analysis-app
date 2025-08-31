# Stage 1: Build
FROM node:21.1.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy the rest of the application code
COPY . .

# Install pm2 globally
RUN npm i pm2 -g

# Install dependencies
RUN yarn 

# Build the NestJS application
RUN yarn build

# Expose the application port
EXPOSE 3000

# Start the NestJS application
CMD ["pm2", "start", "ecosystem.config.js"]
