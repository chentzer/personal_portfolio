# Portfolio: notes for Claude

Personal portfolio for Liew Chen Tzer. Static site, React 18 + Three.js loaded as ES modules from CDNs via an import map. **No build step and no npm.** It deploys to GitHub Pages as-is.

## How it's organised
- `index.html` is the **Career** page (main); `life.html` is the **Life** page. Both mount `src/main.js`, which reads `<body data-page>`.
- **All content lives in `src/data.js`**, split into a CAREER half and a LIFE half. Values starting with `TODO` are hidden on the site.
- Translations live in `src/i18n/{ja,zh,ms}.js`, keyed by the exact English text. Anything rendered must go through `t()`; a missing key falls back to English.
- Preview with `py tools/serve.py 5173 .` (`python3` on macOS/Linux). It disables caching so edited modules reload.

## Conventions the owner asked for
- **Never guess facts.** Job titles, dates, metrics and life details come only from the owner, their LinkedIn text or their résumé. A guessed job title once had to be corrected.
- **Keep Career and Life separate.** Career is strictly professional; hobbies, YOASOBI, scouting, travel and personal profiles belong on Life. The only link from Career to Life is the neutral "More about me outside work".
- Keep scouting to its single Story entry; the owner felt it was over-emphasised.
- Every list is **newest first**.
- Use 夜游 for YOASOBI in Chinese (official "YOASOBI" in Japanese).
- Show the birth **year** only, never the full date of birth.

## Open items
See the **Pre-launch checklist** in `README.md`. After the first deploy: check the link preview in LinkedIn Post Inspector, and check the GoatCounter dashboard (https://chentzer.goatcounter.com) from a non-work network.
