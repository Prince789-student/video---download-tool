# 🚀 Deployment Guide: OmniStream Pro Downloader

This guide explains step-by-step how to deploy your downloader tool:
- **Backend (API + Engine):** On **Render** (using Docker for yt-dlp + FFmpeg + Deno)
- **Frontend (UI):** On **Vercel**

---

## 📦 Step 1: Push Code to GitHub

1. Open your terminal in the `downloder tool` folder:
   ```bash
   git init
   git add .
   git commit -m "Deploy setup for Vercel and Render"
   ```
2. Create a new repository on [GitHub](https://github.com/new) (e.g. `omnistream-downloader`).
3. Push your repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/omnistream-downloader.git
   git branch -M main
   git push -u origin main
   ```

---

## 🛠️ Step 2: Deploy Backend to Render

Because the backend needs **FFmpeg**, **yt-dlp**, and **Deno** to download high-resolution 1080p/4K videos and solve bot challenges, we configured a production **`Dockerfile`** for Render.

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository (`omnistream-downloader`).
3. In settings:
   - **Name:** `omnistream-downloader-api` (or any name you choose)
   - **Language / Environment:** Select **Docker** (Render will automatically detect the `Dockerfile`)
   - **Region:** Choose the region closest to you (e.g. Singapore or Frankfurt)
   - **Instance Type:** **Free**
4. Click **Deploy Web Service**.
5. Once deployed, Render will give you your public URL:
   - Example: `https://omnistream-downloader-api.onrender.com`
6. Test it by opening:
   - `https://omnistream-downloader-api.onrender.com/api/status`
   - You should see: `{"status":"online", "engine":"yt-dlp", ...}`

---

## 🌐 Step 3: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** → **Project**.
2. Import your GitHub repository (`omnistream-downloader`).
3. In the project configuration:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (or click Edit and select `public`)
4. Click **Deploy**.
5. Vercel will give you your live URL (e.g. `https://omnistream-downloader.vercel.app`).

---

## 🔗 Step 4: Connect Vercel to Render

You have **two easy ways** to connect your frontend with your backend:

### Option A: From the UI (Instant - 5 Seconds)
1. Open your live Vercel site in your browser.
2. Click the **Server** button (⚙️ icon) in the top-right header.
3. Paste your Render backend URL (e.g. `https://omnistream-downloader-api.onrender.com`).
4. Click **Save & Connect**. The status badge will instantly turn green (`● Online`).

### Option B: Via `public/config.js`
Open `public/config.js` and set:
```javascript
window.API_BASE_URL = "https://omnistream-downloader-api.onrender.com";
```
Commit and push to GitHub, and Vercel will automatically redeploy!

---

## 💡 Notes for Free Tier on Render:
- Free services on Render go to sleep after 15 minutes of inactivity. When a user visits your site after inactivity, the first request may take ~30-40 seconds to wake up the server. Once awake, all video processing and downloads are super-fast.
