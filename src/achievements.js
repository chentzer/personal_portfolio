// Steam-style achievements: visitors unlock them by exploring. Progress is kept in this browser only.
import React, { useEffect, useState } from "react";
import { html, Icon } from "./ui.js";
import { t } from "./i18n.js";

export const ACHIEVEMENTS = [
  { id: "hello", title: "Hello, world", desc: "Visit the site." },
  { id: "recruiter", title: "Recruiter mode", desc: "Reach the contact section." },
  { id: "offclock", title: "Off the clock", desc: "Open the Life page." },
  { id: "yoasobi", title: "Racing into the night", desc: "Reach the YOASOBI chapter." },
  { id: "globe", title: "Globetrotter", desc: "Hover a country I've visited." },
  { id: "github", title: "Open source", desc: "Find my GitHub activity." },
  { id: "polyglot", title: "Polyglot", desc: "Switch the site's language." },
  { id: "terminal", title: "I'm in", desc: "Open the hidden terminal.", hidden: true },
  { id: "sudo", title: "Nice try", desc: "Run sudo in the terminal.", hidden: true },
  { id: "konami", title: "↑↑↓↓←→←→BA", desc: "Engage warp drive.", hidden: true },
  { id: "perfect", title: "Perfect game", desc: "Unlock every other achievement." },
];

const KEY = "lct-achievements";
const load = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return new Set(); } };
const save = (set) => { try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch {} };
let unlocked = load();

// Unlock an achievement from anywhere on the site. Unlocking the same one twice does nothing.
export function unlock(id) {
  if (unlocked.has(id) || !ACHIEVEMENTS.some((a) => a.id === id)) return;
  unlocked = new Set(unlocked).add(id);
  save(unlocked);
  window.dispatchEvent(new CustomEvent("achievement", { detail: id }));
  const others = ACHIEVEMENTS.filter((a) => a.id !== "perfect");
  if (id !== "perfect" && others.every((a) => unlocked.has(a.id))) setTimeout(() => unlock("perfect"), 1200);
}

// Unlock when an element with this id scrolls into view.
export function useUnlockOnView(elementId, achievementId) {
  useEffect(() => {
    const el = document.getElementById(elementId);
    if (!el || unlocked.has(achievementId)) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { unlock(achievementId); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
}

export function useAchievementCount() {
  const [n, setN] = useState(unlocked.size);
  useEffect(() => {
    const on = () => setN(unlocked.size);
    window.addEventListener("achievement", on);
    return () => window.removeEventListener("achievement", on);
  }, []);
  return [n, ACHIEVEMENTS.length];
}

// Steam-like popups in the corner, stacking if several unlock at once.
export function AchievementToasts() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const on = (e) => {
      const a = ACHIEVEMENTS.find((x) => x.id === e.detail);
      const key = e.detail + Date.now();
      setItems((list) => [...list, { ...a, key }]);
      setTimeout(() => setItems((list) => list.filter((x) => x.key !== key)), 4200);
    };
    window.addEventListener("achievement", on);
    return () => window.removeEventListener("achievement", on);
  }, []);
  return html`<div className="ach-toasts" role="status" aria-live="polite">
    ${items.map((a) => html`<div key=${a.key} className="ach-toast">
      <span className="ach-toast-icon"><${Icon} name="star" size=${22} /></span>
      <span className="ach-toast-text">
        <span className="mono">${t("Achievement unlocked")}</span>
        <strong>${t(a.title)}</strong>
        <span>${t(a.desc)}</span>
      </span>
    </div>`)}
  </div>`;
}

// Full list, opened from the trophy button.
export function AchievementsPanel({ open, onClose }) {
  const [n, total] = useAchievementCount();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open) return null;
  return html`<div className="term-overlay" onClick=${onClose}>
    <div className="ach-panel glass" role="dialog" aria-label=${t("Achievements")} onClick=${(e) => e.stopPropagation()}>
      <div className="ach-panel-head">
        <div>
          <div className="mono dim">${t("Achievements")}</div>
          <strong>${n} / ${total} ${t("unlocked")}</strong>
        </div>
        <button className="term-btn" onClick=${onClose} aria-label=${t("Close")}>esc</button>
      </div>
      <div className="ach-bar"><i style=${{ width: (n / total) * 100 + "%" }}></i></div>
      <ul className="ach-list">
        ${ACHIEVEMENTS.map((a) => {
          const got = unlocked.has(a.id);
          const secret = a.hidden && !got;
          return html`<li key=${a.id} className=${got ? "got" : ""}>
            <span className="ach-list-icon"><${Icon} name=${got ? "star" : "lock"} size=${18} /></span>
            <span><strong>${secret ? "???" : t(a.title)}</strong><span>${secret ? t("Hidden achievement. Keep exploring.") : t(a.desc)}</span></span>
          </li>`;
        })}
      </ul>
    </div>
  </div>`;
}
