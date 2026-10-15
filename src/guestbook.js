// Guestbook powered by giscus: messages are stored as GitHub Discussions on the portfolio repo.
// Visitors sign in with GitHub to leave a message. Setup steps are in the README.
import React, { useEffect, useRef } from "react";
import { html, SectionHead } from "./ui.js";
import { t, getLang } from "./i18n.js";
import { guestbook } from "./data.js";

const GISCUS_LANG = { en: "en", ja: "ja", zh: "zh-CN", ms: "en" }; // giscus has no Malay; falls back to English

export function Guestbook({ index }) {
  const ref = useRef(null);
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    const attrs = {
      "data-repo": guestbook.repo,
      "data-repo-id": guestbook.repoId,
      "data-category": guestbook.category,
      "data-category-id": guestbook.categoryId,
      "data-mapping": "specific",
      "data-term": "Guestbook",
      "data-strict": "1",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "top",
      "data-theme": "transparent_dark",
      "data-lang": GISCUS_LANG[getLang()] || "en",
      "data-loading": "lazy",
    };
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    ref.current.appendChild(s);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, []);
  return html`<section id="guestbook" className="section">
    <${SectionHead} index=${index} label=${t("Guestbook")} title=${t("Leave a message.")} />
    <p className="guestbook-lead" data-reveal>${t("Say hi, recommend a manga, or tell me where I should travel next. Sign in with GitHub to post.")}</p>
    <div className="guestbook glass" ref=${ref}></div>
  </section>`;
}
