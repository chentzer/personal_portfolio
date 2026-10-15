import React, { useEffect, useRef, useState } from "react";
import { Travel } from "./globe.js";
import { TopThree } from "./topthree.js";
import { GitHubActivity } from "./github.js";
import { Guestbook } from "./guestbook.js";
import { html, clean, Scramble, TypeCycle, Tilt, SectionHead, Icon, useReveal, CodeBlock } from "./ui.js";
import { t, LANGS, getLang, setLang } from "./i18n.js";
import { useAchievementCount, useUnlockOnView } from "./achievements.js";
import {
  profile, about, career, achievements, workProjects, passionProjects, skills, contact, github,
  lifeIntro, story, scenes, hobbies, elsewhere, guestbook, analytics,
} from "./data.js";

// The two pages. Each has its own file so tabs are real, shareable URLs.
export const PAGES = {
  career: {
    href: "./",
    label: "Career",
    sections: [
      ["about", "About"],
      ["experience", "Experience"],
      ["impact", "Impact"],
      ["projects", "Projects"],
      ...(github.show ? [["github", "GitHub"]] : []),
      ["skills", "Skills"],
      ["contact", "Contact"],
    ],
  },
  life: {
    href: "life.html",
    label: "Life",
    sections: [
      ["intro", "Intro"],
      ["story", "Story"],
      ["top3", "Top 3"],
      ["off-duty", "Off-duty"],
      ["travel", "Travel"],
      ["elsewhere", "Elsewhere"],
      ...(guestbook.categoryId ? [["guestbook", "Guestbook"]] : []),
    ],
  },
};

// Keep ?lang= when moving between pages.
const withLang = (href) => (getLang() === "en" ? href : `${href}${href.includes("?") ? "&" : "?"}lang=${getLang()}`);

function LangSwitch() {
  const [open, setOpen] = useState(false);
  const cur = LANGS.find((l) => l.code === getLang());
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);
  return html`<div className="lang">
    <button className="term-btn" aria-haspopup="listbox" aria-expanded=${open} title=${t("Language")}
        onClick=${(e) => { e.stopPropagation(); setOpen(!open); }}>
      <${Icon} name="globe" size=${15} /> <span>${cur.label}</span>
    </button>
    ${open && html`<ul className="lang-menu glass" role="listbox" aria-label=${t("Language")}>
      ${LANGS.map((l) => html`<li key=${l.code}><button role="option" aria-selected=${l.code === cur.code}
          className=${l.code === cur.code ? "on" : ""} onClick=${() => { setOpen(false); setLang(l.code); }}>${l.name}</button></li>`)}
    </ul>`}
  </div>`;
}

function TrophyButton({ onOpen }) {
  const [n, total] = useAchievementCount();
  return html`<button className="term-btn" onClick=${onOpen} title=${t("Achievements")}>
    <${Icon} name="star" size=${15} /> <span className="mono">${n}/${total}</span>
  </button>`;
}

export function Nav({ page, onTerminal, onTrophies }) {
  const sections = PAGES[page].sections;
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      let cur = "";
      for (const [id] of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = id;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [page]);
  return html`<nav className=${"nav" + (scrolled ? " scrolled" : "") + (open ? " open" : "")} aria-label="Main">
    <a href="#top" className="brand" aria-label="Back to top">
      <span className="brand-mark">${profile.initials}</span>
      <span className="brand-name">${profile.shortName}</span>
    </a>
    <div className="tabs" role="tablist" aria-label="Pages">
      ${Object.entries(PAGES).map(([key, p]) => html`<a key=${key} role="tab" href=${withLang(p.href)}
        aria-selected=${key === page} className=${"tab" + (key === page ? " on" : "")}>${t(p.label)}</a>`)}
    </div>
    <button className="menu-btn" aria-expanded=${open} aria-label="Menu" onClick=${() => setOpen(!open)}><span></span><span></span></button>
    <ul>
      ${sections.map(([id, label], i) => html`<li key=${id}>
        <a href=${"#" + id} className=${active === id ? "active" : ""} onClick=${() => setOpen(false)}>
          <span className="mono">0${i + 1}</span>${t(label)}
        </a></li>`)}
      <li className="nav-tools">
        <${LangSwitch} />
        <${TrophyButton} onOpen=${() => { setOpen(false); onTrophies(); }} />
        <button className="term-btn" onClick=${() => { setOpen(false); onTerminal(); }} title=${t("Open terminal (press ~)")}>
          <${Icon} name="term" size=${16} /> <span className="mono">~</span>
        </button>
      </li>
    </ul>
  </nav>`;
}

