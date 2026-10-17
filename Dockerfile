# Production Dockerfile for OmniStream Downloader on Render (Debian 12 Bookworm)
FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies: ffmpeg, curl, ca-certificates, unzip, python3
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    ca-certificates \
    unzip \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Install latest standalone yt-dlp binary directly
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

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
