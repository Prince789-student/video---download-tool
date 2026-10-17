# Production Dockerfile for OmniStream Downloader on Render
FROM node:20-bullseye-slim

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies: Python3, pip, ffmpeg, curl, ca-certificates, unzip
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install latest yt-dlp
RUN pip3 install --no-cache-dir -U yt-dlp

# Install Deno for yt-dlp JavaScript challenge solving
RUN curl -fsSL https://deno.land/install.sh | sh
ENV DENO_INSTALL="/root/.deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"

# Set working directory
WORKDIR /app

# Install Node dependencies first for Docker caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Ensure temp_downloads folder exists
RUN mkdir -p /app/temp_downloads

# Render injects PORT dynamically (default 4000 / 10000)
ENV PORT=4000
EXPOSE 4000

# Start server
CMD ["node", "server.js"]
