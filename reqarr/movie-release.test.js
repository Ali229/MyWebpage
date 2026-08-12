import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExistingMovieResponse,
  buildRadarrMovieAddRequest,
  isMovieReleased,
  shouldSearchForMovie
} from "./server.js";

const now = new Date("2026-08-12T12:00:00Z");

test("unreleased movie with no digital release is monitored without an immediate search", () => {
  const movie = {status: "announced"};

  assert.equal(isMovieReleased(movie, now), false);
  assert.equal(shouldSearchForMovie(movie, "movieOnly", now), false);
  const result = buildRadarrMovieAddRequest(movie, 5, "/movies", "movieOnly", now);
  assert.equal(result.request.monitored, true);
  assert.equal(result.request.minimumAvailability, "released");
  assert.equal(result.request.addOptions.searchForMovie, false);
});

test("future digital release does not trigger an immediate search", () => {
  const movie = {status: "announced", digitalRelease: "2026-08-13T00:00:00Z"};
  const result = buildRadarrMovieAddRequest(movie, 5, "/movies", "movieOnly", now);

  assert.equal(result.request.addOptions.searchForMovie, false);
});

test("past digital release triggers an immediate search", () => {
  const movie = {status: "announced", digitalRelease: "2026-08-11T00:00:00Z"};
  const result = buildRadarrMovieAddRequest(movie, 5, "/movies", "movieOnly", now);

  assert.equal(result.request.addOptions.searchForMovie, true);
});

test("Radarr released status triggers an immediate search", () => {
  const movie = {status: "released"};
  const result = buildRadarrMovieAddRequest(movie, 5, "/movies", "movieOnly", now);

  assert.equal(result.request.addOptions.searchForMovie, true);
});

test("existing movie response retains already-exists behavior without requesting a search", () => {
  const existingMovieResponse = buildExistingMovieResponse({
    title: "Existing Movie",
    tmdbId: 123,
    qualityProfileId: 5
  });

  assert.equal(existingMovieResponse.alreadyExists, true);
  assert.equal("searchNow" in existingMovieResponse, false);
});

test("monitor type none remains unmonitored and does not search", () => {
  const movie = {status: "released"};
  const result = buildRadarrMovieAddRequest(movie, 5, "/movies", "none", now);

  assert.equal(result.request.monitored, false);
  assert.equal(shouldSearchForMovie(movie, "none", now), false);
  assert.equal(result.request.addOptions.searchForMovie, false);
});
