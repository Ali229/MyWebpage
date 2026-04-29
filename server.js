import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import tls from "node:tls";

const app = express();
const port = process.env.PORT || 3001;
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const allowedDownloadEmail = process.env.DOWNLOAD_ADMIN_EMAIL?.toLowerCase();
const firebaseCertUrl = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
let cachedFirebaseCerts = null;
let firebaseCertsExpiresAt = 0;

const RADARR_URL = process.env.RADARR_URL;
const RADARR_API_KEY = process.env.RADARR_API_KEY;
const SONARR_URL = process.env.SONARR_URL;
const SONARR_API_KEY = process.env.SONARR_API_KEY;
const PROWLARR_URL = process.env.PROWLARR_URL;
const PROWLARR_API_KEY = process.env.PROWLARR_API_KEY;
const QBITTORRENT_URL = process.env.QBITTORRENT_URL;
const PLEX_URL = process.env.PLEX_URL || "http://host.docker.internal:32400";
const GLUETUN_URL = process.env.GLUETUN_URL || "http://gluetun:9999";
const HOME_ASSISTANT_URL = process.env.HOME_ASSISTANT_URL;
const WEBSITE_URL = process.env.WEBSITE_URL;

const RADARR_ROOT_FOLDER = "/data/media/movies";
const SONARR_ROOT_FOLDER = "/data/media/tv";

const MOVIE_QUALITY_PROFILES = {
  "720p": 3,
  "1080p": 4,
  "4k": 5
};

const MOVIE_MONITOR_TYPES = {
  "movieOnly": "movieOnly",
  "movieAndCollection": "movieAndCollection",
  "movieAndCollections": "movieAndCollection",
  "none": "none"
};

const TV_QUALITY_PROFILES = {
  "720p": 3,
  "1080p": 4,
  "4k": 5
};

const TV_MONITOR_TYPES = {
  "all": "all",
  "future": "future",
  "missing": "missing",
  "existing": "existing",
  "recent": "recent",
  "pilot": "pilot",
  "firstSeason": "firstSeason",
  "lastSeason": "lastSeason",
  "monitorSpecials": "monitorSpecials",
  "unmonitorSpecials": "unmonitorSpecials",
  "none": "none"
};

app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://alinaeem.com",
    "https://www.alinaeem.com"
  ]
}));

function isLocalRequest(req) {
  const remoteAddress = req.socket.remoteAddress || "";
  const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const candidate = (forwardedFor || remoteAddress).replace(/^::ffff:/, "");

  return candidate === "127.0.0.1" ||
    candidate === "::1" ||
    candidate.startsWith("192.168.1.");
}

function requireLocalDashboard(req, res, next) {
  if (isLocalRequest(req)) {
    next();
    return;
  }

  res.status(404).send("Not found");
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function decodeJwtPart(value) {
  return JSON.parse(base64UrlDecode(value).toString("utf8"));
}

async function getFirebaseCerts() {
  if (cachedFirebaseCerts && Date.now() < firebaseCertsExpiresAt) {
    return cachedFirebaseCerts;
  }

  const response = await fetch(firebaseCertUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch Firebase public certs: ${response.status}`);
  }

  const cacheControl = response.headers.get("cache-control") || "";
  const maxAgeMatch = /max-age=(\d+)/.exec(cacheControl);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedFirebaseCerts = await response.json();
  firebaseCertsExpiresAt = Date.now() + Math.max(60, maxAgeSeconds - 60) * 1000;
  return cachedFirebaseCerts;
}

async function verifyFirebaseIdToken(idToken) {
  if (!firebaseProjectId) {
    throw new Error("FIREBASE_PROJECT_ID is not configured on the server.");
  }
  if (!allowedDownloadEmail) {
    throw new Error("DOWNLOAD_ADMIN_EMAIL is not configured on the server.");
  }

  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid auth token.");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJwtPart(encodedHeader);
  const payload = decodeJwtPart(encodedPayload);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Invalid auth token header.");
  }

  const certs = await getFirebaseCerts();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error("Unknown auth token key.");
  }

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const signature = base64UrlDecode(encodedSignature);
  if (!verifier.verify(cert, signature)) {
    throw new Error("Invalid auth token signature.");
  }

  const now = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${firebaseProjectId}`;

  if (payload.aud !== firebaseProjectId || payload.iss !== expectedIssuer || payload.exp <= now || payload.iat > now) {
    throw new Error("Invalid auth token claims.");
  }

  return payload;
}

async function requireDownloadAdmin(req, res, next) {
  try {
    const authHeader = req.get("authorization") || "";
    const match = /^Bearer\s+(.+)$/i.exec(authHeader);
    if (!match) {
      return res.status(401).json({
        ok: false,
        error: "Missing auth token"
      });
    }

    const payload = await verifyFirebaseIdToken(match[1]);
    const email = String(payload.email || "").toLowerCase();
    if (email !== allowedDownloadEmail || payload.email_verified !== true) {
      return res.status(403).json({
        ok: false,
        error: "This account is not allowed to send downloads"
      });
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      ok: false,
      error: error.message
    });
  }
}

async function arrGet(baseUrl, apiKey, path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "X-Api-Key": apiKey
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }

  return response.json();
}

