/**
 * OmniStream PRO — Frontend Application Logic
 * Universal Video & Audio Downloader Client
 */

// State Management
const state = {
  currentMedia: null,
  activeTab: 'video', // 'video' | 'audio'
  selectedOption: null,
  activeJobId: null,
  pollInterval: null,
  history: JSON.parse(localStorage.getItem('omnistream_history') || '[]')
};

// DOM Elements
const urlInput = document.getElementById('urlInput');
const pasteBtn = document.getElementById('pasteBtn');
const clearBtn = document.getElementById('clearBtn');
const fetchBtn = document.getElementById('fetchBtn');
const fetchSpinner = document.getElementById('fetchSpinner');
const platformPillText = document.getElementById('platformPillText');
const defaultLinkIcon = document.getElementById('defaultLinkIcon');
const engineStatusText = document.getElementById('engineStatusText');
const engineStatusBadge = document.getElementById('engineStatusBadge');
const errorBox = document.getElementById('errorBox');
const errorTitle = document.getElementById('errorTitle');
const errorMessage = document.getElementById('errorMessage');
const closeErrorBtn = document.getElementById('closeErrorBtn');

// Media Result Elements
const mediaResultSection = document.getElementById('mediaResultSection');
const mediaThumbnail = document.getElementById('mediaThumbnail');
const mediaDuration = document.getElementById('mediaDuration');
const mediaPlatformTag = document.getElementById('mediaPlatformTag');
const mediaCreator = document.getElementById('mediaCreator');
const mediaViews = document.getElementById('mediaViews');
const viewsRow = document.getElementById('viewsRow');
const mediaTitle = document.getElementById('mediaTitle');
const tabVideo = document.getElementById('tabVideo');
const tabAudio = document.getElementById('tabAudio');
const qualitiesContainer = document.getElementById('qualitiesContainer');
const startDownloadBtn = document.getElementById('startDownloadBtn');
const downloadBtnText = document.getElementById('downloadBtnText');
const videoCountBadge = document.getElementById('videoCountBadge');

// Progress Modal Elements
const progressOverlay = document.getElementById('progressOverlay');
const progressModalTitle = document.getElementById('progressModalTitle');
const closeProgressBtn = document.getElementById('closeProgressBtn');
const progressFileName = document.getElementById('progressFileName');
const progressBarFill = document.getElementById('progressBarFill');
const progressPercent = document.getElementById('progressPercent');
const progressSpeed = document.getElementById('progressSpeed');
const progressSize = document.getElementById('progressSize');
const progressEta = document.getElementById('progressEta');
const downloadReadyBox = document.getElementById('downloadReadyBox');
const directSaveBtn = document.getElementById('directSaveBtn');

// History Drawer Elements
const historyNavBtn = document.getElementById('historyNavBtn');
const historyDrawer = document.getElementById('historyDrawer');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyList = document.getElementById('historyList');
const emptyHistory = document.getElementById('emptyHistory');
const historyCount = document.getElementById('historyCount');

// Server Settings Elements
const apiSettingsBtn = document.getElementById('apiSettingsBtn');
const serverSettingsOverlay = document.getElementById('serverSettingsOverlay');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const backendUrlInput = document.getElementById('backendUrlInput');
const saveBackendBtn = document.getElementById('saveBackendBtn');
const resetBackendBtn = document.getElementById('resetBackendBtn');

// Helper to get active API Base URL (Cross-environment Vercel + Render + Localhost)
function getApiBase() {
  if (typeof window.API_BASE_URL === 'string' && window.API_BASE_URL.trim()) {
    return window.API_BASE_URL.trim().replace(/\/+$/, '');
  }
  const stored = localStorage.getItem('omnistream_backend_url');
  if (stored && stored.trim()) {
    return stored.trim().replace(/\/+$/, '');
  }
  return '';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkEngineStatus();
  updateHistoryUI();
  setupEventListeners();
});

