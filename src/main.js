import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { html, useReveal } from "./ui.js";
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

// Full-screen context background that fades in while a timeline "scene" is on screen.
function Ambient() {
  const [active, setActive] = useState(null);
  useEffect(() => {
    // Preload so the first switch is instant.
    Object.values(scenes).forEach((sc) => { const i = new Image(); i.src = sc.image; });
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
        className=${"ambient-layer" + (active === name ? " on" : "")} style=${{ backgroundImage: `url("${sc.image}")` }}></div>`)}
      <div className="ambient-shade"></div>
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
    <${Nav} key=${"nav-" + lang} page=${PAGE} onTerminal=${() => setTerm(true)} onTrophies=${() => setTrophies(true)} />
    <main key=${"main-" + lang} className="page-enter">
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