async function arrPost(baseUrl, apiKey, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : {};
}

function resolveErrorMessage(error) {
  if (error?.name === "AbortError") {
    return "Timed out";
  }

  return error?.message || "Unknown error";
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const startedAt = Date.now();
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return {
      response,
      responseTimeMs: Date.now() - startedAt
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkHttpService(service) {
  const startedAt = Date.now();

  if (!service.url) {
    return {
      id: service.id,
      name: service.name,
      ok: false,
      status: "missing-config",
      details: "URL is not configured",
      responseTimeMs: 0
    };
  }

  try {
    const headers = service.apiKey ? {"X-Api-Key": service.apiKey} : undefined;
    const {response, responseTimeMs} = await fetchWithTimeout(`${service.url}${service.path}`, {headers});
    const text = await response.text();
    let payload = text;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }

    const ok = response.ok || (service.allowProtectedStatusAsOnline && [401, 403].includes(response.status));

    return {
      id: service.id,
      name: service.name,
      ok,
      status: ok ? "online" : `http-${response.status}`,
      details: ok ? (service.describe?.(payload, response) || "Online") : response.statusText,
      responseTimeMs
    };
  } catch (error) {
    return {
      id: service.id,
      name: service.name,
      ok: false,
      status: "offline",
      details: resolveErrorMessage(error),
      responseTimeMs: Date.now() - startedAt
    };
  }
}

async function checkTlsCertificateService(service) {
  const startedAt = Date.now();

  if (!service.url) {
    return {
      id: service.id,
      name: service.name,
      ok: false,
      status: "missing-config",
      details: "URL is not configured",
      responseTimeMs: 0
    };
  }

  try {
    const hostname = new URL(service.url).hostname;
    return await new Promise((resolve) => {
      const socket = tls.connect({
        host: hostname,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false,
        timeout: 5000
      }, () => {
        const certificate = socket.getPeerCertificate();
        socket.end();

        const validTo = certificate?.valid_to ? new Date(certificate.valid_to) : null;
        const daysRemaining = validTo ? Math.floor((validTo.getTime() - Date.now()) / 86400000) : 0;
        const ok = Boolean(validTo) && daysRemaining >= 14;

        resolve({
          id: service.id,
          name: service.name,
          ok,
          status: ok ? "online" : "warning",
          details: validTo ? `Expires in ${daysRemaining} days` : "Certificate unavailable",
          responseTimeMs: Date.now() - startedAt
        });
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve({
          id: service.id,
          name: service.name,
          ok: false,
          status: "offline",
          details: "Timed out",
          responseTimeMs: Date.now() - startedAt
        });
      });

      socket.on("error", error => {
        resolve({
          id: service.id,
          name: service.name,
          ok: false,
          status: "offline",
          details: resolveErrorMessage(error),
          responseTimeMs: Date.now() - startedAt
        });
      });
    });
  } catch (error) {
    return {
      id: service.id,
      name: service.name,
      ok: false,
      status: "offline",
      details: resolveErrorMessage(error),
      responseTimeMs: Date.now() - startedAt
    };
  }
}

function getHealthChecks() {
  return [
    {
      id: "reqarr",
      name: "Reqarr",
      url: `http://127.0.0.1:${port}`,
      path: "/health",
      describe: () => "API server responding"
    },
    {
      id: "radarr",
      name: "Radarr",
      url: RADARR_URL,
      apiKey: RADARR_API_KEY,
      path: "/api/v3/system/status",
      describe: data => data?.version ? `v${data.version}` : "Online"
    },
    {
      id: "sonarr",
      name: "Sonarr",
      url: SONARR_URL,
      apiKey: SONARR_API_KEY,
      path: "/api/v3/system/status",
      describe: data => data?.version ? `v${data.version}` : "Online"
    },
    {
      id: "prowlarr",
      name: "Prowlarr",
      url: PROWLARR_URL,
      apiKey: PROWLARR_API_KEY,
      path: "/api/v1/system/status",
      describe: data => data?.version ? `v${data.version}` : "Online"
    },
    {
      id: "qbittorrent",
      name: "qBittorrent",
      url: QBITTORRENT_URL,
      path: "/api/v2/app/version",
      allowProtectedStatusAsOnline: true,
      describe: (data, response) => response?.status === 403 ? "Running" : typeof data === "string" ? data : "Running"
    },
    {
      id: "gluetun",
      name: "Gluetun",
      url: GLUETUN_URL,
      path: "/health",
      describe: () => "VPN health endpoint responding"
    },
    {
      id: "plex",
      name: "Plex",
      url: PLEX_URL,
      path: "/identity",
      describe: () => "Plex identity responding"
    },
    {
      id: "home-assistant",
      name: "Home Assistant",
      url: HOME_ASSISTANT_URL,
      path: "/",
      describe: () => "Running"
    },
    {
      id: "website",
      name: "Website",
      url: WEBSITE_URL,
      path: "/",
      describe: () => "Running"
    },
    {
      id: "ssl-certificate",
      name: "SSL Certificate",
      kind: "tls-certificate",
      url: WEBSITE_URL,
      describe: () => "Certificate valid"
    }
  ];
}

function checkHealthService(service) {
  if (service.kind === "tls-certificate") {
    return checkTlsCertificateService(service);
  }

  return checkHttpService(service);
}

async function getStackStatus() {
  const checks = getHealthChecks();

  const services = await Promise.all(checks.map(checkHealthService));
  return {
    ok: services.every(service => service.ok),
    checkedAt: new Date().toISOString(),
    services
  };
}

function renderDashboardPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Health Check</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #eef3f8;
      color: #172f46;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(63, 114, 155, 0.22), transparent 34rem),
        linear-gradient(145deg, #f9fbfd, #e8eff6);
    }
    main {
      width: min(1120px, calc(100% - 2rem));
      margin: 0 auto;
      padding: 3rem 0;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1.4rem;
    }
    h1 {
      margin: 0;
      font-size: clamp(2rem, 5vw, 4rem);
      line-height: 1;
      letter-spacing: 0;
    }
    .subtitle {
      margin: 0.55rem 0 0;
      color: #5f6f81;
      font-size: 1rem;
    }
    .summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.85rem;
      min-width: 230px;
      padding: 0.8rem 1rem;
      border: 1px solid #d6e2ee;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.82);
      box-shadow: 0 16px 34px rgba(16, 36, 61, 0.1);
    }
    .summary strong {
      display: block;
      font-size: 1.35rem;
    }
    .summary span {
      color: #5f6f81;
      font-size: 0.84rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1rem;
    }
    .card {
      min-height: 160px;
      padding: 1rem;
      border: 1px solid #d6e2ee;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.86);
      box-shadow: 0 18px 40px rgba(16, 36, 61, 0.1);
    }
    .card__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.8rem;
      margin-bottom: 1.15rem;
    }
    .name {
      margin: 0;
      font-size: 1.12rem;
      font-weight: 800;
    }
    .light {
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      background: #aebdcc;
      box-shadow: 0 0 0 5px rgba(174, 189, 204, 0.18), 0 0 20px rgba(174, 189, 204, 0.55);
      flex: 0 0 auto;
    }
    .card.online .light {
      background: #1fc77a;
      box-shadow: 0 0 0 5px rgba(31, 199, 122, 0.17), 0 0 28px rgba(31, 199, 122, 0.86);
    }
    .card.offline .light {
      background: #f04452;
      box-shadow: 0 0 0 5px rgba(240, 68, 82, 0.16), 0 0 28px rgba(240, 68, 82, 0.78);
    }
    .card.checking .light {
      background: #5f7fa0;
      box-shadow: 0 0 0 5px rgba(95, 127, 160, 0.16), 0 0 28px rgba(95, 127, 160, 0.72);
      animation: pulse 1.3s ease-in-out infinite;
    }
    .status {
      display: inline-flex;
      align-items: center;
      min-height: 1.8rem;
      padding: 0.25rem 0.55rem;
      border-radius: 999px;
      background: #edf4fa;
      color: #3f5369;
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .detail {
      min-height: 2.6rem;
      margin: 0.75rem 0 1rem;
      color: #35485d;
      line-height: 1.35;
    }
    .meta {
      color: #6a7b8c;
      font-size: 0.88rem;
    }
    .refresh-button {
      width: 2.75rem;
      height: 2.75rem;
      border: 1px solid #c9d8e6;
      border-radius: 8px;
      background: #ffffff;
      color: #1d3348;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }
    .refresh-glyph {
      display: inline-block;
      font-size: 1.5rem !important;
      line-height: 1;
      transform: translateY(-1px);
    }
    .refresh-button:hover,
    .refresh-button:focus-visible {
      border-color: #8fb2d0;
      box-shadow: 0 0 0 3px rgba(99, 150, 191, 0.22);
      outline: none;
    }
    .refresh-button:disabled {
      cursor: wait;
      opacity: 0.72;
    }
    .refresh-button:disabled .refresh-glyph {
      animation: spin 0.9s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      50% { opacity: 0.45; transform: scale(0.86); }
    }
    @media (max-width: 640px) {
      main { padding-top: 2rem; }
      header { display: block; }
      .summary { margin-top: 1rem; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Health Check</h1>
        <p class="subtitle">Media services, home services, and public website health.</p>
      </div>
      <div class="summary">
        <div>
          <strong id="summary-count">Checking</strong>
          <span id="summary-time">Starting up</span>
        </div>
        <button type="button" id="refresh" class="refresh-button" title="Refresh status" aria-label="Refresh status">
          <span class="refresh-glyph" aria-hidden="true">&#8635;</span>
        </button>
      </div>
    </header>
    <section id="grid" class="grid" aria-live="polite"></section>
  </main>
  <script>
    const grid = document.getElementById("grid");
    const summaryCount = document.getElementById("summary-count");
    const summaryTime = document.getElementById("summary-time");
    const refreshButton = document.getElementById("refresh");
    let eventSource = null;
    let services = [];

    function escapeHtml(value) {
      return String(value || "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character]));
    }

    function render() {
      const finished = services.filter(service => service.status !== "checking").length;
      const onlineCount = services.filter(service => service.ok).length;
      summaryCount.textContent = onlineCount + "/" + services.length + " online";
      grid.innerHTML = services.map(service => {
        const stateClass = service.status === "checking" ? "checking" : service.ok ? "online" : "offline";
        return '<article class="card ' + stateClass + '">' +
          '<div class="card__top"><h2 class="name">' + escapeHtml(service.name) + '</h2><span class="light"></span></div>' +
          '<span class="status">' + escapeHtml(service.status) + '</span>' +
          '<p class="detail">' + escapeHtml(service.details) + '</p>' +
          '<div class="meta">' + escapeHtml(service.responseTimeMs) + ' ms</div>' +
        '</article>';
      }).join("");
    }

    function loadStatus() {
      if (eventSource) {
        eventSource.close();
      }

      refreshButton.disabled = true;
      summaryTime.textContent = "Checking now";
      eventSource = new EventSource("/status/events");

      eventSource.addEventListener("start", event => {
        const data = JSON.parse(event.data);
        services = data.services.map(service => ({
          ...service,
          ok: false,
          status: "checking",
          details: "Checking...",
          responseTimeMs: ""
        }));
        render();
      });

      eventSource.addEventListener("service", event => {
        const service = JSON.parse(event.data);
        services = services.map(item => item.id === service.id ? service : item);
        render();
      });

      eventSource.addEventListener("done", event => {
        const data = JSON.parse(event.data);
        summaryTime.textContent = data.checkedAt ? new Date(data.checkedAt).toLocaleString() : "Unknown check time";
        refreshButton.disabled = false;
        eventSource.close();
        eventSource = null;
      });

      eventSource.onerror = () => {
        summaryCount.textContent = "Unavailable";
        summaryTime.textContent = "Status stream failed";
        grid.innerHTML = "";
        refreshButton.disabled = false;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    }

    refreshButton.addEventListener("click", loadStatus);
    loadStatus();
    setInterval(loadStatus, 60000);
  </script>
</body>
</html>`;
}

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "reqarr"
  });
});

app.get("/", requireLocalDashboard, (_req, res) => {
  res.type("html").send(renderDashboardPage());
});

app.get("/status", requireLocalDashboard, async (_req, res) => {
  res.json(await getStackStatus());
});

app.get("/status/events", requireLocalDashboard, async (_req, res) => {
  const checks = getHealthChecks();
  const startedAt = new Date().toISOString();

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive"
  });

  const sendEvent = (eventName, data) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent("start", {
    checkedAt: startedAt,
    services: checks.map(service => ({
      id: service.id,
      name: service.name
    }))
  });

  await Promise.all(checks.map(async service => {
    const result = await checkHealthService(service);
    sendEvent("service", result);
  }));

  sendEvent("done", {
    checkedAt: new Date().toISOString()
  });
  res.end();
});

async function handleMovieDownload(req, res) {
  try {
    const tmdbId = Number(req.body.tmdbId);
    const quality = String(req.body.quality || "4k").toLowerCase();
    const monitor = String(req.body.monitor || "movieOnly");

    if (!tmdbId) {
      return res.status(400).json({
        ok: false,
        error: "Missing tmdbId"
      });
    }

    const qualityProfileId = MOVIE_QUALITY_PROFILES[quality];

    if (!qualityProfileId) {
      return res.status(400).json({
        ok: false,
        error: "Invalid quality. Use 720p, 1080p, or 4k."
      });
    }

    const monitorType = MOVIE_MONITOR_TYPES[monitor];

    if (!monitorType) {
      return res.status(400).json({
        ok: false,
        error: "Invalid monitor type."
      });
    }

    const existingMovies = await arrGet(RADARR_URL, RADARR_API_KEY, "/api/v3/movie");
    const existingMovie = existingMovies.find(movie => movie.tmdbId === tmdbId);

    if (existingMovie) {
      return res.json({
        ok: true,
        alreadyExists: true,
        type: "movie",
        title: existingMovie.title,
        tmdbId: existingMovie.tmdbId,
        qualityProfileId: existingMovie.qualityProfileId
      });
    }

    const movie = await arrGet(
      RADARR_URL,
      RADARR_API_KEY,
      `/api/v3/movie/lookup/tmdb?tmdbId=${tmdbId}`
    );

    const addedMovie = await arrPost(RADARR_URL, RADARR_API_KEY, "/api/v3/movie", {
      ...movie,
      qualityProfileId,
      rootFolderPath: RADARR_ROOT_FOLDER,
      monitored: monitorType !== "none",
      addOptions: {
        monitor: monitorType,
        searchForMovie: true
      }
    });

    res.json({
      ok: true,
      added: true,
      type: "movie",
      title: addedMovie.title,
      tmdbId: addedMovie.tmdbId,
      quality,
      qualityProfileId,
      monitor: monitorType,
      searchNow: true
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}

async function handleTvDownload(req, res) {
  try {
    const tmdbId = Number(req.body.tmdbId);
    const quality = String(req.body.quality || "4k").toLowerCase();
    const monitor = String(req.body.monitor || "all");

    if (!tmdbId) {
      return res.status(400).json({
        ok: false,
        error: "Missing tmdbId"
      });
    }

    const qualityProfileId = TV_QUALITY_PROFILES[quality];

    if (!qualityProfileId) {
      return res.status(400).json({
        ok: false,
        error: "Invalid quality. Use 720p, 1080p, or 4k."
      });
    }

    const monitorType = TV_MONITOR_TYPES[monitor];

    if (!monitorType) {
      return res.status(400).json({
        ok: false,
        error: "Invalid monitor type."
      });
    }

    const lookupResults = await arrGet(
      SONARR_URL,
      SONARR_API_KEY,
      `/api/v3/series/lookup?term=${encodeURIComponent(`tmdb:${tmdbId}`)}`
    );

    if (!Array.isArray(lookupResults) || lookupResults.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "TV series not found in Sonarr lookup by TMDB ID."
      });
    }

    const series = lookupResults[0];

    const existingSeries = await arrGet(SONARR_URL, SONARR_API_KEY, "/api/v3/series");
    const existing = existingSeries.find(item => item.tvdbId === series.tvdbId);

    if (existing) {
      return res.json({
        ok: true,
        alreadyExists: true,
        type: "tv",
        title: existing.title,
        tvdbId: existing.tvdbId,
        qualityProfileId: existing.qualityProfileId
      });
    }

    const addedSeries = await arrPost(SONARR_URL, SONARR_API_KEY, "/api/v3/series", {
      ...series,
      qualityProfileId,
      rootFolderPath: SONARR_ROOT_FOLDER,
      monitored: monitorType !== "none",
      seasonFolder: true,
      seriesType: "standard",
      addOptions: {
        monitor: monitorType,
        searchForMissingEpisodes: true,
        searchForCutoffUnmetEpisodes: false
      }
    });

    res.json({
      ok: true,
      added: true,
      type: "tv",
      title: addedSeries.title,
      tvdbId: addedSeries.tvdbId,
      tmdbId,
      quality,
      qualityProfileId,
      monitor: monitorType,
      seasonFolder: true,
      searchNow: true
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}

app.post("/download/movie", requireDownloadAdmin, handleMovieDownload);
app.post("/download/tv", requireDownloadAdmin, handleTvDownload);
app.post("/reqarr/download/movie", requireDownloadAdmin, handleMovieDownload);
app.post("/reqarr/download/tv", requireDownloadAdmin, handleTvDownload);

app.listen(port, () => {
  console.log(`reqarr running on port ${port}`);
});
