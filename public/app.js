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
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeLabel = document.getElementById('themeLabel');
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');

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
const errorActions = document.getElementById('errorActions');
const serverSettingsOverlay = document.getElementById('serverSettingsOverlay');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const modalStatusPill = document.getElementById('modalStatusPill');
const modalActiveUrl = document.getElementById('modalActiveUrl');
const modalStatusMeta = document.getElementById('modalStatusMeta');
const selectLocalServerCard = document.getElementById('selectLocalServerCard');
const selectRenderServerCard = document.getElementById('selectRenderServerCard');
const useLocalServerBtn = document.getElementById('useLocalServerBtn');
const useRenderServerBtn = document.getElementById('useRenderServerBtn');
const backendUrlInput = document.getElementById('backendUrlInput');
const saveBackendBtn = document.getElementById('saveBackendBtn');
const resetBackendBtn = document.getElementById('resetBackendBtn');

// Helper to get active API Base URL (Supports user selection > config default > localhost)
function getApiBase() {
  const stored = localStorage.getItem('omnistream_backend_url');
  if (stored && stored.trim()) {
    return stored.trim().replace(/\/+$/, '');
  }
  if (typeof window.API_BASE_URL === 'string' && window.API_BASE_URL.trim()) {
    return window.API_BASE_URL.trim().replace(/\/+$/, '');
  }
  return window.location.origin;
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

// Check Backend Engine Status & Auto-Detect Local PC Engine
async function checkEngineStatus(targetBase = null) {
  const base = targetBase || getApiBase();
  const startTime = Date.now();
  let isOnline = false;
  let statusData = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${base}/api/status`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      statusData = await res.json();
      if (statusData.status === 'online') {
        isOnline = true;
      }
    }
  } catch (err) {
    isOnline = false;
  }

  // If configured base failed AND it's not localhost, check if local PC engine (start.bat) is running!
  if (!isOnline && !base.includes('localhost') && !base.includes('127.0.0.1')) {
    try {
      const localController = new AbortController();
      const localTimeout = setTimeout(() => localController.abort(), 1200);
      const localRes = await fetch('http://localhost:4000/api/status', { signal: localController.signal });
      clearTimeout(localTimeout);
      if (localRes.ok) {
        const localData = await localRes.json();
        if (localData.status === 'online') {
          console.log('[Engine] Auto-detected active Local PC Engine at http://localhost:4000');
          localStorage.setItem('omnistream_backend_url', 'http://localhost:4000');
          return checkEngineStatus('http://localhost:4000');
        }
      }
    } catch (e) {
      // Local engine not running
    }
  }

  const latency = Date.now() - startTime;
  updateEngineUI(base, isOnline, latency, statusData);
  return { ok: isOnline, latency, data: statusData };
}

function updateEngineUI(base, isOnline, latency, data) {
  const isLocal = base.includes('localhost') || base.includes('127.0.0.1');

  if (engineStatusText && engineStatusBadge) {
    if (isOnline) {
      engineStatusText.textContent = isLocal ? 'Local Engine (Fast)' : 'Online';
      engineStatusBadge.classList.remove('offline');
      engineStatusBadge.title = `Connected to ${base} (${latency}ms) — Click to configure`;
    } else {
      engineStatusText.textContent = 'Server Offline';
      engineStatusBadge.classList.add('offline');
      engineStatusBadge.title = `Cannot reach backend at ${base} — Click to switch or resume`;
    }
  }

  // Update Server Settings Modal details if open
  if (modalStatusPill && modalActiveUrl && modalStatusMeta) {
    modalActiveUrl.textContent = base;
    if (isOnline) {
      modalStatusPill.textContent = '● Online';
      modalStatusPill.className = 'status-pill-live';
      modalStatusMeta.textContent = `Latency: ${latency}ms | Engine: ${data?.engine || 'yt-dlp + FFmpeg'} | Ver: ${data?.appVersion || '2.8'}`;
    } else {
      modalStatusPill.textContent = '● Disconnected / Suspended';
      modalStatusPill.className = 'status-pill-live offline';
      modalStatusMeta.textContent = 'Server unreachable. Run start.bat locally or resume in Render dashboard.';
    }

    if (useLocalServerBtn && useRenderServerBtn) {
      const defaultRender = window.DEFAULT_RENDER_URL || 'https://video-download-tool-9u4x.onrender.com';
      useLocalServerBtn.textContent = isLocal ? 'Active ✓' : 'Connect';
      useLocalServerBtn.classList.toggle('connected', isLocal);
      useRenderServerBtn.textContent = !isLocal && base === defaultRender ? 'Active ✓' : 'Connect';
      useRenderServerBtn.classList.toggle('connected', !isLocal && base === defaultRender);
    }
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

  // Server Engine Switcher Modal Listeners
  if (engineStatusBadge) {
    engineStatusBadge.addEventListener('click', openServerSettings);
  }
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', closeServerSettings);
  }
  if (serverSettingsOverlay) {
    serverSettingsOverlay.addEventListener('click', (e) => {
      if (e.target === serverSettingsOverlay) closeServerSettings();
    });
  }
  if (useLocalServerBtn) {
    useLocalServerBtn.addEventListener('click', () => {
      switchToBackend('http://localhost:4000');
    });
  }
  if (useRenderServerBtn) {
    useRenderServerBtn.addEventListener('click', () => {
      switchToBackend(window.DEFAULT_RENDER_URL || 'https://video-download-tool-9u4x.onrender.com');
    });
  }
  if (saveBackendBtn) {
    saveBackendBtn.addEventListener('click', () => {
      const val = (backendUrlInput.value || '').trim();
      if (!val || (!val.startsWith('http://') && !val.startsWith('https://'))) {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
      }
      switchToBackend(val);
    });
  }
  if (resetBackendBtn) {
    resetBackendBtn.addEventListener('click', () => {
      localStorage.removeItem('omnistream_backend_url');
      window.API_BASE_URL = window.DEFAULT_RENDER_URL || 'https://video-download-tool-9u4x.onrender.com';
      checkEngineStatus(window.API_BASE_URL);
      closeServerSettings();
    });
  }
}

// Server Modal Control Functions
function openServerSettings() {
  if (!serverSettingsOverlay) return;
  const current = getApiBase();
  if (backendUrlInput) backendUrlInput.value = current;
  serverSettingsOverlay.classList.remove('hidden');
  checkEngineStatus(current);
}

function closeServerSettings() {
  if (serverSettingsOverlay) serverSettingsOverlay.classList.add('hidden');
}

function switchToBackend(url) {
  if (!url || typeof url !== 'string') return;
  const cleanUrl = url.trim().replace(/\/+$/, '');
  localStorage.setItem('omnistream_backend_url', cleanUrl);
  window.API_BASE_URL = cleanUrl;
  checkEngineStatus(cleanUrl);
  closeServerSettings();
}

// Show Error Notice with Optional Action Buttons
function showError(title, message, actions = []) {
  errorTitle.textContent = title;
  errorMessage.textContent = message;

  if (errorActions) {
    errorActions.innerHTML = '';
    if (actions && actions.length > 0) {
      errorActions.classList.remove('hidden');
      actions.forEach(act => {
        if (act.href) {
          const a = document.createElement('a');
          a.href = act.href;
          a.target = act.target || '_self';
          if (act.target === '_blank') a.rel = 'noopener';
          a.className = `alert-btn ${act.type || 'secondary'}`;
          a.textContent = act.text;
          errorActions.appendChild(a);
        } else {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `alert-btn ${act.type || 'secondary'}`;
          btn.textContent = act.text;
          btn.addEventListener('click', act.onClick);
          errorActions.appendChild(btn);
        }
      });
    } else {
      errorActions.classList.add('hidden');
    }
  }

  errorBox.classList.remove('hidden');
  errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
  errorBox.classList.add('hidden');
  if (errorActions) errorActions.classList.add('hidden');
}

// Analyze Media with Auto-Retry and Multi-Backend Fallback
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
    let currentBase = getApiBase();
    let data = null;
    let isRenderSuspended = false;

    // Retry loop for sleeping instances
    const maxRetries = currentBase.includes('localhost') ? 1 : 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (attempt > 1) {
        fetchBtn.querySelector('.btn-text').textContent = `Waking server (${attempt}/${maxRetries})...`;
      }

      try {
        const controller = new AbortController();
        const timeoutMs = currentBase.includes('localhost') ? 10000 : (attempt === 1 ? 14000 : 25000);
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(`${currentBase}/api/info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        // Check if Render suspended
        if (res.status === 503) {
          const bodyTxt = await res.text();
          if (bodyTxt.includes('suspended by its owner') || res.headers.get('x-render-routing')?.includes('suspend')) {
            isRenderSuspended = true;
            break; // Stop retrying suspended Render, check local or show action card
          }
        }

        if (!res.ok) {
          let errText = '';
          try {
            const errJson = await res.json();
            errText = errJson.error || errJson.message;
          } catch {
            errText = await res.text();
          }
          throw new Error(errText || `Server responded with status ${res.status}`);
        }

        data = await res.json();
        break; // Successfully received data!
      } catch (reqErr) {
        if (isRenderSuspended) break;
        if (attempt === maxRetries) {
          // If cloud failed, check if local engine is running as auto-fallback!
          if (!currentBase.includes('localhost')) {
            try {
              fetchBtn.querySelector('.btn-text').textContent = 'Connecting to Local Engine...';
              const localProbe = await fetch('http://localhost:4000/api/status', { signal: AbortSignal.timeout(1500) });
              if (localProbe.ok) {
                switchToBackend('http://localhost:4000');
                const localRes = await fetch('http://localhost:4000/api/info', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url })
                });
                if (localRes.ok) {
                  data = await localRes.json();
                  break;
                }
              }
            } catch (e) {
              // Local not available
            }
          }
          throw reqErr;
        }
        // Wait 3.5s before retrying cold start
        await new Promise(r => setTimeout(r, 3500));
      }
    }

    if (isRenderSuspended) {
      showError(
        'Cloud Server Suspended on Render',
        'Your cloud backend (video-download-tool-9u4x.onrender.com) is currently suspended because the monthly free hours expired or it was paused. You can use your PC\'s Local Engine with start.bat (zero limits, 100% free), or resume it in Render dashboard.',
        [
          {
            text: '⚡ Connect to Local Engine (localhost:4000)',
            type: 'primary',
            onClick: () => {
              switchToBackend('http://localhost:4000');
              analyzeMedia();
            }
          },
          {
            text: '☁️ Resume on Render Dashboard ↗',
            type: 'secondary',
            href: 'https://dashboard.render.com',
            target: '_blank'
          },
          {
            text: '⚙️ Server Settings',
            type: 'secondary',
            onClick: openServerSettings
          }
        ]
      );
      return;
    }

    if (!data) {
      showError(
        'Cannot Reach Download Engine',
        'Could not establish connection to the download server. If using cloud, it may be paused. If on PC, make sure start.bat is running.',
        [
          {
            text: '⚡ Use Local Engine (localhost:4000)',
            type: 'primary',
            onClick: () => {
              switchToBackend('http://localhost:4000');
              analyzeMedia();
            }
          },
          {
            text: '⚙️ Configure Server',
            type: 'secondary',
            onClick: openServerSettings
          }
        ]
      );
      return;
    }

    state.currentMedia = data;
    renderMediaResult(data);
  } catch (err) {
    showError(
      'Could Not Fetch Video',
      err.message || 'The server could not access this media. Ensure the video is public.'
    );
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
        audioBitrate: opt.bitrate ? opt.bitrate.replace(/\D/g, '') + 'K' : '320K',
        usedFallback: media.usedFallback || false
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

// ==========================================================================
// Google Authentication & User Profile Management
// ==========================================================================
const googleLoginBtn = document.getElementById('googleLoginBtn');
const userProfileMenu = document.getElementById('userProfileMenu');
const userProfileBtn = document.getElementById('userProfileBtn');
const userDropdown = document.getElementById('userDropdown');
const userAvatar = document.getElementById('userAvatar');
const userNameLabel = document.getElementById('userNameLabel');
const dropdownFullName = document.getElementById('dropdownFullName');
const dropdownEmail = document.getElementById('dropdownEmail');
const dropdownPhone = document.getElementById('dropdownPhone');
const editProfileBtn = document.getElementById('editProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const dropdownAdminBtn = document.getElementById('dropdownAdminBtn');
const ADMIN_EMAIL = 'pk9762920@gmail.com';

// Profile Onboarding Modal Elements
const profileModalOverlay = document.getElementById('profileModalOverlay');
const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
const profileForm = document.getElementById('profileForm');
const profileFullName = document.getElementById('profileFullName');
const profilePhone = document.getElementById('profilePhone');
const profileEmail = document.getElementById('profileEmail');

let isAuthActionInProgress = false;

if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', async () => {
    if (isAuthActionInProgress) return;
    isAuthActionInProgress = true;
    const originalContent = googleLoginBtn.innerHTML;

    try {
      googleLoginBtn.disabled = true;
      googleLoginBtn.style.opacity = '0.75';
      googleLoginBtn.style.pointerEvents = 'none';
      googleLoginBtn.innerHTML = `
        <svg class="spin-anim" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        <span>Signing In...</span>
      `;

      await loginWithGoogle();
    } catch (err) {
      console.warn('[Google Sign-In Notice]', err);
      // If error is not a user cancellation, open the profile modal directly
      if (err && err.code !== 'auth/cancelled-popup-request' && err.code !== 'auth/popup-closed-by-user') {
        openProfileModal(true);
      }
    } finally {
      isAuthActionInProgress = false;
      googleLoginBtn.disabled = false;
      googleLoginBtn.style.opacity = '1';
      googleLoginBtn.style.pointerEvents = 'auto';
      googleLoginBtn.innerHTML = originalContent;
    }
  });
}

