// Games section (Life page): favourite genres, plus the yearly Top 3 (songs from Spotify Wrapped,
// games from Steam Replay, with a year switcher) in a pop-up behind a small button.
import React, { useEffect, useState } from "react";
import { html, SectionHead, Icon } from "./ui.js";
import { t } from "./i18n.js";
import { topThree, gameGenres } from "./data.js";

const steamImage = (id) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`;
const steamLink = (id) => `https://store.steampowered.com/app/${id}/`;
const spotifyId = (url) => (String(url).match(/track\/([A-Za-z0-9]+)/) || [])[1];

// Cover art comes from Spotify's public oEmbed endpoint; cached per track for the session.
const coverCache = new Map();
function useSpotifyCover(url) {
  const [cover, setCover] = useState(() => coverCache.get(url) || null);
  useEffect(() => {
    if (!url || coverCache.has(url)) return;
    let alive = true;
    fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d) => { coverCache.set(url, d.thumbnail_url); if (alive) setCover(d.thumbnail_url); })
      .catch(() => {});
    return () => { alive = false; };
  }, [url]);
  return cover;
}

function Song({ item, rank, open, onToggle }) {
  const cover = useSpotifyCover(item.spotify);
  const id = spotifyId(item.spotify);
  return html`<div className=${"top-card glass" + (open ? " open" : "")}>
    <button className="top-row" onClick=${onToggle} disabled=${!id} aria-expanded=${open}
        aria-label=${`${item.song} by ${item.artist}${id ? ", play preview" : ""}`}>
      <span className="top-rank mono">0${rank}</span>
      <span className="top-art square">${cover ? html`<img src=${cover} alt="" loading="lazy" />` : html`<${Icon} name="music" size=${20} />`}</span>
      <span className="top-text"><strong>${item.song}</strong><span>${item.artist}</span></span>
      ${id && html`<span className="top-play" aria-hidden="true"><${Icon} name=${open ? "down" : "music"} size=${16} /></span>`}
    </button>
    ${open && id && html`<iframe className="top-embed" src=${`https://open.spotify.com/embed/track/${id}?theme=0`} title=${"Listen: " + item.song}
      height="80" loading="lazy" allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`}
  </div>`;
}

function Game({ item, rank }) {
  const body = html`
    <span className="top-rank mono">0${rank}</span>
    <span className="top-art wide">${item.steam ? html`<img src=${steamImage(item.steam)} alt="" loading="lazy" />` : html`<${Icon} name="game" size=${20} />`}</span>
    <span className="top-text"><strong>${item.title}</strong>${item.note && html`<span>${t(item.note)}</span>`}</span>`;
  return item.steam
    ? html`<a className="top-card top-row glass" href=${steamLink(item.steam)} target="_blank" rel="noopener">${body}<${Icon} name="arrow" size=${14} /></a>`
    : html`<div className="top-card top-row glass">${body}</div>`;
}

const sortedYears = () => [...topThree].sort((a, b) => b.year - a.year);

// The yearly Top 3 itself: year switcher, songs and most-played games. Shown in a pop-up.
function TopThreeBody() {
  const years = sortedYears();
  const [year, setYear] = useState(years[0]?.year);
  const [playing, setPlaying] = useState(null);
  const entry = years.find((y) => y.year === year);
  if (!entry) return null;
  const music = (entry.music || []).slice(0, 3);
  const games = (entry.games || []).slice(0, 3);

  return html`
    ${years.length > 1 && html`<div className="filters" role="tablist" aria-label="Year">
      ${years.map((y) => html`<button key=${y.year} role="tab" aria-selected=${y.year === year}
        className=${"chip" + (y.year === year ? " on" : "")} onClick=${() => { setYear(y.year); setPlaying(null); }}>${y.year}</button>`)}
    </div>`}
    <div className=${"top-grid" + (music.length && games.length ? "" : " single")}>
      ${music.length > 0 && html`<div className="top-col">
        <div className="top-head mono"><${Icon} name="music" size=${16} /> ${t("On repeat")} · ${year}</div>
        ${music.map((m, i) => html`<${Song} key=${m.song} item=${m} rank=${i + 1}
          open=${playing === m.song} onToggle=${() => setPlaying(playing === m.song ? null : m.song)} />`)}
      </div>`}
      ${games.length > 0 && html`<div className="top-col">
        <div className="top-head mono"><${Icon} name="game" size=${16} /> ${t("Most played")} · ${year}</div>
        ${games.map((g, i) => html`<${Game} key=${g.title} item=${g} rank=${i + 1} />`)}
      </div>`}
    </div>`;
}

function TopThreePanel({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return html`<div className="term-overlay" onClick=${onClose}>
    <div className="top3-panel glass" role="dialog" aria-label=${t("Top 3")} onClick=${(e) => e.stopPropagation()}>
      <div className="ach-panel-head">
        <div>
          <div className="mono dim">${t("Top 3")}</div>
          <strong>${t("My year in songs and games.")}</strong>
        </div>
        <button className="term-btn" onClick=${onClose} aria-label=${t("Close")}>esc</button>
      </div>
      <${TopThreeBody} />
    </div>
  </div>`;
}

// Games section: the genres I like, with the yearly Top 3 behind a small button.
export function Games({ index }) {
  const [open, setOpen] = useState(false);
  const latest = sortedYears()[0];
  const hasTop3 = latest && ((latest.music || []).length || (latest.games || []).length);
  return html`<section id="games" className="section">
    <${SectionHead} index=${index} label=${t("Games")} title=${t("What I play.")} />
    <div className="top-head mono" data-reveal><${Icon} name="game" size=${16} /> ${t("Genres I like")}</div>
    <div className="genre-grid">
      ${gameGenres.map((g, i) => html`<div key=${g.name} className="genre-card glass" data-reveal style=${{ "--d": i * 60 + "ms" }}>
        <h3>${t(g.name)}</h3>
        <div className="genre-games">
          ${g.games.map((game) => html`<a key=${game.title} className="genre-game" href=${steamLink(game.steam)} target="_blank" rel="noopener">
            <img src=${steamImage(game.steam)} alt="" loading="lazy" />
            <span><strong>${game.title}</strong>${game.note && html`<span>${t(game.note)}</span>`}</span>
          </a>`)}
        </div>
      </div>`)}
    </div>
    ${hasTop3 && html`<button className="btn top3-btn" onClick=${() => setOpen(true)} data-reveal>
      <${Icon} name="music" size=${16} /> ${t("Top 3 · {year}").replace("{year}", latest.year)}
    </button>`}
    ${open && html`<${TopThreePanel} onClose=${() => setOpen(false)} />`}
  </section>`;
}