// ── Career hero ──
export function Hero() {
  return html`<section id="top" className="hero">
    <div className="hud hud-tl mono">SYS://PORTFOLIO <span className="dim">v1.0</span></div>
    <div className="hud hud-tr mono">${profile.coords}<br/><span className="dim">${t(profile.location).toUpperCase()}</span></div>
    <div className="hero-inner">
      ${profile.available && html`<div className="status mono"><span className="pulse"></span>${t("Open to conversations")}</div>`}
      <h1 className="hero-name">
        <${Scramble} text=${profile.name} delay=${700} />
      </h1>
      <div className="hero-title">
        <span className="hero-role">${t(profile.title)}</span>
        <span className="sep">/</span>
        <${TypeCycle} words=${profile.traits.map(t)} />
      </div>
      <p className="hero-tagline">${t(profile.tagline)}</p>
      <div className="hero-cta">
        <a className="btn primary" href="#experience">${t("View experience")} <${Icon} name="down" size=${16} /></a>
        ${profile.resume
          ? html`<a className="btn" href=${profile.resume} download><${Icon} name="file" size=${16} /> ${t("Résumé")}</a>`
          : html`<span className="btn disabled" title=${t("Coming soon")}><${Icon} name="file" size=${16} /> ${t("Résumé · soon")}</span>`}
      </div>
    </div>
    <a href="#about" className="scroll-cue mono" aria-label="Scroll to About"><span>${t("SCROLL")}</span><i></i></a>
  </section>`;
}

// ── Life hero ──
export function LifeHero() {
  return html`<section id="top" className="hero hero-life">
    <div className="hud hud-tl mono">SYS://PORTFOLIO <span className="dim">/life</span></div>
    <div className="hud hud-tr mono">${t("OFF THE CLOCK")}<br/><span className="dim">${t(profile.location).toUpperCase()}</span></div>
    <div className="hero-inner">
      <div className="status mono"><span className="pulse off"></span>${t("Off the clock")}</div>
      <h1 className="hero-name"><${Scramble} text=${t("Beyond the code")} delay=${500} /></h1>
      <p className="hero-tagline">${t("Gamer, manga reader, traveller and YOASOBI fan. The parts of me that don't fit on a résumé.")}</p>
      <div className="hero-cta">
        <a className="btn primary" href="#story">${t("Read the story")} <${Icon} name="down" size=${16} /></a>
        <a className="btn" href=${withLang(PAGES.career.href)}>← ${t("Career")}</a>
      </div>
    </div>
    <a href="#intro" className="scroll-cue mono" aria-label="Scroll down"><span>${t("SCROLL")}</span><i></i></a>
  </section>`;
}

