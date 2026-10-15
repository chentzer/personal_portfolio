// Easter egg: a hidden terminal (press ~ or `) that answers questions about you.
import React, { useEffect, useRef, useState } from "react";
import { html, clean } from "./ui.js";
import { unlock } from "./achievements.js";
import { profile, career, story, achievements, workProjects, passionProjects, skills, hobbies, contact, elsewhere, topThree } from "./data.js";

const LIFE_IDS = ["intro", "story", "top3", "off-duty", "travel", "elsewhere"];
// Scroll to a section on this page, or open the other page at that section.
const go = (id = "") => {
  const el = document.getElementById(id);
  if (el) return el.scrollIntoView({ behavior: "smooth" });
  if (id === "life" || LIFE_IDS.includes(id)) location.href = "life.html" + (id === "life" ? "" : "#" + id);
  else location.href = "./" + (id === "career" ? "" : "#" + id);
};
const line = (t) => `  [${(clean(t.year) || "----").padEnd(19)}] ${clean(t.title) ? clean(t.title) + " @ " + t.place : t.place}`;

function run(cmd, ctx) {
  const [name, ...args] = cmd.trim().split(/\s+/);
  switch ((name || "").toLowerCase()) {
    case "": return [];
    case "help": return [
      "Available commands:",
      "  whoami       who is this?",
      "  experience   career timeline",
      "  story        life timeline",
      "  impact       numbers I'm proud of",
      "  projects     things I've built",
      "  skills       the toolkit",
      "  hobbies      off-duty mode",
      "  top3         this year's top songs and games",
      "  contact      how to reach me",
      "  goto <id>    jump to a section or page (career, life, projects…)",
      "  warp         engage warp drive",
      "  clear        clear the screen",
      "  exit         close the terminal",
    ];
    case "whoami": return [`${profile.name} · ${profile.title}`, profile.tagline, `Location: ${profile.location}`];
    case "experience": case "career": case "journey": return career.map(line);
    case "story": case "life": return story.map(line);
    case "impact": case "achievements": return achievements.map((a) => `  ★ ${a.title} (${a.org})`);
    case "projects": return [
      "At work:", ...workProjects.map((p) => `  ▸ ${p.title}${p.classified ? " [CLASSIFIED]" : ""}`),
      "Passion projects:", ...passionProjects.map((p) => `  ▸ ${p.title}${clean(p.year) ? " (" + clean(p.year) + ")" : ""}`),
    ];
    case "skills": return skills.map((g) => `  ${g.group.padEnd(11)} ${g.items.join(", ")}`);
    case "hobbies": return hobbies.map((h) => `  ◆ ${h.title}`);
    case "top3": {
      const y = [...topThree].sort((a, b) => b.year - a.year)[0];
      if (!y) return ["Nothing yet."];
      return [`Top 3 · ${y.year}`, ...(y.music || []).map((m, i) => `  ♪ ${i + 1}. ${m.song} (${m.artist})`), ...(y.games || []).map((g, i) => `  ▶ ${i + 1}. ${g.title}`)];
    }
    case "contact": return [...Object.entries(contact).filter(([, v]) => v), ...elsewhere.filter((e) => e.href).map((e) => [e.key, e.href])].map(([k, v]) => `  ${k.padEnd(10)} ${v}`);
    case "yoasobi": return ["♪ 夜に駆ける (Yoru ni Kakeru), YOASOBI", "The song that started it all. Seen live: Malaysia 2025, Singapore 2026."];
    case "scout": case "kingscout": return ["Be prepared. ⚜ King Scout, Vice President of the Scouts."];
    case "goto": go(args[0]); ctx.close(); return [];
    case "warp": return [ctx.warp() ? "Warp drive engaged. 🚀 (type warp again to disengage)" : "Warp drive disengaged."];
    case "sudo": unlock("sudo"); return ["Nice try. This incident will be reported."];
    case "ls": return ["career/  about  experience  impact  projects  skills  contact", "life/    intro  story  top3  off-duty  travel  elsewhere"];
    case "manga": return ["4,700+ chapters and counting. Ask me for a recommendation."];
    case "clear": ctx.clear(); return null;
    case "exit": case "quit": ctx.close(); return null;
    default: return [`command not found: ${name}. Type 'help'.`];
  }
}

export function Terminal({ open, onClose, onWarp }) {
  const [lines, setLines] = useState([
    `LCT-OS 1.0, connected to ${profile.name}`,
    "Type 'help' to see available commands.",
  ]);
  const [value, setValue] = useState("");
  const [hist, setHist] = useState([]);
  const [hi, setHi] = useState(-1);
  const input = useRef(null);
  const body = useRef(null);

  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 50); }, [open]);
  useEffect(() => { if (body.current) body.current.scrollTop = body.current.scrollHeight; }, [lines]);

  const submit = (e) => {
    e.preventDefault();
    const ctx = { clear: () => setLines([]), close: onClose, warp: onWarp };
    const out = run(value, ctx);
    if (out !== null) setLines((l) => [...l, `› ${value}`, ...out]);
    if (value.trim()) setHist((h) => [value, ...h]);
    setHi(-1);
    setValue("");
  };
  const onKey = (e) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowUp" && hist.length) { e.preventDefault(); const n = Math.min(hi + 1, hist.length - 1); setHi(n); setValue(hist[n]); }
    else if (e.key === "ArrowDown") { e.preventDefault(); const n = hi - 1; setHi(n); setValue(n >= 0 ? hist[n] : ""); }
  };

  if (!open) return null;
  return html`<div className="term-overlay" onClick=${onClose}>
    <div className="term glass" role="dialog" aria-label="Terminal" onClick=${(e) => e.stopPropagation()}>
      <div className="term-bar mono">
        <span className="dots"><i></i><i></i><i></i></span>
        <span>lct@portfolio: ~</span>
        <button onClick=${onClose} aria-label="Close terminal">esc</button>
      </div>
      <div className="term-body mono" ref=${body} onClick=${() => input.current?.focus()}>
        ${lines.map((l, i) => html`<div key=${i} className=${l.startsWith("›") ? "cmd" : ""}>${l || " "}</div>`)}
        <form onSubmit=${submit} className="term-input">
          <span>›</span>
          <input ref=${input} value=${value} onChange=${(e) => setValue(e.target.value)} onKeyDown=${onKey}
            spellCheck="false" autoComplete="off" aria-label="Terminal command" />
        </form>
      </div>
    </div>
  </div>`;
}
