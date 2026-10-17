/**
 * ToolBox Pro - Global Frontend Configuration
 * 
 * Default Backend URL:
 * Connected to Render cloud service (video-download-tool-m694).
 * When running locally on localhost, the app automatically switches to localhost:4000.
 */
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

window.API_BASE_URL = isLocal ? "http://localhost:4000" : "https://video-download-tool-m694.onrender.com";