// Total unique visitors from GoatCounter's public counter. Null until it loads, and stays
// null if the counter setting is off or the request is blocked, so the stat stays hidden.
function useVisitorCount(on) {
  const [count, setCount] = useState(null);
  useEffect(() => {
    if (!on || !analytics.goatcounter) return;
    let alive = true;
    fetch(`https://${analytics.goatcounter}.goatcounter.com/counter/TOTAL.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && d.count) setCount(String(d.count).trim()); })
      .catch(() => {});
    return () => { alive = false; };
  }, [on]);
  return count;
}

export function About({ id = "about", index = "01", label = "About", data = about, cta }) {
  useReveal(); // the visitor stat arrives after first render and needs revealing too
  const visitors = useVisitorCount(data.stats.some((s) => s.visitors));
  const stats = data.stats.filter((s) => (s.visitors ? visitors : true));
  return html`<section id=${id} className="section">
    <${SectionHead} index=${index} label=${t(label)} title=${t(data.heading)} />
    <div className="about-grid">
      <div className="avatar-wrap" data-reveal>
        <${Tilt} className="avatar" max=${12}>
          ${profile.photo
            ? html`<img src=${profile.photo} alt=${profile.name} />`
            : html`<div className="monogram"><span>${profile.initials}</span></div>`}
          <div className="avatar-scan" aria-hidden="true"></div>
          <div className="avatar-tag mono">ID · ${profile.initials}-0001</div>
        <//>
      </div>
      <div className="about-text">
        ${data.paragraphs.map((p, i) => html`<p key=${i} data-reveal style=${{ "--d": i * 90 + "ms" }}>${t(p)}</p>`)}
        <div className="stats">
          ${stats.map((s, i) => html`<div key=${i} className="stat glass" data-reveal style=${{ "--d": i * 70 + "ms" }}>
            <div className="stat-v">${s.visitors ? visitors : s.value}</div><div className="stat-l">${t(s.label)}</div>
          </div>`)}
        </div>
        ${cta && html`<a className="link cross-link" href=${withLang(cta.href)} data-reveal>${t(cta.label)} <${Icon} name="arrow" size=${14} /></a>`}
      </div>
    </div>
  </section>`;
}

const KINDS = { life: "Life", education: "Education", career: "Career" };

export function Timeline({ id, index, label, title, items }) {
  useReveal();
  const lineRef = useRef(null);
  useEffect(() => {
    let activeScene;
    const onScroll = () => {
      const el = lineRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(Math.max((window.innerHeight * 0.6 - r.top) / r.height, 0), 1);
      el.style.setProperty("--progress", p);

      // Context scene: whichever scene entry overlaps the middle band of the screen.
      let scene = null;
      el.querySelectorAll("[data-scene]").forEach((li) => {
        const b = li.getBoundingClientRect();
        if (b.top < window.innerHeight * 0.7 && b.bottom > window.innerHeight * 0.3) scene = li.dataset.scene;
      });
      if (scene !== activeScene) {
        activeScene = scene;
        window.dispatchEvent(new CustomEvent("scenechange", { detail: scene }));
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return html`<section id=${id} className="section">
    <${SectionHead} index=${index} label=${t(label)} title=${t(title)} />
    <div className="timeline" ref=${lineRef}>
      <div className="timeline-line" aria-hidden="true"><i></i></div>
      <ol>
      ${items.map((e) => {
        const year = clean(e.year);
        const text = clean(e.text);
        const bullets = (e.bullets || []).map(clean).filter(Boolean);
        const photos = (e.photos || []).filter(Boolean);
        const credit = e.scene && scenes[e.scene]?.credit;
        return html`<li key=${e.title + e.year} className=${"tl-item " + e.kind + (e.current ? " current" : "") + (e.scene ? " has-scene" : "")}
            data-scene=${e.scene || undefined} data-reveal>
          <div className="tl-node" aria-hidden="true"><span></span></div>
          <div className="tl-card glass">
            <div className="tl-meta mono">
              <span className=${"kind " + e.kind}>${t(KINDS[e.kind])}</span>
              <span>${year ? t(year) : "—"}</span>
              ${e.current && html`<span className="now"><span className="pulse"></span>${t("Now")}</span>`}
            </div>
            <h3>${t(clean(e.title)) || t(e.place)}</h3>
            ${clean(e.title) && html`<div className="tl-place">${t(e.place)}</div>`}
            ${text && html`<p>${t(text)}</p>`}
            ${e.code && html`<${CodeBlock} code=${e.code} />`}
            ${bullets.length > 0 && html`<ul className="bullets">${bullets.map((b, j) => html`<li key=${j}>${t(b)}</li>`)}</ul>`}
            ${e.progress && html`<ol className="steps" aria-label="Progress">${e.progress.map((p) => html`<li key=${p.label}
                className=${"step" + (p.done ? " done" : "") + (p.goal ? " goal" : "")}>
              <span className="step-dot" aria-hidden="true"></span>
              <span className="step-label mono">${p.label}</span>
              ${p.note && html`<span className="step-note">${t(p.note)}</span>`}
            </li>`)}</ol>`}
            ${e.tags && html`<div className="tags">${e.tags.map((g) => html`<span key=${g} className="tag">${t(g)}</span>`)}</div>`}
            ${photos.length > 0 && html`<div className="tl-photos">${photos.map((src) => html`<img key=${src} src=${src} alt="" loading="lazy" />`)}</div>`}
            ${e.embed && html`<iframe className="tl-embed" src=${e.embed + "?theme=0"} title=${"Listen: " + e.title}
              height="80" loading="lazy" allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`}
            ${e.link && html`<a className="link" href=${e.link.href} target="_blank" rel="noopener">${t(e.link.label)} <${Icon} name="arrow" size=${14} /></a>`}
            ${credit && html`<div className="tl-credit mono">${credit}</div>`}
          </div>
        </li>`;
      })}
    </ol></div>
  </section>`;
}

export function Cards({ id, index, label, title, items }) {
  return html`<section id=${id} className="section">
    <${SectionHead} index=${index} label=${t(label)} title=${t(title)} />
    <div className="ach-grid">
      ${items.map((a, i) => html`<${Tilt} key=${a.title} className=${"ach glass" + (a.featured ? " featured" : "")}
          data-reveal data-glyph=${a.glyph || undefined} style=${{ "--d": i * 80 + "ms" }}>
        <div className="ach-icon"><${Icon} name="star" size=${a.featured ? 28 : 20} /></div>
        <div className="ach-meta mono">${t(a.org)}${clean(a.year) ? " · " + t(clean(a.year)) : ""}</div>
        <h3>${t(a.title)}</h3>
        ${clean(a.text) && html`<p>${t(clean(a.text))}</p>`}
        ${a.badge && html`<div className="badge mono">${t(a.badge)}</div>`}
      <//>`)}
    </div>
  </section>`;
}

function ProjectCard({ p, i }) {
  const year = clean(p.year);
  return html`<${Tilt} className=${"proj glass" + (p.classified ? " classified" : "")}
      data-reveal style=${{ "--d": i * 80 + "ms" }} max=${6}>
    <div className="proj-top mono">
      <span>${p.classified ? t("CLASSIFIED") : year ? t("SINCE {year}").replace("{year}", year) : t(p.subtitle || "")}</span>
      ${p.classified ? html`<${Icon} name="lock" size=${16} />` : html`<span className="dim">${year ? t(p.subtitle || "") : ""}</span>`}
    </div>
    <h3>${t(p.title)}</h3>
    ${p.classified && html`<div className="redact" aria-hidden="true"><i></i><i></i><i></i></div>`}
    ${clean(p.text) && html`<p>${t(clean(p.text))}</p>`}
    <div className="tags">${p.tags.map((g) => html`<span key=${g} className="tag">${g}</span>`)}</div>
    ${p.links && html`<div className="proj-links">${p.links.map((l) => html`<a key=${l.href} className="link" href=${l.href}
      target="_blank" rel="noopener">${l.label} <${Icon} name="arrow" size=${14} /></a>`)}</div>`}
  <//>`;
}

export function Projects({ index }) {
  const groups = [
    ["At work", "Production systems, built with my teams.", workProjects],
    ["Passion projects", "Built on my own time, because I wanted to.", passionProjects],
  ].filter(([, , items]) => items.length);
  return html`<section id="projects" className="section">
    <${SectionHead} index=${index} label=${t("Projects")} title=${t("Things I've built.")} />
    ${groups.map(([label, sub, items]) => html`<div key=${label} className="proj-group">
      <div className="proj-group-head" data-reveal>
        <h3>${t(label)}</h3><span>${t(sub)}</span>
      </div>
      <div className="proj-grid">
        ${items.map((p, i) => html`<${ProjectCard} key=${p.title} p=${p} i=${i} />`)}
      </div>
    </div>`)}
  </section>`;
}

export function Skills({ index }) {
  return html`<section id="skills" className="section">
    <${SectionHead} index=${index} label=${t("Skills")} title=${t("The toolkit.")} />
    <div className="skill-grid">
      ${skills.map((g, i) => html`<div key=${g.group} className="skill-group glass" data-reveal style=${{ "--d": i * 80 + "ms" }}>
        <div className="skill-head mono"><span>${String(i + 1).padStart(2, "0")}</span>${t(g.group)}</div>
        <div className="skill-items">
          ${g.items.map((s) => html`<span key=${s} className="skill">${t(s)}</span>`)}
        </div>
      </div>`)}
    </div>
  </section>`;
}

export function Hobbies({ index }) {
  return html`<section id="off-duty" className="section">
    <${SectionHead} index=${index} label=${t("Off-duty")} title=${t("When the laptop closes.")} />
    <div className="hobby-grid">
      ${hobbies.map((h, i) => html`<${Tilt} key=${h.title} className="hobby glass" data-reveal style=${{ "--d": i * 70 + "ms" }}>
        <div className="hobby-icon"><${Icon} name=${h.icon} size=${26} /></div>
        <h3>${t(h.title)}</h3>
        ${clean(h.text) && html`<p>${t(clean(h.text))}</p>`}
      <//>`)}
    </div>
  </section>`;
}

export function Elsewhere({ index }) {
  const items = elsewhere.filter((e) => e.href);
  return html`<section id="elsewhere" className="section">
    <${SectionHead} index=${index} label=${t("Elsewhere")} title=${t("Find me off the clock.")} />
    <div className="elsewhere-grid">
      ${items.map((e, i) => html`<a key=${e.key} className="elsewhere glass" href=${e.href} target="_blank" rel="noopener"
          data-reveal style=${{ "--d": i * 70 + "ms" }}>
        <span className="elsewhere-icon"><${Icon} name=${e.key} size=${22} /></span>
        <span className="elsewhere-text"><strong>${e.label}</strong><span>${t(e.text)}</span></span>
        <${Icon} name="arrow" size=${16} />
      </a>`)}
    </div>
  </section>`;
}

const LINKS = [["linkedin", "LinkedIn"], ["github", "GitHub"], ["blog", "Blog"]];

export function Contact({ index }) {
  useUnlockOnView("contact", "recruiter");
  return html`<section id="contact" className="section contact">
    <${SectionHead} index=${index} label=${t("Contact")} title=${t("Let's connect.")} />
    <div className="contact-card glass" data-reveal>
      <p className="contact-lead">${t("Whether it's a role, a collaboration or a project idea, my inbox is open.")}</p>
      ${contact.email && html`<a className="email" href=${"mailto:" + contact.email}>
        <${Icon} name="mail" size=${22} /><span>${contact.email}</span><${Icon} name="arrow" size=${18} />
      </a>`}
      <div className="socials">
        ${LINKS.filter(([k]) => contact[k]).map(([k, label]) => html`<a key=${k} className="social" href=${contact[k]}
          target="_blank" rel="noopener"><${Icon} name=${k} size=${18} /> ${label}</a>`)}
      </div>
    </div>
  </section>`;
}

export function Footer({ page, onTrophies }) {
  const other = page === "career" ? PAGES.life : PAGES.career;
  return html`<footer className="footer mono">
    <span>© ${new Date().getFullYear()} ${profile.name}</span>
    <a className="footer-switch" href=${withLang(other.href)}>${page === "career" ? t("More about me outside work") + " →" : "← " + t("Back to career")}</a>
    <span className="dim">${t("Built with React + Three.js")} · <button className="footer-link" onClick=${onTrophies}>${t("Achievements")}</button> · ${t("press")} <kbd>~</kbd> ${t("for terminal")}</span>
  </footer>`;
}

// ── Page compositions ──
export function CareerPage() {
  return html`
    <${Hero} />
    <${About} cta=${{ href: PAGES.life.href, label: "More about me outside work" }} />
    <${Timeline} id="experience" index="02" label="Experience" title="Where I've built things." items=${career} />
    <${Cards} id="impact" index="03" label="Impact" title="Numbers I'm proud of." items=${achievements} />
    <${Projects} index="04" />
    ${github.show && html`<${GitHubActivity} index="05" />`}
    <${Skills} index=${github.show ? "06" : "05"} />
    <${Contact} index=${github.show ? "07" : "06"} />`;
}

export function LifePage() {
  return html`
    <${LifeHero} />
    <${About} id="intro" index="01" label="Intro" data=${lifeIntro} />
    <${Timeline} id="story" index="02" label="Story" title="The moments that shaped me." items=${story} />
    <${TopThree} index="03" />
    <${Hobbies} index="04" />
    <${Travel} index="05" />
    <${Elsewhere} index="06" />
    ${guestbook.categoryId && html`<${Guestbook} index="07" />`}`;
}
