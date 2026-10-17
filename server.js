const express = require('express');
const cors = require('cors');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Disposition', 'Content-Length']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
}));

// Temporary downloads directory
const TEMP_DIR = path.join(__dirname, 'temp_downloads');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Deno Setup for yt-dlp JavaScript challenge solver (Cross-Platform Windows + Linux/Render)
let denoExecutable = null;

try {
  execSync('deno --version', { stdio: 'ignore' });
  denoExecutable = 'deno';
} catch (e) {
  const winDeno = path.join(process.env.USERPROFILE || '', '.deno', 'bin', 'deno.exe');
  const linuxDeno = path.join(process.env.HOME || '/root', '.deno', 'bin', 'deno');

  if (fs.existsSync(winDeno)) {
    denoExecutable = winDeno;
    const winDir = path.dirname(winDeno);
    if (!process.env.PATH.includes(winDir)) process.env.PATH = `${winDir};${process.env.PATH}`;
  } else if (fs.existsSync(linuxDeno)) {
    denoExecutable = linuxDeno;
    const linuxDir = path.dirname(linuxDeno);
    if (!process.env.PATH.includes(linuxDir)) process.env.PATH = `${linuxDir}:${process.env.PATH}`;
  }
}

function getYtDlpBaseArgs() {
  const args = [
    '--no-warnings',
    '--no-playlist',
    '--no-check-certificates'
  ];
  if (denoExecutable) {
    args.push('--js-runtimes', `deno:${denoExecutable}`);
  }
  return args;
}

const PRIMARY_EXTRACTOR_ARGS = ['--extractor-args', 'youtube:player_client=web_embedded,android_vr,web,mweb,ios'];
const FALLBACK_EXTRACTOR_ARGS = ['--extractor-args', 'youtube:player_client=android,mweb'];

// In-memory job tracker for real-time progress
const jobs = new Map();

// Helper: Sanitize filename for Windows & all OS
function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').substring(0, 150);
}

// Helper: Format duration (seconds to HH:MM:SS)
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return 'Unknown';
  const sec = Math.floor(seconds);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
}

// Helper: Format bytes to human readable string
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return 'Variable';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Periodic cleanup of files older than 20 minutes
setInterval(() => {
  const now = Date.now();
  try {
    const files = fs.readdirSync(TEMP_DIR);
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > 20 * 60 * 1000) {
        fs.unlinkSync(filePath);
        console.log(`[Auto-Clean] Cleaned expired temp file: ${file}`);
      }
    }
  } catch (err) {
    console.error('[Auto-Clean Error]', err.message);
  }
}, 5 * 60 * 1000);

// API 1: System Info & Diagnostics
app.get('/api/status', (req, res) => {
  let ytdlpVersion = 'Installed';
  let ffmpegVersion = 'Installed';

  try {
    ytdlpVersion = execSync('yt-dlp --version', { encoding: 'utf8' }).trim();
  } catch (e) {
    ytdlpVersion = 'Not detected';
  }

  try {
    const ffOut = execSync('ffmpeg -version', { encoding: 'utf8' });
    ffmpegVersion = ffOut.split('\n')[0].replace('ffmpeg version ', '').split(' ')[0];
  } catch (e) {
    ffmpegVersion = 'Not detected';
  }

  res.json({
    status: 'online',
    engine: 'yt-dlp',
    ytdlpVersion,
    ffmpegVersion,
    supportedPlatforms: [
      'YouTube (Videos, Shorts, Playlists)',
      'Instagram (Reels, Stories, Feed Posts)',
      'TikTok (Watermark-Free, Audio)',
      'Facebook (Public Videos & Reels)',
      'Twitter / X (Media Clips)',
      'Reddit (Videos with Audio)',
      'Pinterest (Video Pins)',
      'Vimeo, Dailymotion, SoundCloud & 1000+ more'
    ]
  });
});

// API 2: Analyze URL & Fetch Video Metadata + Quality Options
function runProbe(targetUrl, useFallback = false) {
  return new Promise((resolve) => {
    const extractorArgs = useFallback ? FALLBACK_EXTRACTOR_ARGS : PRIMARY_EXTRACTOR_ARGS;
    const args = [
      '--dump-single-json',
      '--flat-playlist',
      ...getYtDlpBaseArgs(),
      ...extractorArgs,
      targetUrl
    ];

    const ytdlp = spawn('yt-dlp', args, { windowsHide: true });
    let stdoutData = '';
    let stderrData = '';

    ytdlp.stdout.on('data', (d) => { stdoutData += d.toString(); });
    ytdlp.stderr.on('data', (d) => { stderrData += d.toString(); });

    ytdlp.on('close', (code) => {
      resolve({ code, stdoutData, stderrData });
    });
  });
}

