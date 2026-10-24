/**
 * ToolBox Pro - Global Frontend Configuration
 * 
 * Supports seamless multi-engine switching:
 * 1. Local PC Engine (http://localhost:4000 via start.bat)
 * 2. Render Cloud Service (video-download-tool-m694)
 */
window.DEFAULT_RENDER_URL = "https://video-download-tool-m694.onrender.com";
window.LOCAL_SERVER_URL = "http://localhost:4000";

const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// If running directly on localhost, default to localhost:4000. Otherwise default to Render cloud.
window.API_BASE_URL = isLocalHost ? window.LOCAL_SERVER_URL : window.DEFAULT_RENDER_URL;
