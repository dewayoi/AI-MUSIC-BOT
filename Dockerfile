# Use a more complete base image to ensure build compatibility
FROM node:20

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    sqlite3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and force sqlite3 to build from source
# This fixes the GLIBC mismatch issue
RUN npm install && npm rebuild sqlite3 --build-from-source

# Copy the rest of the application
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p songs outputs/images outputs/videos outputs/json outputs/audio database && \
    chmod -R 777 songs outputs database

# Entry point
CMD ["node", "index.js"]