// Theme Functions (Default: Light)
function initTheme() {
  const savedTheme = localStorage.getItem('omnistream_theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('omnistream_theme', theme);

  if (theme === 'dark') {
    if (sunIcon) sunIcon.classList.remove('hidden');
    if (moonIcon) moonIcon.classList.add('hidden');
    if (themeLabel) themeLabel.textContent = 'Light Mode';
  } else {
    if (sunIcon) sunIcon.classList.add('hidden');
    if (moonIcon) moonIcon.classList.remove('hidden');
    if (themeLabel) themeLabel.textContent = 'Dark Mode';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
}

// Platform URL Detection Helper
function detectPlatform(url) {
  if (!url) return 'Auto';
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('instagram.com')) return 'Instagram';
  if (u.includes('tiktok.com')) return 'TikTok';
  if (u.includes('facebook.com') || u.includes('fb.watch')) return 'Facebook';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'Twitter / X';
  if (u.includes('reddit.com')) return 'Reddit';
  if (u.includes('pinterest.com') || u.includes('pin.it')) return 'Pinterest';
  if (u.includes('vimeo.com')) return 'Vimeo';
  return 'Web Media';
}

function updatePlatformBadge() {
  const val = urlInput.value.trim();
  const platform = detectPlatform(val);
  platformPillText.textContent = platform;

  if (val.length > 0) {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }

  // Visual highlight for platform
  if (platform === 'YouTube') {
    platformPillText.style.background = 'rgba(239, 68, 68, 0.15)';
    platformPillText.style.color = '#EF4444';
  } else if (platform === 'Instagram') {
    platformPillText.style.background = 'rgba(221, 42, 123, 0.15)';
    platformPillText.style.color = '#F43F5E';
  } else if (platform === 'TikTok') {
    platformPillText.style.background = 'rgba(0, 242, 254, 0.15)';
    platformPillText.style.color = '#0891B2';
  } else {
    platformPillText.style.background = 'var(--border-subtle)';
    platformPillText.style.color = 'var(--text-secondary)';
  }
}

// Check Backend Engine Status (Clean, friendly status without cluttering technical strings)
async function checkEngineStatus() {
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/status`);
    const data = await res.json();
    if (data.status === 'online') {
      engineStatusText.textContent = 'Online';
      engineStatusBadge.classList.remove('offline');
      engineStatusBadge.title = base ? `Connected to ${base}` : 'Universal Downloader Engine Ready';
    } else {
      throw new Error('Not ready');
    }
  } catch (err) {
    engineStatusText.textContent = 'Offline';
    engineStatusBadge.classList.add('offline');
    engineStatusBadge.title = base 
      ? `Cannot reach backend at ${base} — click Server to reconfigure` 
      : 'Server disconnected — run start.bat locally or click Server to configure Render URL';
  }
}

// Event Listeners Setup
function setupEventListeners() {
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  urlInput.addEventListener('input', updatePlatformBadge);
  urlInput.addEventListener('paste', () => setTimeout(updatePlatformBadge, 50));

  // Enter key in input triggers analyze
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      analyzeMedia();
    }
  });

  // Paste Button
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text;
        updatePlatformBadge();
        urlInput.focus();
      }
    } catch (err) {
      urlInput.focus();
    }
  });

  // Clear Button
  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    updatePlatformBadge();
    urlInput.focus();
  });

  // Fetch / Analyze Button
  fetchBtn.addEventListener('click', analyzeMedia);

  // Error Close
  closeErrorBtn.addEventListener('click', () => {
    errorBox.classList.add('hidden');
  });

  // Tab Switchers
  tabVideo.addEventListener('click', () => switchTab('video'));
  tabAudio.addEventListener('click', () => switchTab('audio'));

  // Start Download
  startDownloadBtn.addEventListener('click', triggerDownload);

  // Modal Close
  closeProgressBtn.addEventListener('click', () => {
    progressOverlay.classList.add('hidden');
  });

  // History Drawer Controls
  historyNavBtn.addEventListener('click', openHistoryDrawer);
  closeDrawerBtn.addEventListener('click', closeHistoryDrawer);
  drawerBackdrop.addEventListener('click', closeHistoryDrawer);
  clearHistoryBtn.addEventListener('click', clearAllHistory);

  // Platform chips click (demo sample links or focus)
  document.querySelectorAll('.platform-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      urlInput.focus();
    });
  });
}

// Show Error Notice
function showError(title, message) {
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  errorBox.classList.remove('hidden');
  errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
  errorBox.classList.add('hidden');
}

// Analyze Media API Call
async function analyzeMedia() {
  const url = urlInput.value.trim();
  if (!url) {
    showError('Link Required', 'Please paste a valid video URL from YouTube, Instagram, TikTok, Facebook, etc.');
    urlInput.focus();
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showError('Invalid URL Format', 'Please make sure your link starts with http:// or https://');
    return;
  }

  hideError();
  mediaResultSection.classList.add('hidden');

  // Loading UI
  fetchBtn.disabled = true;
  fetchSpinner.classList.remove('hidden');
  fetchBtn.querySelector('.btn-arrow').classList.add('hidden');
  fetchBtn.querySelector('.btn-text').textContent = 'Analyzing...';

  try {
    const res = await fetch(`${getApiBase()}/api/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to inspect media URL.');
    }

    state.currentMedia = data;
    renderMediaResult(data);
  } catch (err) {
    showError('Could Not Fetch Video', err.message || 'The server could not access this media. Ensure the video is public.');
  } finally {
    fetchBtn.disabled = false;
    fetchSpinner.classList.add('hidden');
    fetchBtn.querySelector('.btn-arrow').classList.remove('hidden');
    fetchBtn.querySelector('.btn-text').textContent = 'Analyze Media';
  }
}

