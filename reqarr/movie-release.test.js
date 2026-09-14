import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExistingMovieResponse,
  buildRadarrMovieAddRequest,
  buildSeriesUpgrade,
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

function makeSeries() {
  return {
    id: 7,
    title: "Lanterns",
    monitored: true,
    qualityProfileId: 4,
    seasons: [
      {seasonNumber: 0, monitored: false},
      {seasonNumber: 1, monitored: true},
      {seasonNumber: 2, monitored: false}
    ]
  };
}

test("pilot-only series upgraded to all monitors every season and searches the series", () => {
  const upgrade = buildSeriesUpgrade(makeSeries(), "all", 5);

  assert.equal(upgrade.needsUpdate, true);
  assert.equal(upgrade.qualityChanged, true);
  assert.equal(upgrade.seriesUpdate.qualityProfileId, 5);
  assert.equal(upgrade.seriesUpdate.monitored, true);
  assert.deepEqual(
    upgrade.seriesUpdate.seasons.map(season => season.monitored),
    [false, true, true]
  );
  assert.deepEqual(upgrade.searchPlan, {type: "series"});
});

test("already fully-monitored series with same quality is a no-op", () => {
  const existing = makeSeries();
  existing.seasons[2].monitored = true;
  existing.qualityProfileId = 5;

  const upgrade = buildSeriesUpgrade(existing, "all", 5);

  assert.equal(upgrade.needsUpdate, false);
  assert.deepEqual(upgrade.searchPlan, {type: "series"});
});

test("first season upgrade targets season one with a season search", () => {
  const existing = makeSeries();
  existing.seasons[1].monitored = false;

  const upgrade = buildSeriesUpgrade(existing, "firstSeason", 4);

  assert.equal(upgrade.needsUpdate, true);
  assert.equal(upgrade.qualityChanged, false);
  assert.equal(upgrade.seriesUpdate.seasons[1].monitored, true);
  assert.deepEqual(upgrade.searchPlan, {type: "season", seasonNumber: 1});
});

test("last season upgrade targets the highest season number", () => {
  const upgrade = buildSeriesUpgrade(makeSeries(), "lastSeason", 4);

  assert.equal(upgrade.needsUpdate, true);
  assert.equal(upgrade.seriesUpdate.seasons[2].monitored, true);
  assert.deepEqual(upgrade.searchPlan, {type: "season", seasonNumber: 2});
});

test("none unmonitors the series without a search", () => {
  const upgrade = buildSeriesUpgrade(makeSeries(), "none", 4);

  assert.equal(upgrade.needsUpdate, true);
  assert.equal(upgrade.seriesUpdate.monitored, false);
  assert.deepEqual(
    upgrade.seriesUpdate.seasons.map(season => season.monitored),
    [false, false, false]
  );
  assert.deepEqual(upgrade.searchPlan, {type: "none"});
});
