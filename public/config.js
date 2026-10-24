/**
 * ToolBox Pro - Global Frontend Configuration
 * 
 * Supports seamless multi-engine switching:
 * 1. Primary Render Cloud Service (video-download-tool-9u4x)
 * 2. Local PC Engine (http://localhost:4000 via start.bat)
 */
window.DEFAULT_RENDER_URL = "https://video-download-tool-9u4x.onrender.com";
window.LOCAL_SERVER_URL = "http://localhost:4000";

const hostname = window.location.hostname;
const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
const isOnRender = hostname.endsWith('onrender.com');

// 1. If opened directly on Render, use same origin
// 2. If opened on localhost, use localhost:4000
// 3. If opened on Vercel or any other domain, use the new Render backend
if (isOnRender) {
  window.API_BASE_URL = window.location.origin;
} else if (isLocalHost) {
  window.API_BASE_URL = window.LOCAL_SERVER_URL;
} else {
  window.API_BASE_URL = window.DEFAULT_RENDER_URL;
}