app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
    return res.status(400).json({ error: 'Please provide a valid media URL starting with http:// or https://' });
  }

  const cleanUrl = url.trim();
  console.log(`[Analyze] Probing URL: ${cleanUrl}`);

  let probeResult = await runProbe(cleanUrl, false);

  if (probeResult.code !== 0 || !probeResult.stdoutData.trim()) {
    console.warn(`[Analyze] Primary probe failed (code ${probeResult.code}). Retrying with fallback client...`);
    probeResult = await runProbe(cleanUrl, true);
  }

  const { code, stdoutData, stderrData } = probeResult;

  if (code !== 0 || !stdoutData.trim()) {
    console.error(`[Analyze Error] code ${code}: ${stderrData}`);
    let userFriendlyError = 'Could not retrieve video details. Please verify the URL is public and accessible.';
    if (stderrData.includes('Private video')) {
      userFriendlyError = 'This video is private or restricted by the creator.';
    } else if (stderrData.includes('Sign in to confirm')) {
      userFriendlyError = 'This video requires login or is age-restricted.';
    } else if (stderrData.includes('404') || stderrData.includes('Not Found')) {
      userFriendlyError = 'Media not found. The post or video might have been deleted.';
    }
    return res.status(422).json({ error: userFriendlyError, raw: stderrData.slice(0, 300) });
  }

  try {
    const data = JSON.parse(stdoutData);

      // Detect Platform
      let platform = 'Generic';
      const extractor = (data.extractor || data.extractor_key || '').toLowerCase();
      const u = cleanUrl.toLowerCase();
      if (extractor.includes('youtube') || u.includes('youtu.be') || u.includes('youtube.com')) {
        platform = 'YouTube';
      } else if (extractor.includes('instagram') || u.includes('instagram.com')) {
        platform = 'Instagram';
      } else if (extractor.includes('tiktok') || u.includes('tiktok.com')) {
        platform = 'TikTok';
      } else if (extractor.includes('facebook') || u.includes('fb.watch') || u.includes('facebook.com')) {
        platform = 'Facebook';
      } else if (extractor.includes('twitter') || u.includes('twitter.com') || u.includes('x.com')) {
        platform = 'Twitter / X';
      } else if (extractor.includes('reddit') || u.includes('reddit.com')) {
        platform = 'Reddit';
      } else if (extractor.includes('pinterest') || u.includes('pin.it')) {
        platform = 'Pinterest';
      } else if (extractor.includes('vimeo')) {
        platform = 'Vimeo';
      }

      // Collect available video formats
      const rawFormats = data.formats || [];
      const heights = new Set();
      const videoOptions = [];

      // Check max available resolution
      rawFormats.forEach(f => {
        if (f.height && f.height >= 144) {
          heights.add(f.height);
        }
      });

      // Standard target quality options
      const standardQualities = [
        { label: '4K Ultra HD', height: 2160, badge: '4K' },
        { label: '2K Quad HD', height: 1440, badge: '2K' },
        { label: '1080p Full HD', height: 1080, badge: 'FHD' },
        { label: '720p HD', height: 720, badge: 'HD' },
        { label: '480p SD', height: 480, badge: 'SD' },
        { label: '360p Standard', height: 360, badge: '360p' }
      ];

      // Filter qualities supported by the video
      standardQualities.forEach(q => {
        const matches = Array.from(heights).filter(h => h >= q.height - 40 && h <= q.height + 40);
        if (matches.length > 0 || (q.height <= 720 && heights.size === 0) || (heights.size > 0 && Math.max(...heights) >= q.height)) {
          videoOptions.push({
            id: `video_${q.height}`,
            type: 'video',
            label: q.label,
            resolution: `${q.height}p`,
            height: q.height,
            badge: q.badge,
            ext: 'mp4',
            formatSpec: `bestvideo[height<=${q.height}]+bestaudio/best[height<=${q.height}]/best`
          });
        }
      });

      // If no height detected (e.g., direct mp4 or social reels)
      if (videoOptions.length === 0) {
        videoOptions.push({
          id: 'video_best',
          type: 'video',
          label: 'Original Best Quality',
          resolution: 'Original',
          height: 1080,
          badge: 'BEST',
          ext: 'mp4',
          formatSpec: 'bestvideo+bestaudio/best'
        });
      }

      // Audio Options
      const audioOptions = [
        {
          id: 'audio_mp3_320',
          type: 'audio',
          label: 'MP3 High Quality',
          bitrate: '320 kbps',
          badge: 'HQ Audio',
          ext: 'mp3',
          formatSpec: 'bestaudio/best'
        },
        {
          id: 'audio_mp3_192',
          type: 'audio',
          label: 'MP3 Standard',
          bitrate: '192 kbps',
          badge: 'MP3',
          ext: 'mp3',
          formatSpec: 'bestaudio/best'
        },
        {
          id: 'audio_m4a',
          type: 'audio',
          label: 'M4A / AAC Clean Audio',
          bitrate: 'Best',
          badge: 'M4A',
          ext: 'm4a',
          formatSpec: 'bestaudio[ext=m4a]/bestaudio/best'
        }
      ];

      return res.json({
        title: data.title || 'Untitled Media',
        thumbnail: data.thumbnail || (data.thumbnails && data.thumbnails.length > 0 ? data.thumbnails[data.thumbnails.length - 1].url : ''),
        duration: formatDuration(data.duration),
        durationRaw: data.duration || 0,
        uploader: data.uploader || data.channel || data.creator || 'Original Creator',
        uploaderUrl: data.uploader_url || data.channel_url || '',
        views: data.view_count ? data.view_count.toLocaleString() : null,
        platform,
        webpageUrl: data.webpage_url || cleanUrl,
        options: {
          video: videoOptions,
          audio: audioOptions
        }
      });
    } catch (parseErr) {
      console.error('[Parse Error]', parseErr);
      return res.status(500).json({ error: 'Failed to process media information.' });
    }
});

