import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { html, useReveal, reduceMotion } from "./ui.js";
import { startScene } from "./scene.js";
import { Nav, Footer, CareerPage, LifePage } from "./sections.js";
import { Terminal } from "./terminal.js";
import { profile, scenes, analytics } from "./data.js";
import { t, getLang } from "./i18n.js";
import { unlock, AchievementToasts, AchievementsPanel } from "./achievements.js";
import { loadLiveContent } from "./live.js";

// Visitor stats (GoatCounter): only loads once a code is set in data.js, and never on localhost.
if (analytics.goatcounter && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = `https://${analytics.goatcounter}.goatcounter.com/count`;
  document.head.appendChild(s);
}

let scene = null;
try {
  scene = startScene(document.getElementById("scene"));
} catch (err) {
  // No WebGL: the CSS background still looks good.
  console.warn("3D scene disabled:", err);
  document.body.classList.add("no-webgl");
}

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

function Boot({ done }) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setHide(true), 1300);
    const t2 = setTimeout(done, 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return html`<div className=${"boot" + (hide ? " hide" : "")} aria-hidden="true">
    <div className="boot-mark mono">${profile.initials}</div>
    <div className="boot-bar"><i></i></div>
    <div className="boot-text mono">INITIALIZING IDENTITY…</div>
  </div>`;
}

// Animated rain for scenes with `effect: "rain"`. Draws only while its scene is on screen;
// visitors who prefer reduced motion get a single still frame instead.
function Rain({ on }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!on) return;
    const still = reduceMotion();
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let w, h, raf;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr; h = canvas.height = innerHeight * dpr;
    };
    const onResize = () => { size(); if (still) loop(last); };
    size();
    window.addEventListener("resize", onResize);
    // Each drop: position, speed and length; slanted slightly by the wind.
    const drops = Array.from({ length: Math.round(Math.min(innerWidth, 1600) / 6) }, () => ({
      x: Math.random() * w, y: Math.random() * h, v: 0.6 + Math.random() * 0.8, l: 0.5 + Math.random() * 0.8,
    }));
    const wind = 0.18;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 16.7, 3); last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(190, 210, 235, 0.5)";
      ctx.lineWidth = 1.3 * Math.max(1, w / innerWidth);
      ctx.beginPath();
      const unit = h / 60;
      for (const d of drops) {
        d.y += d.v * unit * dt; d.x += d.v * unit * wind * dt;
        if (d.y > h) { d.y = -unit * 2; d.x = Math.random() * w * 1.1 - w * 0.1; }
        const len = d.l * unit * 1.6;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - len * wind, d.y - len);
      }
      ctx.stroke();
      if (!still) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); ctx.clearRect(0, 0, w, h); };
  }, [on]);
  return html`<canvas ref=${ref} className=${"ambient-rain" + (on ? " on" : "")}></canvas>`;
}

// Full-screen context background that fades in while a timeline "scene" is on screen.
// A scene shows a photo (`image`) or a CSS `background`, and can add an `effect` (rain).
function Ambient() {
  const [active, setActive] = useState(null);
  useEffect(() => {
    // Preload so the first switch is instant.
    Object.values(scenes).forEach((sc) => { if (sc.image) { const i = new Image(); i.src = sc.image; } });
    const onScene = (e) => { setActive(e.detail); if (e.detail === "yoasobi") unlock("yoasobi"); };
    window.addEventListener("scenechange", onScene);
    return () => window.removeEventListener("scenechange", onScene);
  }, []);
  useEffect(() => {
    const sc = active && scenes[active];
    const root = document.documentElement;
    if (sc) {
      root.style.setProperty("--accent", sc.accent);
      root.style.setProperty("--accent-2", sc.accent2 || sc.accent);
      root.dataset.scene = active;
    } else {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-2");
      delete root.dataset.scene;
    }
    scene?.setMood(sc ? sc.accent : null);
  }, [active]);
  const np = active && scenes[active]?.nowPlaying;
  return html`
    <div className="ambient" aria-hidden="true">
      ${Object.entries(scenes).map(([name, sc]) => html`<div key=${name}
        className=${"ambient-layer" + (active === name ? " on" : "")} style=${{ backgroundImage: sc.image ? `url("${sc.image}")` : sc.background }}></div>`)}
      <div className="ambient-shade"></div>
      <${Rain} on=${active && scenes[active]?.effect === "rain"} />
    </div>
    <a className=${"now-playing mono" + (np ? " on" : "")} href=${np?.href || "#"} target="_blank" rel="noopener"
       tabIndex=${np ? 0 : -1} aria-hidden=${!np}>
      <span className="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span><span className="dim">${t("Now playing")} ·</span> ${np?.title} <span className="dim">· ${t(np?.artist)}</span></span>
    </a>`;
}

