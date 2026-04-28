import express from "express";
import cors from "cors";
import crypto from "node:crypto";

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

const RADARR_ROOT_FOLDER = "/data/media/movies";
const SONARR_ROOT_FOLDER = "/data/media/tv";

const MOVIE_QUALITY_PROFILES = {
  "720p": 3,
  "1080p": 4,
  "4k": 5
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

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "reqarr"
  });
});

async function handleMovieDownload(req, res) {
  try {
    const tmdbId = Number(req.body.tmdbId);
    const quality = String(req.body.quality || "1080p").toLowerCase();
    const searchNow = req.body.searchNow !== false;

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
      monitored: true,
      addOptions: {
        searchForMovie: searchNow
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
      searchNow
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
    const quality = String(req.body.quality || "1080p").toLowerCase();
    const monitor = String(req.body.monitor || "all");
    const searchNow = req.body.searchNow !== false;

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
        searchForMissingEpisodes: searchNow,
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
      searchNow
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
