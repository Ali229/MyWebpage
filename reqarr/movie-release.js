export function isMovieReleased(movie, now = new Date()) {
  if (String(movie?.status || "").toLowerCase() === "released") {
    return true;
  }

  const digitalReleaseTime = Date.parse(movie?.digitalRelease);
  return Number.isFinite(digitalReleaseTime) && digitalReleaseTime <= now.getTime();
}

export function shouldSearchForMovie(movie, monitorType, now = new Date()) {
  return monitorType !== "none" && isMovieReleased(movie, now);
}

export function buildRadarrMovieAddRequest(movie, qualityProfileId, rootFolderPath, monitorType, now = new Date()) {
  const searchNow = shouldSearchForMovie(movie, monitorType, now);

  return {
    request: {
      ...movie,
      qualityProfileId,
      rootFolderPath,
      minimumAvailability: "released",
      monitored: monitorType !== "none",
      addOptions: {
        monitor: monitorType,
        searchForMovie: searchNow
      }
    },
    searchNow
  };
}

export function buildExistingMovieResponse(movie) {
  return {
    ok: true,
    alreadyExists: true,
    type: "movie",
    title: movie.title,
    tmdbId: movie.tmdbId,
    qualityProfileId: movie.qualityProfileId
  };
}