function Toast({ msg }) {
  return msg ? html`<div className="toast mono" role="status">${msg}</div>` : null;
}

function Cursor() {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let x = 0, y = 0, cx = 0, cy = 0, raf;
    const move = (e) => {
      x = e.clientX; y = e.clientY;
      ref.current?.classList.add("on");
      const hot = e.target.closest?.("a, button, .tilt, input");
      ref.current?.classList.toggle("hot", !!hot);
    };
    const loop = () => {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      if (ref.current) ref.current.style.transform = `translate(${cx}px, ${cy}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    document.body.classList.add("has-cursor");
    return () => { window.removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, []);
  return html`<div className="cursor" ref=${ref} aria-hidden="true"><i></i></div>`;
}

const PAGE = document.body.dataset.page === "life" ? "life" : "career";

function App() {
  const firstVisit = !sessionStorageGet("booted");
  const [booted, setBooted] = useState(!firstVisit);
  const [term, setTerm] = useState(false);
  const [toast, setToast] = useState("");
  const [trophies, setTrophies] = useState(false);
  const [lang, setLangState] = useState(getLang());
  useReveal();

  // Re-render everything in the new language when it changes.
  useEffect(() => {
    const on = (e) => { setLangState(e.detail); unlock("polyglot"); };
    window.addEventListener("langchange", on);
    return () => window.removeEventListener("langchange", on);
  }, []);

  // Re-render the page when hidden content is unlocked or hidden from the terminal.
  const [unlocks, setUnlocks] = useState(0);
  useEffect(() => {
    const on = () => setUnlocks((n) => n + 1);
    window.addEventListener("hiddenchange", on);
    return () => window.removeEventListener("hiddenchange", on);
  }, []);

  useEffect(() => {
    unlock("hello");
    if (PAGE === "life") setTimeout(() => unlock("offclock"), 1500);
  }, []);
  useEffect(() => { if (term) unlock("terminal"); }, [term]);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };
  const warp = () => { const on = scene?.toggleWarp(); return on; };

  useEffect(() => {
    let seq = [];
    const onKey = (e) => {
      const typing = /input|textarea/i.test(e.target.tagName);
      if (!typing && (e.key === "`" || e.key === "~")) { e.preventDefault(); setTerm((t) => !t); return; }
      seq = [...seq, e.key].slice(-KONAMI.length);
      if (seq.join() === KONAMI.join()) { seq = []; unlock("konami"); flash(warp() ? "⟡ WARP DRIVE ENGAGED" : "⟡ WARP DRIVE OFFLINE"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return html`
    ${!booted && html`<${Boot} done=${() => { sessionStorageSet("booted", "1"); setBooted(true); }} />`}
    <${Cursor} />
    <${Ambient} />
    <div className="grid-overlay" aria-hidden="true"></div>
    <${Nav} key=${"nav-" + lang + "-" + unlocks} page=${PAGE} onTerminal=${() => setTerm(true)} onTrophies=${() => setTrophies(true)} />
    <main key=${"main-" + lang + "-" + unlocks} className="page-enter">
      ${PAGE === "life" ? html`<${LifePage} />` : html`<${CareerPage} />`}
    </main>
    <${Footer} key=${"foot-" + lang} page=${PAGE} onTrophies=${() => setTrophies(true)} />
    <${AchievementsPanel} open=${trophies} onClose=${() => setTrophies(false)} />
    <${AchievementToasts} />
    <${Terminal} open=${term} page=${PAGE} onClose=${() => setTerm(false)} onWarp=${warp} />
    <${Toast} msg=${toast} />
  `;
}

function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch {} }

// Pull in the Google Sheet (if set up) before the first render; capped at a couple of seconds.
await loadLiveContent();
createRoot(document.getElementById("root")).render(html`<${App} />`);
