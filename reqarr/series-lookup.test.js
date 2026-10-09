import test from "node:test";
import assert from "node:assert/strict";
import {lookupSonarrSeries} from "./server.js";

const below = {title: "Below", tmdbId: 285322, tvdbId: 480205};
const beppe = {title: "Beppes good night", tmdbId: 89550, tvdbId: 285322};

test("Below uses its TVDB ID without confusing the two ID namespaces", async () => {
  const terms = [];
  const result = await lookupSonarrSeries(below, async term => {
    terms.push(term);
    return term === "tvdb:480205" ? [below] : [beppe];
  });
  assert.equal(result, below);
  assert.deepEqual(terms, ["tvdb:480205"]);
});

test("a mismatched ID result falls back to name and selects the exact TMDB match", async () => {
  const terms = [];
  const result = await lookupSonarrSeries(below, async term => {
    terms.push(term);
    return term === "Below" ? [beppe, {...below, tmdbId: "285322"}] : [beppe];
  });
  assert.equal(result.title, "Below");
  assert.deepEqual(terms, ["tvdb:480205", "Below"]);
});

test("saved titles without external IDs resolve by name with an exact TMDB match", async () => {
  assert.equal(await lookupSonarrSeries({tmdbId: 285322, title: "Below"}, async term => {
    assert.equal(term, "Below");
    return [beppe, below];
  }), below);
});

test("an unrelated result is never accepted even when it is the only result", async () => {
  assert.equal(await lookupSonarrSeries(below, async () => [beppe]), null);
});

test("missing lookup hints and invalid IDs fail safely without a lookup", async () => {
  const unexpectedLookup = async () => assert.fail("Unexpected lookup");
  assert.equal(await lookupSonarrSeries({tmdbId: 285322}, unexpectedLookup), null);
  assert.equal(await lookupSonarrSeries({...below, tmdbId: -1}, unexpectedLookup), null);
});

test("empty and malformed results never resolve a title", async () => {
  for (const results of [[], null, {}, [{tmdbId: 285322}], [{...below, tvdbId: 0}]]) {
    assert.equal(await lookupSonarrSeries(below, async () => results), null);
  }
});