// API 3: Start Download Task (Returns Job ID for live progress monitoring)
app.post('/api/start-download', (req, res) => {
  const { url, type, formatSpec, ext, title, audioBitrate } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing media URL.' });
  }

  const jobId = crypto.randomUUID();
  const safeTitle = sanitizeFilename(title || 'downloaded_media');
  const targetExt = ext || (type === 'audio' ? 'mp3' : 'mp4');
  const finalFilename = `${safeTitle}_${jobId.slice(0, 8)}.${targetExt}`;
  const outputPath = path.join(TEMP_DIR, finalFilename);

  // Initialize job object
  const job = {
    id: jobId,
    title: safeTitle,
    type: type || 'video',
    status: 'starting',
    percent: 0,
    speed: '0 KiB/s',
    eta: 'Starting...',
    filesize: '',
    filename: finalFilename,
    filePath: outputPath,
    error: null,
    createdAt: Date.now()
  };

  jobs.set(jobId, job);

  // Prepare arguments for yt-dlp
  const args = [
    '--no-playlist',
    '--newline',
    '--progress',
    ...getYtDlpBaseArgs(),
    ...PRIMARY_EXTRACTOR_ARGS
  ];

  if (type === 'audio') {
    // Audio extraction with ffmpeg
    const audioFmt = formatSpec ? `${formatSpec}/bestaudio/best` : 'bestaudio/best';
    args.push(
      '-x',
      '--audio-format', targetExt,
      '--audio-quality', audioBitrate || '320K',
      '-f', audioFmt,
      '-o', outputPath.replace(new RegExp(`\\.${targetExt}$`), '.%(ext)s'),
      url
    );
  } else {
    // Video download with ffmpeg muxing
    const videoFmt = formatSpec ? `${formatSpec}/bestvideo+bestaudio/best` : 'bestvideo+bestaudio/best';
    args.push(
      '-f', videoFmt,
      '--merge-output-format', targetExt,
      '-o', outputPath,
      url
    );
  }

  console.log(`[Job ${jobId}] Starting yt-dlp with output: ${finalFilename}`);
  const ytdlp = spawn('yt-dlp', args, { windowsHide: true });

  job.process = ytdlp;
  let jobStderr = '';

  ytdlp.stdout.on('data', (data) => {
    const text = data.toString();
    job.status = 'downloading';

    // Parse yt-dlp progress line: "[download]  45.2% of  18.42MiB at 4.21MiB/s ETA 00:03"
    const percentMatch = text.match(/\[download\]\s+([\d.]+)%/);
    if (percentMatch) {
      job.percent = parseFloat(percentMatch[1]);
    }

    const sizeMatch = text.match(/of\s+~?([\d.]+\s*[KMGT]?i?B)/i);
    if (sizeMatch) {
      job.filesize = sizeMatch[1];
    }

    const speedMatch = text.match(/at\s+([\d.]+\s*[KMGT]?i?B\/s)/i);
    if (speedMatch) {
      job.speed = speedMatch[1];
    }

    const etaMatch = text.match(/ETA\s+([\d:]+)/i);
    if (etaMatch) {
      job.eta = etaMatch[1];
    }

    if (text.includes('[ExtractAudio]') || text.includes('[Merger]') || text.includes('Merging formats')) {
      job.status = 'processing';
      job.speed = 'Muxing / Processing';
      job.eta = 'Almost ready';
    }
  });

  ytdlp.stderr.on('data', (data) => {
    jobStderr += data.toString();
    console.error(`[Job ${jobId} stderr]:`, data.toString().slice(0, 150));
  });

  ytdlp.on('close', (code) => {
    if (code === 0) {
      // Find actual created file (in case extension was resolved dynamically)
      if (fs.existsSync(outputPath)) {
        job.status = 'completed';
        job.percent = 100;
        job.eta = 'Ready';
        console.log(`[Job ${jobId}] Completed successfully: ${outputPath}`);
      } else {
        // Look for similar file in temp dir
        const baseNameWithoutExt = path.basename(outputPath, path.extname(outputPath));
        const matched = fs.readdirSync(TEMP_DIR).find(f => f.startsWith(baseNameWithoutExt));
        if (matched) {
          job.filePath = path.join(TEMP_DIR, matched);
          job.filename = matched;
          job.status = 'completed';
          job.percent = 100;
          job.eta = 'Ready';
          console.log(`[Job ${jobId}] Found dynamic output file: ${matched}`);
        } else {
          job.status = 'error';
          job.error = 'Download process finished but the file was not found.';
        }
      }
    } else {
      job.status = 'error';
      let friendlyError = 'Download failed. The format might be unavailable or restricted.';
      if (jobStderr.includes('Private video')) {
        friendlyError = 'This video is private or restricted.';
      } else if (jobStderr.includes('Sign in to confirm you’re not a bot') || jobStderr.includes('Sign in')) {
        friendlyError = 'Platform requires login or bot verification for this video.';
      } else if (jobStderr.includes('404') || jobStderr.includes('Not Found')) {
        friendlyError = 'Media not found or was removed.';
      }
      job.error = friendlyError;
    }
  });

  res.json({
    jobId,
    filename: finalFilename
  });
});