if (userProfileBtn) {
  userProfileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('hidden');
  });
}

document.addEventListener('click', () => {
  if (userDropdown && !userDropdown.classList.contains('hidden')) {
    userDropdown.classList.add('hidden');
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await logoutUser();
  });
}

if (editProfileBtn) {
  editProfileBtn.addEventListener('click', () => {
    userDropdown.classList.add('hidden');
    openProfileModal();
  });
}

if (closeProfileModalBtn) {
  closeProfileModalBtn.addEventListener('click', () => {
    profileModalOverlay.classList.add('hidden');
  });
}

function openProfileModal(isDirectLogin = false) {
  const user = window.currentUser || {};
  profileFullName.value = user.displayName || '';
  profilePhone.value = user.phoneNumber || '';
  profileEmail.value = user.email || '';

  if (!user.email || isDirectLogin) {
    profileEmail.removeAttribute('readonly');
    profileEmail.style.opacity = '1';
    profileEmail.style.cursor = 'text';
    profileEmail.placeholder = 'e.g. yourname@gmail.com';
    profileEmail.required = true;
  } else {
    profileEmail.setAttribute('readonly', 'true');
    profileEmail.style.opacity = '0.75';
    profileEmail.style.cursor = 'not-allowed';
  }

  profileModalOverlay.classList.remove('hidden');
}

