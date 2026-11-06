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
const protocol = window.location.protocol;
const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
const isFileProtocol = protocol === 'file:';
const isOnRender = hostname.endsWith('onrender.com');

// 1. If running locally (localhost or opened via file://), default to Local PC Engine (fast & lossless)
// 2. If opened directly on Render, use same origin
// 3. If opened on Vercel or custom domain, default to cloud backend
if (isLocalHost || isFileProtocol) {
  window.API_BASE_URL = window.LOCAL_SERVER_URL;
} else if (isOnRender) {
  window.API_BASE_URL = window.location.origin;
} else {
  window.API_BASE_URL = window.DEFAULT_RENDER_URL;
}
