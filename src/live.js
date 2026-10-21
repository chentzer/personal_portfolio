// Live content from your Google Sheet (see "Edit content in Google Sheets" in the README).
// Each tab is published to the web as CSV. On page load we fetch the tabs, turn the rows into
// the same shapes data.js uses, and swap them into data.js's arrays in place, so every section
// picks them up without knowing where they came from. If the sheet isn't set up, is slow or
// fails, the site quietly keeps the copies in data.js.
import { sheet, travels, topThree, story, career, lifeIntro, gameGenres } from "./data.js";
import { addTranslations } from "./i18n.js";

const LANGS = ["ja", "zh", "ms"];
const WAIT_MS = 2500; // never hold the page longer than this

const csvUrl = (gid) => `https://docs.google.com/spreadsheets/d/e/${sheet.id}/pub?gid=${gid}&single=true&output=csv`;

// RFC 4180 CSV: quoted cells may contain commas, quotes ("") and line breaks.
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// Rows as objects keyed by the lower-cased header. Blank rows are dropped.
function toObjects(rows) {
  const [head = [], ...body] = rows;
  const keys = head.map((h) => h.trim().toLowerCase());
  return body
    .map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])))
    .filter((o) => Object.values(o).some(Boolean));
}

async function fetchTab(gid, signal) {
  const res = await fetch(csvUrl(gid), { signal });
  if (!res.ok) throw new Error(`sheet tab ${gid}: HTTP ${res.status}`);
  return toObjects(parseCsv(await res.text()));
}