// API 4: Check Job Progress
app.get('/api/job-status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found or expired.' });
  }

  res.json({
    id: job.id,
    status: job.status,
    percent: job.percent,
    speed: job.speed,
    eta: job.eta,
    filesize: job.filesize,
    filename: job.filename,
    error: job.error
  });
});

// API 5: Serve Downloaded File to Browser
app.get('/api/file/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job || !job.filePath || !fs.existsSync(job.filePath)) {
    return res.status(404).send('Download file not found or has already expired.');
  }

  const stat = fs.statSync(job.filePath);
  const ext = path.extname(job.filePath).toLowerCase();
  const contentType = ext === '.mp3' ? 'audio/mpeg' : ext === '.m4a' ? 'audio/mp4' : 'video/mp4';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="${encodeURIComponent(job.filename)}"`,
  });

  const readStream = fs.createReadStream(job.filePath);
  readStream.pipe(res);
});

// API 6: Save User Profile (Name, Phone Number, Email)
const USERS_FILE = path.join(TEMP_DIR, 'users.json');

app.post('/api/save-user', (req, res) => {
  const { uid, displayName, email, phoneNumber, photoURL } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'Missing UID' });
  }

  let users = {};
  if (fs.existsSync(USERS_FILE)) {
    try {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (e) {
      users = {};
    }
  }

  users[uid] = {
    uid,
    displayName: displayName || 'User',
    email: email || '',
    phoneNumber: phoneNumber || '',
    photoURL: photoURL || '',
    updatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log(`[User Saved] UID: ${uid}, Name: ${displayName}, Phone: ${phoneNumber}`);
    return res.json({ success: true, user: users[uid] });
  } catch (err) {
    console.error('[User Save Error]', err);
    return res.status(500).json({ error: 'Failed to save user data' });
  }
});

app.get('/api/user/:uid', (req, res) => {
  const { uid } = req.params;
  if (!fs.existsSync(USERS_FILE)) {
    return res.status(404).json({ error: 'No users found' });
  }
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    if (users[uid]) {
      return res.json(users[uid]);
    }
  } catch (e) {}
  return res.status(404).json({ error: 'User not found' });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 OmniStream Pro Server Running on: http://0.0.0.0:${PORT}`);
  console.log(`⚡ Engine: yt-dlp + FFmpeg fully activated`);
  console.log(`📁 Temp Folder: ${TEMP_DIR}`);
  console.log(`=======================================================`);
});
