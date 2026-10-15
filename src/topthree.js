// Yearly Top 3: songs (from Spotify Wrapped) and games (from Steam Replay), with a year switcher.
import React, { useEffect, useState } from "react";
import { html, SectionHead, Icon } from "./ui.js";
import { t } from "./i18n.js";
import { topThree } from "./data.js";

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

export function TopThree({ index }) {
  const years = [...topThree].sort((a, b) => b.year - a.year);
  const [year, setYear] = useState(years[0]?.year);
  const [playing, setPlaying] = useState(null);
  const entry = years.find((y) => y.year === year);
  if (!entry) return null;
  const music = (entry.music || []).slice(0, 3);
  const games = (entry.games || []).slice(0, 3);

  return html`<section id="top3" className="section">
    <${SectionHead} index=${index} label=${t("Top 3")} title=${t("My year in songs and games.")} />
    ${years.length > 1 && html`<div className="filters" role="tablist" aria-label="Year" data-reveal>
      ${years.map((y) => html`<button key=${y.year} role="tab" aria-selected=${y.year === year}
        className=${"chip" + (y.year === year ? " on" : "")} onClick=${() => { setYear(y.year); setPlaying(null); }}>${y.year}</button>`)}
    </div>`}
    <div data-reveal>
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
    </div>
    </div>
  </section>`;
}
