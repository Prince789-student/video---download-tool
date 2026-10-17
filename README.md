# OmniStream PRO — Universal Video & Audio Downloader

A full-stack, media downloader web application built with Node.js, Express, HTML5, Vanilla CSS3, and backed by the local power of **yt-dlp** and **FFmpeg**.

---

## 🚀 Key Features

- **Multi-Platform Support**:
  - **YouTube**: Videos (up to 4K / 1080p FHD 60fps), Shorts, and Playlists.
  - **Instagram**: Public Reels, IGTV, and feed video posts.
  - **TikTok**: Clean watermark-free downloads and audio tracks.
  - **Facebook & Twitter / X**: Video clips and public posts.
  - **Reddit & Pinterest**: Videos with audio sync.
  - **1,000+ Platforms**: Fully supported via the internal `yt-dlp` engine.

- **Dual Mode (Video & Audio)**:
  - **Video**: Lossless MP4 in 4K, 1440p, 1080p Full HD, 720p HD, and 480p.
  - **Audio**: 320kbps High Quality MP3, 192kbps Standard MP3, or Lossless M4A.

- **Real-Time Progress & Speed**:
  - Live download speed meter (e.g. `8.4 MiB/s`), file size tracking, ETA, and progress bar.
  - Automated FFmpeg stream fusion (ensures high-res 1080p/4K videos have fully synchronized audio).

- **Local Storage History**:
  - Keep track of downloaded videos and audio clips directly in your browser.

---

## 🛠️ How to Run

1. Open your terminal in this directory:
   ```bash
   cd "downloder tool"
   ```
2. Start the local server:
   ```bash
   node server.js
   ```
   *(Or simply double-click `start.bat`)*

3. Open your browser and visit:
   ```
   http://localhost:4000/
   ```

---

## 📁 Project Structure

```
downloder tool/
├── public/
│   ├── index.html        # Modern frontend UI
│   ├── style.css         # Dark obsidian theme & glassmorphism
│   └── app.js            # Platform auto-detect, polling & download logic
├── temp_downloads/       # Automated temporary download cache (auto-cleaned)
├── server.js             # Express API backed by yt-dlp & FFmpeg
├── package.json          # Node dependencies (express, cors)
└── start.bat             # 1-click double-click launcher
```