const lines = (s) => String(s || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const list = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
const yes = (s) => /^(true|yes|y|x|1|✓)$/i.test(String(s).trim());
const or = (s) => (s ? s : undefined);

// Translation columns: for a column "text", the sheet may have "text_ja", "text_zh" and "text_ms".
// Multi-value columns (bullets: one per line, tags: comma-separated) are paired item by item.
function collect(row, col, split = (s) => [s]) {
  const en = split(row[col] || "");
  for (const lang of LANGS) {
    const tr = split(row[`${col}_${lang}`] || "");
    const map = {};
    en.forEach((e, i) => { if (e && tr[i]) map[e] = tr[i]; });
    addTranslations(lang, map);
  }
}

// ── Travels ──
// Columns: place, country, year, note, home, lat, lon (+ _ja/_zh/_ms for place, country, note).
// lat/lon may be left blank; the place is then looked up on Open-Meteo's free geocoder.
async function geocode(place, country, signal) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&name=${encodeURIComponent(place)}`;
  const { results = [] } = await fetch(url, { signal }).then((r) => r.json());
  const hit = results.find((r) => r.country?.toLowerCase() === country.toLowerCase()) || results[0];
  return hit ? { lat: hit.latitude, lon: hit.longitude } : null;
}

async function toTravels(rows, signal) {
  const out = await Promise.all(rows.filter((r) => r.place && r.country).map(async (r) => {
    ["place", "country", "note"].forEach((c) => collect(r, c));
    let lat = parseFloat(r.lat), lon = parseFloat(r.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      const g = await geocode(r.place, r.country, signal).catch(() => null);
      if (!g) return null; // can't pin it without coordinates
      ({ lat, lon } = g);
    }
    return { place: r.place, country: r.country, lat, lon, year: or(r.year), note: or(r.note), home: yes(r.home) || undefined };
  }));
  if (signal.aborted) throw new Error("timed out while looking up places"); // don't show half a list
  return out.filter(Boolean);
}

// ── Top 3 ──
// Columns: year, type (song | game), title, artist, link, note (+ note_ja/_zh/_ms).
// Songs: link = Spotify track link. Games: link = Steam store link or app number.
function toTopThree(rows) {
  const years = new Map();
  for (const r of rows) {
    const year = parseInt(r.year, 10);
    if (!year || !r.title) continue;
    if (!years.has(year)) years.set(year, { year, music: [], games: [] });
    const y = years.get(year);
    if (/^song|music/i.test(r.type)) y.music.push({ song: r.title, artist: r.artist, spotify: or(r.link) });
    else {
      collect(r, "note");
      const steam = (String(r.link).match(/app\/(\d+)/) || String(r.link).match(/^(\d+)$/) || [])[1];
      y.games.push({ title: r.title, steam: steam ? Number(steam) : undefined, note: or(r.note) });
    }
  }
  return [...years.values()];
}

// ── Story and Career (same columns) ──
// id, kind (life | career | education), year, title, place, text, bullets (one per line),
// tags (comma-separated), link ("Label | https://…"), current, scene, embed, photos (one URL per line),
// progress (one step per line: "N5 | Aug 2024 | done" or "N2 | Self-studying | goal"),
// plus _ja/_zh/_ms columns for year, title, place, text, bullets, tags.
// Anything the sheet can't hold (the Hello-world code block) is kept from the data.js entry with the same id.
function toTimeline(rows, fallback) {
  const byId = new Map(fallback.filter((e) => e.id).map((e) => [e.id, e]));
  return rows.filter((r) => r.title || r.place).map((r) => {
    ["year", "title", "place", "text"].forEach((c) => collect(r, c));
    collect(r, "bullets", lines);
    collect(r, "tags", list);
    const [label, href] = String(r.link || "").split("|").map((s) => s.trim());
    const progress = lines(r.progress).map((step) => {
      const [stepLabel, note, flag = ""] = step.split("|").map((s) => s.trim());
      return { label: stepLabel, note: or(note), done: /done/i.test(flag) || undefined, goal: /goal/i.test(flag) || undefined };
    });
    const keep = byId.get(r.id);
    return {
      id: or(r.id),
      kind: r.kind || "life",
      year: r.year,
      title: r.title,
      place: r.place,
      text: or(r.text),
      bullets: lines(r.bullets).length ? lines(r.bullets) : undefined,
      tags: list(r.tags).length ? list(r.tags) : undefined,
      link: href ? { label: label || "Link", href } : undefined,
      current: yes(r.current) || undefined,
      scene: or(r.scene),
      embed: or(r.embed),
      photos: lines(r.photos).length ? lines(r.photos) : undefined,
      progress: progress.length ? progress : undefined,
      code: keep?.code,
    };
  });
}

// ── Stats ──
// Columns: key, value. Keys match lifeIntro.stats (steam, anime, manga). Anime and manga are
// also fetched live from MyAnimeList when that works; these values are the fallback.
function applyStats(rows) {
  for (const r of rows) {
    const stat = lifeIntro.stats.find((s) => s.key && s.key === r.key);
    if (stat && r.value) stat.value = r.value;
  }
}

// ── Games ──
// One row per game: genre, title, link (Steam store link or app number), note
// (+ genre_ja/_zh/_ms and note_ja/_zh/_ms). Genres show in the order they first appear.
function toGenres(rows) {
  const genres = new Map();
  for (const r of rows) {
    if (!r.genre || !r.title) continue;
    collect(r, "genre");
    collect(r, "note");
    if (!genres.has(r.genre)) genres.set(r.genre, { name: r.genre, games: [] });
    const steam = (String(r.link).match(/app\/(\d+)/) || String(r.link).match(/^(\d+)$/) || [])[1];
    genres.get(r.genre).games.push({ title: r.title, steam: steam ? Number(steam) : undefined, note: or(r.note) });
  }
  return [...genres.values()];
}

const replace = (arr, items) => { if (items.length) arr.splice(0, arr.length, ...items); };

export async function loadLiveContent() {
  if (!sheet.id) return;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), WAIT_MS);
  const tab = (name, use) => (sheet.tabs[name] == null ? null
    : fetchTab(sheet.tabs[name], ctl.signal).then(use).catch((err) => console.warn(`Sheet "${name}" not loaded:`, err.message)));
  await Promise.all([
    tab("travels", async (rows) => replace(travels, await toTravels(rows, ctl.signal))),
    tab("topThree", (rows) => replace(topThree, toTopThree(rows))),
    tab("story", (rows) => replace(story, toTimeline(rows, story))),
    tab("career", (rows) => replace(career, toTimeline(rows, career))),
    tab("stats", applyStats),
    tab("games", (rows) => replace(gameGenres, toGenres(rows))),
  ]);
  clearTimeout(timer);
}
