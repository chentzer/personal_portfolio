// Shared UI helpers: JSX-like templates, scroll reveal, text scramble, tilt cards, icons.
import React, { useEffect, useRef, useState } from "react";
import htm from "htm";

export const html = htm.bind(React.createElement);

// Placeholder handling: "TODO..." values are hidden; trailing " TODO: ..." notes are stripped.
export function clean(str) {
  if (str == null) return null;
  const s = String(str);
  if (s.trim().startsWith("TODO")) return null;
  const i = s.indexOf("TODO");
  return i === -1 ? s : s.slice(0, i).trim() || null;
}

export const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Adds .in to elements with [data-reveal] when they scroll into view.
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]:not(.in)");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}

// Minimal Java-ish syntax highlighting: keywords, types, strings, numbers, method calls.
const TOKENS = /("(?:[^"\\]|\\.)*")|\b(new|public|static|void|class|return|final)\b|\b([A-Z][A-Za-z0-9]*)\b|\b(\d+)\b|\b([a-z][A-Za-z0-9]*)(?=\()/g;
function highlight(line) {
  const out = [];
  let last = 0, m, k = 0;
  while ((m = TOKENS.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const cls = m[1] ? "tk-str" : m[2] ? "tk-kw" : m[3] ? "tk-type" : m[4] ? "tk-num" : "tk-fn";
    out.push(html`<span key=${k++} className=${cls}>${m[0]}</span>`);
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

// A small code editor whose lines type themselves out once it scrolls into view.
export function CodeBlock({ code }) {
  const ref = useRef(null);
  const [go, setGo] = useState(reduceMotion());
  useEffect(() => {
    if (go) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); io.disconnect(); } }, { threshold: 0.5 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const per = 0.75; // seconds per line
  return html`<div ref=${ref} className=${"code" + (go ? " go" : "")} aria-label=${"Code: " + code.lines.join(" ")}>
    <div className="code-bar mono"><span className="dots"><i></i><i></i><i></i></span><span>${code.file}</span></div>
    <pre className="code-body mono" aria-hidden="true">${code.lines.map((l, i) => html`<div key=${i} className="code-line">
        <span className="code-ln">${i + 1}</span>
        <span className="code-text" style=${{ "--ch": l.length, "--delay": i * per + "s" }}>${highlight(l)}</span>
      </div>`)}${code.output && html`<div className="code-out" style=${{ "--delay": code.lines.length * per + 0.2 + "s" }}>
        ${code.output.map((o, i) => html`<div key=${i}><span className="code-prompt">›</span> ${o}</div>`)}
      </div>`}</pre>
  </div>`;
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>";

// Text that "decodes" from random glyphs into the final string.
export function Scramble({ text, delay = 0, speed = 28, className = "" }) {
  const [out, setOut] = useState(reduceMotion() ? text : text.replace(/\S/g, " "));
  useEffect(() => {
    if (reduceMotion()) { setOut(text); return; }
    // Time-based (not frame-based) so it finishes on schedule even when frames are throttled.
    let raf, done;
    const start = performance.now();
    const duration = text.length * speed * 2.2;
    const tick = () => {
      const elapsed = performance.now() - start - delay;
      if (elapsed < 0) { raf = requestAnimationFrame(tick); return; }
      const revealed = Math.floor((elapsed / duration) * text.length);
      done = revealed >= text.length;
      let s = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " " || i < revealed) s += text[i];
        else if (i < revealed + 6) s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        else s += " ";
      }
      if (done) { setOut(text); return; }
      setOut(s);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Safety net: if frames are paused entirely, still show the name.
    const fallback = setTimeout(() => { cancelAnimationFrame(raf); setOut(text); }, delay + duration + 500);
    return () => { cancelAnimationFrame(raf); clearTimeout(fallback); };
  }, [text]);
  return html`<span className=${className} aria-label=${text}><span aria-hidden="true">${out}</span></span>`;
}

// Cycles through words with a typing effect.
export function TypeCycle({ words }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    if (reduceMotion()) return;
    const w = words[i];
    let ms = del ? 40 : 90;
    if (!del && n === w.length) ms = 1600;
    if (del && n === 0) ms = 300;
    const id = setTimeout(() => {
      if (!del && n === w.length) setDel(true);
      else if (del && n === 0) { setDel(false); setI((i + 1) % words.length); }
      else setN(n + (del ? -1 : 1));
    }, ms);
    return () => clearTimeout(id);
  }, [i, n, del, words]);
  const word = reduceMotion() ? words.join(" · ") : words[i].slice(0, n);
  return html`<span className="type">${word}<span className="caret" aria-hidden="true"></span></span>`;
}

// Card that tilts toward the cursor with a moving holographic sheen.
export function Tilt({ className = "", children, max = 8, ...rest }) {
  const ref = useRef(null);
  const onMove = (e) => {
    if (reduceMotion() || e.pointerType === "touch") return;
    const el = ref.current, r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * max}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * max}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return html`<div ref=${ref} className=${"tilt " + className} onPointerMove=${onMove} onPointerLeave=${onLeave} ...${rest}>
    <div className="tilt-sheen" aria-hidden="true"></div>
    ${children}
  </div>`;
}

export function SectionHead({ index, label, title }) {
  return html`<header className="section-head" data-reveal>
    <div className="eyebrow"><span className="mono">${index}</span><span className="rule"></span><span>${label}</span></div>
    <h2>${title}</h2>
  </header>`;
}

const P = {
  game: "M6 11h4M8 9v4M15 12h.01M18 10h.01M7.5 6h9a5.5 5.5 0 0 1 5.4 6.6l-.8 4A2.9 2.9 0 0 1 16.2 17L15 15.5H9L7.8 17a2.9 2.9 0 0 1-4.9-.4l-.8-4A5.5 5.5 0 0 1 7.5 6Z",
  book: "M4 4.5A1.5 1.5 0 0 1 5.5 3H11v17H5.5A1.5 1.5 0 0 1 4 18.5ZM20 4.5A1.5 1.5 0 0 0 18.5 3H13v17h5.5a1.5 1.5 0 0 0 1.5-1.5ZM11 20h2",
  gym: "M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  plane: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  linkedin: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2ZM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  github: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5 5 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A5 5 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.7c0 5.4 3.3 6.6 6.4 7A3.4 3.4 0 0 0 9 18.1V22",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 2-10 7L2 6",
  instagram: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm9 9.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4ZM17.5 6.5h.01",
  spotify: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM7.5 9.5c3-1 6.5-.7 9 .8M8 12.7c2.5-.7 5-.4 7 .8M8.6 15.7c1.9-.5 3.7-.3 5.2.6",
  anilist: "M12 3 3 21h4l5-10 5 10h4Z",
  steam: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15 9.5a1.5 1.5 0 1 0 0-.01M8 15.5a2 2 0 1 0 0-.01M9.5 14.3l4.2-3.6",
  blog: "M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z",
  arrow: "M7 17 17 7M8 7h9v9",
  down: "M12 5v14M5 12l7 7 7-7",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M12 18v-6M9 15l3 3 3-3",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  star: "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z",
  term: "M4 17l6-6-6-6M12 19h8",
};

export function Icon({ name, size = 20 }) {
  return html`<svg className="icon" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d=${P[name] || P.star} /></svg>`;
}