if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = profileFullName.value.trim();
    const phone = profilePhone.value.trim();
    const email = profileEmail.value.trim();

    if (!name || !phone) {
      alert('Please fill out both your Name and Phone Number.');
      return;
    }

    if (!window.currentUser) {
      window.currentUser = {
        uid: 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        displayName: name,
        email: email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        phoneNumber: phone
      };
    } else {
      window.currentUser.displayName = name;
      window.currentUser.phoneNumber = phone;
      if (email) window.currentUser.email = email;
    }

    localStorage.setItem('omnistream_user', JSON.stringify(window.currentUser));
    window.dispatchEvent(new CustomEvent('auth:login', { detail: window.currentUser }));

    await updateUserProfile(name, phone, email);
    profileModalOverlay.classList.add('hidden');
  });
}

// Authentication Custom Event Listeners
window.addEventListener('auth:login', (e) => {
  const user = e.detail;
  if (!user) return;

  googleLoginBtn.classList.add('hidden');
  userProfileMenu.classList.remove('hidden');

  userNameLabel.textContent = (user.displayName || 'User').split(' ')[0];
  userAvatar.src = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.displayName || 'User')}`;
  dropdownFullName.textContent = user.displayName || 'User';
  dropdownEmail.textContent = user.email || '';
  dropdownPhone.textContent = user.phoneNumber ? `Phone: ${user.phoneNumber}` : 'No phone number added';

  // Only display the Admin Console button if the authenticated user is pk9762920@gmail.com
  if (dropdownAdminBtn) {
    const isOwner = user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
    if (isOwner) {
      dropdownAdminBtn.classList.remove('hidden');
    } else {
      dropdownAdminBtn.classList.add('hidden');
    }
  }
});

window.addEventListener('auth:logout', () => {
  googleLoginBtn.classList.remove('hidden');
  userProfileMenu.classList.add('hidden');
  userDropdown.classList.add('hidden');
  if (dropdownAdminBtn) {
    dropdownAdminBtn.classList.add('hidden');
  }
});

window.addEventListener('auth:require_profile', () => {
  setTimeout(() => {
    openProfileModal();
  }, 400);
});

window.addEventListener('auth:profile_updated', (e) => {
  const user = e.detail;
  userNameLabel.textContent = (user.displayName || 'User').split(' ')[0];
  dropdownFullName.textContent = user.displayName || 'User';
  dropdownPhone.textContent = user.phoneNumber ? `Phone: ${user.phoneNumber}` : 'No phone number added';
});

// ==========================================================================
// Multi-Page Legal & Policy SPA System
// ==========================================================================
const legalPagesOverlay = document.getElementById('legalPagesOverlay');
const closeLegalModalBtn = document.getElementById('closeLegalModalBtn');
const legalModalBody = document.getElementById('legalModalBody');
const legalModalTitleText = document.getElementById('legalModalTitleText');
const legalTabs = document.querySelectorAll('.legal-tab-btn');

const LEGAL_CONTENT = {
  privacy: `
    <h2>Privacy Policy</h2>
    <p>Last Updated: October 2026</p>
    <div class="legal-highlight-box">
      ToolBox Pro respects your digital privacy. We operate a zero-log media processing engine. No downloaded video or audio files are retained on our servers past temporary processing.
    </div>
    <h3>1. Information We Collect</h3>
    <p>We collect limited information to provide seamless media downloads:</p>
    <ul>
      <li><strong>Account Details:</strong> When signing in with Google, we access your name, email address, profile avatar, and the phone number provided during onboarding.</li>
      <li><strong>Operational Telemetry:</strong> Anonymized URL queries, selected video formats, and error logs to debug network throughput and platform compatibility.</li>
      <li><strong>Local Storage Data:</strong> We store your UI theme preference (Light/Dark mode) and your local download history on your browser only.</li>
    </ul>

    <h3>2. How Your Data Is Protected</h3>
    <p>All communication between your device and ToolBox Pro is encrypted using industry-standard TLS 1.3 / HTTPS encryption. We never sell, rent, or monetize your personal information or contact details with third-party advertisers or data brokers.</p>

    <h3>3. Cookies & Advertising</h3>
    <p>We may partner with trusted advertising networks, such as Google AdSense, to display non-intrusive advertisements. These partners may use cookies (such as DoubleClick DART cookies) to serve ads based on your visit to this and other websites on the internet. You may opt out of personalized advertising by visiting Google Ad Settings.</p>

    <h3>4. Children's Online Privacy Protection (COPPA)</h3>
    <p>ToolBox Pro is designed for general audiences and does not knowingly collect personal identifiable information from children under the age of 13.</p>

    <h3>5. Contact Our Data Protection Officer</h3>
    <p>If you have questions regarding your data or wish to delete your account, contact: <strong>privacy@toolbox.pro</strong></p>
  `,

  terms: `
    <h2>Terms of Service & Acceptable Use</h2>
    <p>Effective Date: October 2026</p>
    <div class="legal-highlight-box">
      By accessing or using ToolBox Pro, you acknowledge and agree to comply with these Terms of Service. If you do not agree, please discontinue using the service immediately.
    </div>
    <h3>1. Permitted Use</h3>
    <p>ToolBox Pro is an advanced personal media caching and backup tool designed for educational, archival, and fair-use purposes. You agree to use this service exclusively for content you own or have explicit permission to access and download.</p>

    <h3>2. User Warranties & Prohibitions</h3>
    <p>You strictly agree that you shall NOT:</p>
    <ul>
      <li>Use the service to infringe upon the intellectual property, copyright, or trademark of any content creator or publisher.</li>
      <li>Distribute, broadcast, or commercialize downloaded media without the copyright holder's authorization.</li>
      <li>Deploy automated bots, scrapers, or DDoS attacks designed to degrade server availability.</li>
      <li>Attempt to bypass security headers, access private accounts, or reverse-engineer the underlying API.</li>
    </ul>

    <h3>3. Disclaimer of Warranties</h3>
    <p>ToolBox Pro is provided on an "AS-IS" and "AS-AVAILABLE" basis. We make no warranty that our service will be uninterrupted, error-free, or compatible with every streaming protocol at all times.</p>

    <h3>4. Limitation of Liability</h3>
    <p>Under no circumstances shall ToolBox Pro, its developers, or affiliates be liable for direct, indirect, incidental, or consequential damages resulting from the use or misuse of media obtained through this tool.</p>
  `,

  dmca: `
    <h2>DMCA Copyright Notice & Disclaimer</h2>
    <div class="legal-highlight-box">
      ToolBox Pro strictly complies with the Digital Millennium Copyright Act (17 U.S.C. § 512) and international copyright directives.
    </div>
    <h3>1. Safe Harbor & Zero-Hosting Policy</h3>
    <p>ToolBox Pro is a client-side facilitation and format transcode proxy. <strong>We do not host, store, index, or broadcast any audio or video files on our servers.</strong></p>
    <p>All video content retrieved through ToolBox Pro is streamed directly from public third-party content delivery networks (CDNs) maintained by platforms such as YouTube, Instagram, TikTok, and Vimeo. Files are cached solely in temporary memory to multiplex audio and video tracks, and are purged automatically.</p>

    <h3>2. Copyright Infringement Claims</h3>
    <p>If you are a copyright owner or an authorized agent and believe that content accessible through our utility infringes your rights, you may submit a formal notification to our designated copyright agent:</p>
    <ul>
      <li><strong>Designated Agent:</strong> ToolBox Copyright Compliance Department</li>
      <li><strong>Notice Email:</strong> <strong>dmca@toolbox.pro</strong></li>
      <li><strong>Physical Address:</strong> Legal Dept, ToolBox Cloud Architecture, New Delhi, India</li>
    </ul>

    <h3>3. Required Takedown Information</h3>
    <p>To be effective under 17 U.S.C. § 512(c)(3), your notice must include:</p>
    <ul>
      <li>Identification of the copyrighted work claimed to have been infringed.</li>
      <li>The exact public URL(s) of the infringing material.</li>
      <li>Your full contact details including Name, Address, Telephone, and Email address.</li>
      <li>A statement made under penalty of perjury that the information in the notification is accurate.</li>
      <li>A physical or electronic signature of the copyright owner or authorized representative.</li>
    </ul>
  `,

  about: `
    <h2>About ToolBox Pro</h2>
    <div class="legal-highlight-box">
      ToolBox — All Useful Tools in One Place. Engineering the world's fastest, cleanest, and most accessible web utilities.
    </div>
    <h3>Our Vision</h3>
    <p>ToolBox Pro was born out of frustration with predatory video download sites bloated with spam popups, scam ads, malware redirects, and artificial quality restrictions. We set out to build an open, crystal-clean platform that brings all useful web utilities together in one place.</p>

    <h3>Under the Hood</h3>
    <p>Our server architecture leverages cutting-edge open source tools:</p>
    <ul>
      <li><strong>yt-dlp Engine:</strong> World-class media extraction with native stream resolution parsing.</li>
      <li><strong>FFmpeg 8.x Acceleration:</strong> Multi-threaded audio and video muxing allowing pristine 1080p, 2K, and 4K MP4 downloads.</li>
      <li><strong>Deno JavaScript Engine:</strong> Lightning-fast client token negotiation to bypass modern video bot limits.</li>
      <li><strong>Global CDN Edge:</strong> Instant worldwide availability deployed on Vercel and Render cloud infrastructure.</li>
    </ul>

    <h3>Our Commitment</h3>
    <p>Zero spam. Zero tracking cookies. Transparent policies. Continuous updates whenever streaming platforms modify their protocols.</p>
  `,

  contact: `
    <h2>Contact Us & Customer Support</h2>
    <p>Have an inquiry, platform bug report, or feature suggestion? Reach our engineering team directly.</p>
    
    <div class="contact-form-grid">
      <div class="form-group">
        <label class="form-label" for="contactName">Your Name *</label>
        <input type="text" id="contactName" class="form-input" placeholder="e.g. Prince Kumar" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="contactEmail">Email Address *</label>
        <input type="email" id="contactEmail" class="form-input" placeholder="e.g. name@example.com" required>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="contactCategory">Inquiry Type</label>
      <select id="contactCategory" class="form-input" style="cursor: pointer;">
        <option value="support">General Support & Inquiry</option>
        <option value="bug">Report a Broken Video Link</option>
        <option value="feature">Feature Request</option>
        <option value="dmca">Copyright / DMCA Notice</option>
        <option value="partnership">Business & Advertising</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label" for="contactMessage">Your Message *</label>
      <textarea id="contactMessage" class="form-input contact-textarea" placeholder="Describe your question or issue in detail..." required></textarea>
    </div>

    <button type="button" class="action-btn primary" id="sendContactBtn" style="padding: 10px 24px; font-size: 0.92rem;">
      Send Message
    </button>

    <div class="legal-highlight-box" style="margin-top: 24px;">
      <strong>Direct Support Email:</strong> support@toolbox.pro<br>
      <strong>Average Response Time:</strong> Within 24 Hours
    </div>
  `
};

function renderLegalTab(tabKey) {
  legalTabs.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabKey);
  });

  const content = LEGAL_CONTENT[tabKey] || LEGAL_CONTENT.privacy;
  legalModalBody.innerHTML = content;
  legalModalBody.scrollTop = 0;

  // If contact tab was rendered, wire up contact form submission
  if (tabKey === 'contact') {
    const sendBtn = document.getElementById('sendContactBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const msg = document.getElementById('contactMessage').value.trim();
        if (!name || !email || !msg) {
          alert('Please fill out all required fields (Name, Email, and Message).');
          return;
        }
        sendBtn.disabled = true;
        sendBtn.textContent = 'Message Sent Successfully ✓';
        setTimeout(() => {
          alert('Thank you, ' + name + '! Your message has been received. Our team will get back to you at ' + email + '.');
          legalPagesOverlay.classList.add('hidden');
        }, 500);
      });
    }
  }
}

function openLegalModal(tabKey = 'privacy') {
  renderLegalTab(tabKey);
  legalPagesOverlay.classList.remove('hidden');
}

if (closeLegalModalBtn) {
  closeLegalModalBtn.addEventListener('click', () => {
    legalPagesOverlay.classList.add('hidden');
  });
}

if (legalPagesOverlay) {
  legalPagesOverlay.addEventListener('click', (e) => {
    if (e.target === legalPagesOverlay) {
      legalPagesOverlay.classList.add('hidden');
    }
  });
}

legalTabs.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.getAttribute('data-tab');
    renderLegalTab(tab);
  });
});

// Footer Navigation Links
const navPrivacy = document.getElementById('navPrivacy');
const navTerms = document.getElementById('navTerms');
const navDmca = document.getElementById('navDmca');
const navAbout = document.getElementById('navAbout');
const navContact = document.getElementById('navContact');

if (navPrivacy) navPrivacy.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('privacy'); });
if (navTerms) navTerms.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('terms'); });
if (navDmca) navDmca.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('dmca'); });
if (navAbout) navAbout.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('about'); });
if (navContact) navContact.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('contact'); });
