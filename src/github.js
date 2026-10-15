// Live GitHub contribution graph, fetched on each visit and drawn in the site's style.
import React, { useEffect, useState } from "react";
import { html, SectionHead, Icon } from "./ui.js";
import { t, getLang } from "./i18n.js";
import { useUnlockOnView } from "./achievements.js";
import { github } from "./data.js";

const API = (user) => `https://github-contributions-api.jogruber.de/v4/${user}?y=last`;

export function GitHubActivity({ index }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  useUnlockOnView("github", "github");

  useEffect(() => {
    fetch(API(github.user))
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  // Group days into week columns (Sunday first), like GitHub does.
  let weeks = [], total = 0, best = null, active = 0;
  if (data) {
    const days = data.contributions;
    const pad = new Date(days[0].date + "T00:00:00").getDay();
    const cells = [...Array(pad).fill(null), ...days];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    for (const d of days) {
      total += d.count;
      if (d.count) active++;
      if (!best || d.count > best.count) best = d;
    }
  }
  const fmt = (date) => new Date(date + "T00:00:00").toLocaleDateString(getLang() === "zh" ? "zh-CN" : getLang(), { day: "numeric", month: "short", year: "numeric" });
  const months = weeks.map((w, i) => {
    const first = w.find(Boolean);
    if (!first) return "";
    const m = new Date(first.date + "T00:00:00").getMonth();
    const prev = weeks[i - 1]?.find(Boolean);
    return !prev || new Date(prev.date + "T00:00:00").getMonth() !== m
      ? new Date(first.date + "T00:00:00").toLocaleDateString(getLang() === "zh" ? "zh-CN" : getLang(), { month: "short" })
      : "";
  });

  return html`<section id="github" className="section">
    <${SectionHead} index=${index} label="GitHub" title=${t("Building in public.")} />
    <div className="gh glass" data-reveal>
      <div className="gh-head">
        <div className="gh-stats">
          <div><strong>${data ? total : "—"}</strong><span>${t("contributions in the last year")}</span></div>
          <div><strong>${data ? active : "—"}</strong><span>${t("active days")}</span></div>
          ${best && best.count > 0 && html`<div><strong>${best.count}</strong><span>${t("best day")} · ${fmt(best.date)}</span></div>`}
        </div>
        <a className="link" href=${"https://github.com/" + github.user} target="_blank" rel="noopener">@${github.user} <${Icon} name="arrow" size=${14} /></a>
      </div>
      ${failed
        ? html`<p className="gh-fail">${t("Couldn't load the activity graph right now.")}</p>`
        : html`<div className="gh-scroll">
          <div className="gh-graph" style=${{ "--weeks": weeks.length || 53 }} aria-label=${t("contributions in the last year")}>
            <div className="gh-months mono" aria-hidden="true">${months.map((m, i) => html`<span key=${i}>${m}</span>`)}</div>
            <div className="gh-grid">
              ${(data ? weeks : Array.from({ length: 53 }, () => Array(7).fill(null))).map((w, i) => html`<div key=${i} className="gh-week">
                ${w.map((d, j) => html`<span key=${j} className=${"gh-day" + (d ? " l" + d.level : " empty")}
                  title=${d ? `${d.count} ${t("contributions")} · ${fmt(d.date)}` : ""}></span>`)}
              </div>`)}
            </div>
          </div>
        </div>`}
      <div className="gh-foot">
        <span className="dim">${t(github.note)}</span>
        <span className="gh-legend mono" aria-hidden="true">${t("Less")} <i className="gh-day l0"></i><i className="gh-day l1"></i><i className="gh-day l2"></i><i className="gh-day l3"></i><i className="gh-day l4"></i> ${t("More")}</span>
      </div>
    </div>
  </section>`;
}