// Render Video Result Card
function renderMediaResult(media) {
  mediaTitle.textContent = media.title;
  mediaThumbnail.src = media.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60';
  mediaDuration.textContent = media.duration;
  mediaPlatformTag.textContent = media.platform;
  mediaCreator.textContent = media.uploader;

  if (media.views) {
    viewsRow.classList.remove('hidden');
    mediaViews.textContent = media.views;
  } else {
    viewsRow.classList.add('hidden');
  }

  // Update tabs
  const videoOpts = media.options.video || [];
  videoCountBadge.textContent = `${videoOpts.length} Available`;

  // Default to Video tab
  state.activeTab = 'video';
  tabVideo.classList.add('active');
  tabAudio.classList.remove('active');

  renderQualityOptions();

  mediaResultSection.classList.remove('hidden');
  mediaResultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Switch Format Tab
function switchTab(tab) {
  if (state.activeTab === tab) return;
  state.activeTab = tab;

  if (tab === 'video') {
    tabVideo.classList.add('active');
    tabAudio.classList.remove('active');
  } else {
    tabAudio.classList.add('active');
    tabVideo.classList.remove('active');
  }

  renderQualityOptions();
}

// Render Quality Options (Grid of cards)
function renderQualityOptions() {
  qualitiesContainer.innerHTML = '';
  if (!state.currentMedia) return;

  const options = state.activeTab === 'video' 
    ? state.currentMedia.options.video 
    : state.currentMedia.options.audio;

  if (!options || options.length === 0) {
    qualitiesContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No formats available in this category.</p>';
    return;
  }

  // Select first by default
  state.selectedOption = options[0];
  downloadBtnText.textContent = `Download ${state.selectedOption.label} (${state.selectedOption.badge})`;

  options.forEach((opt, index) => {
    const card = document.createElement('div');
    card.className = `quality-card ${index === 0 ? 'selected' : ''}`;
    card.setAttribute('data-id', opt.id);

    const subtext = opt.type === 'video' ? `Format: .MP4` : `Bitrate: ${opt.bitrate}`;

    card.innerHTML = `
      <div class="quality-card-header">
        <span class="quality-badge">${opt.badge}</span>
      </div>
      <div>
        <div class="quality-label">${opt.label}</div>
        <div class="quality-subtext">${subtext}</div>
      </div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.quality-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.selectedOption = opt;
      downloadBtnText.textContent = `Download ${opt.label} (${opt.badge})`;
    });

    qualitiesContainer.appendChild(card);
  });
}

// Trigger Download Task
async function triggerDownload() {
  if (!state.currentMedia || !state.selectedOption) return;

  const media = state.currentMedia;
  const opt = state.selectedOption;

  // Open Progress Modal
  progressModalTitle.textContent = `Downloading & Processing ${opt.label}...`;
  progressFileName.textContent = media.title;
  progressBarFill.style.width = '0%';
  progressPercent.textContent = '0%';
  progressSpeed.textContent = 'Connecting...';
  progressSize.textContent = 'Preparing';
  progressEta.textContent = 'Calculating';
  downloadReadyBox.classList.add('hidden');
  progressOverlay.classList.remove('hidden');

  try {
    const res = await fetch(`${getApiBase()}/api/start-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: media.webpageUrl,
        type: opt.type,
        formatSpec: opt.formatSpec,
        ext: opt.ext,
        title: media.title,
        audioBitrate: opt.bitrate ? opt.bitrate.replace(/\D/g, '') + 'K' : '320K'
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to start download task.');
    }

    state.activeJobId = data.jobId;
    startPollingProgress(data.jobId, media, opt);
  } catch (err) {
    progressOverlay.classList.add('hidden');
    showError('Download Launch Error', err.message);
  }
}

// Poll Progress
function startPollingProgress(jobId, media, opt) {
  if (state.pollInterval) clearInterval(state.pollInterval);

  state.pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/job-status/${jobId}`);
      if (!res.ok) {
        clearInterval(state.pollInterval);
        return;
      }

      const job = await res.json();

      // Update UI metrics
      if (job.percent) {
        progressBarFill.style.width = `${Math.min(100, job.percent)}%`;
        progressPercent.textContent = `${job.percent.toFixed(1)}%`;
      }

      if (job.speed) {
        progressSpeed.textContent = job.speed;
      }

      if (job.filesize) {
        progressSize.textContent = job.filesize;
      }

      if (job.eta) {
        progressEta.textContent = job.eta;
      }

      if (job.status === 'processing') {
        progressModalTitle.textContent = 'Fusing Streams with FFmpeg...';
      }

      // Check Completion
      if (job.status === 'completed') {
        clearInterval(state.pollInterval);
        progressBarFill.style.width = '100%';
        progressPercent.textContent = '100%';
        progressSpeed.textContent = 'Complete';
        progressEta.textContent = 'Finished';
        progressModalTitle.textContent = 'Media Ready for Saving!';

        // Direct download trigger
        const fileUrl = `${getApiBase()}/api/file/${jobId}`;
        directSaveBtn.href = fileUrl;
        directSaveBtn.setAttribute('download', job.filename);
        downloadReadyBox.classList.remove('hidden');

        // Automatically trigger browser download
        const hiddenLink = document.createElement('a');
        hiddenLink.href = fileUrl;
        hiddenLink.download = job.filename;
        document.body.appendChild(hiddenLink);
        hiddenLink.click();
        document.body.removeChild(hiddenLink);

        // Record in History
        saveToHistory({
          id: jobId,
          title: media.title,
          platform: media.platform,
          quality: opt.label,
          type: opt.type,
          ext: opt.ext,
          filename: job.filename,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

      if (job.status === 'error') {
        clearInterval(state.pollInterval);
        progressModalTitle.textContent = 'Download Encountered an Error';
        showError('Download Failed', job.error || 'Server could not complete this download.');
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 700);
}

// History Management
function saveToHistory(item) {
  state.history.unshift(item);
  if (state.history.length > 30) state.history.pop();
  localStorage.setItem('omnistream_history', JSON.stringify(state.history));
  updateHistoryUI();
}

function updateHistoryUI() {
  historyCount.textContent = state.history.length;
  historyList.innerHTML = '';

  if (state.history.length === 0) {
    historyList.appendChild(emptyHistory);
    return;
  }

  state.history.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-item';
    card.innerHTML = `
      <div class="history-item-top">
        <span class="history-badge">${item.platform} • ${item.quality}</span>
        <span class="history-time">${item.time}</span>
      </div>
      <div class="history-item-title" title="${item.title}">${item.title}</div>
    `;
    historyList.appendChild(card);
  });
}

function clearAllHistory() {
  state.history = [];
  localStorage.removeItem('omnistream_history');
  updateHistoryUI();
}

function openHistoryDrawer() {
  historyDrawer.classList.remove('hidden');
}

function closeHistoryDrawer() {
  historyDrawer.classList.add('hidden');
}

// Server Settings Handlers
if (apiSettingsBtn) {
  apiSettingsBtn.addEventListener('click', () => {
    const current = localStorage.getItem('omnistream_backend_url') || window.API_BASE_URL || '';
    backendUrlInput.value = current;
    serverSettingsOverlay.classList.remove('hidden');
  });
}

if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener('click', () => {
    serverSettingsOverlay.classList.add('hidden');
  });
}

if (serverSettingsOverlay) {
  serverSettingsOverlay.addEventListener('click', (e) => {
    if (e.target === serverSettingsOverlay) {
      serverSettingsOverlay.classList.add('hidden');
    }
  });
}

if (saveBackendBtn) {
  saveBackendBtn.addEventListener('click', () => {
    const val = backendUrlInput.value.trim().replace(/\/+$/, '');
    if (val) {
      localStorage.setItem('omnistream_backend_url', val);
    } else {
      localStorage.removeItem('omnistream_backend_url');
    }
    serverSettingsOverlay.classList.add('hidden');
    checkEngineStatus();
  });
}

if (resetBackendBtn) {
  resetBackendBtn.addEventListener('click', () => {
    localStorage.removeItem('omnistream_backend_url');
    backendUrlInput.value = '';
    serverSettingsOverlay.classList.add('hidden');
    checkEngineStatus();
  });
}
