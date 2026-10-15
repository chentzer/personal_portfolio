# Liew Chen Tzer · Personal Portfolio

A futuristic personal portfolio built with **React 18 + Three.js**. It needs no build step: modules load from a CDN through an import map, so the site runs on any static host as-is.

## Edit content

All text lives in **`src/data.js`**: profile, timeline, achievements, projects, skills, hobbies and contact links.
Search for `TODO` to find what still needs filling in. Values starting with `TODO` are hidden on the site until replaced.

- **Photo:** put an image in `assets/` and set `profile.photo = "assets/me.jpg"`.
- **Résumé:** put the PDF in `assets/` and set `profile.resume = "assets/Liew_Chen_Tzer_Resume.pdf"`. The button activates automatically.
- **Accent colour:** change `--accent` at the top of `styles.css`.

## Run locally

Any static server works. Opening `index.html` directly won't work, because ES modules need http.

```bash
py tools/serve.py 5173 .
```

Then open http://127.0.0.1:5173. This small server turns off caching, so edits always show up. (On macOS/Linux use `python3` instead of `py`; any static server also works.)

## Every December: update your Top 3

1. Open **Spotify Wrapped** and **Steam Replay** for the year.
2. In `src/data.js`, copy the latest entry in `topThree` and paste it at the top with the new year.
3. Fill in `music` (song, artist, Spotify share link) and `games` (title, Steam app number from the store URL, a short note).

Cover art and game images load automatically, and a year switcher appears once there's more than one year.

## Languages (EN · 日本語 · 中文 · BM)

Visitors switch language from the globe button in the nav, and links keep it (`?lang=ja`).
Translations live in `src/i18n/ja.js`, `zh.js` and `ms.js` as `"English text": "translation"`.
If you change English text in `src/data.js`, update the same key in each file. Until you do, that line just shows in English.
The translations were written by AI, so it's worth asking a native speaker to skim each language.

## Turn on the guestbook (one-time, about 5 minutes)

1. In the GitHub repo, go to **Settings → General → Features** and tick **Discussions**.
2. Create a Discussions category called **Guestbook**, of type **Announcement** (so only you can start threads; visitors reply).
3. Install the giscus app on the repo: https://github.com/apps/giscus
4. Go to https://giscus.app, enter `chentzer/personal_portfolio`, pick the **Guestbook** category, and copy the `data-category-id` value.
5. Paste it into `guestbook.categoryId` in `src/data.js`. The Guestbook section and nav link appear automatically.

## Turn on visitor stats (one-time)

1. Sign up at https://www.goatcounter.com (free) and choose a code, e.g. `chentzer`.
2. Set `analytics.goatcounter = "chentzer"` in `src/data.js`.
3. See visits at `https://chentzer.goatcounter.com`: unique visitors, pages, countries, referrers. No cookies, no consent banner needed.
4. For the **People who've visited** stat on the Life page: in GoatCounter go to **Settings** and tick **Allow adding visitor counts on your website**, then save. Until then the stat stays hidden.

## Link-preview image

`assets/og-image.jpg` is the card shown when the site is shared on LinkedIn, WhatsApp, etc.
To redraw it after changing your name, title or tagline: start `py tools/serve.py 5173 .` and open http://127.0.0.1:5173/tools/og.html. It saves a new `assets/og-image.jpg`.
**After deploying,** check it with the LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/). If you move to a custom domain, update the URLs in `site` (data.js) and the `og:` tags in both HTML files.

## Pre-launch checklist

- [x] MyAnimeList: lists tidied up; link enabled
- [x] Steam: profile tidied up; link enabled
- [ ] Instagram: review what's public
- [x] Fix current job title (Software Engineer @ ENTIIS)
- [x] Split into Career (main) and Life pages
- [x] Career history from LinkedIn (Maybank, Boost, Ant International, ENTIIS)
- [ ] ENTIIS: one line on what you work on
- [ ] Résumé PDF in `assets/` for the download button
- [ ] Company Projects: expand into real project cards from the résumé
- [ ] Top 3: add your 2025 songs from Spotify Wrapped (games are filled in)
- [ ] Travel globe: add every place you've been to `travels` in `src/data.js`
- [ ] Fill remaining `TODO`s (your photo, concert photos, scout years, childhood story)
- [x] Guestbook: connected (Discussions → Guestbook category, giscus installed)
- [x] Visitor stats: GoatCounter `chentzer` connected (check the dashboard from a non-work network after deploy)
- [ ] **After deploy:** check the link preview in LinkedIn Post Inspector
- [ ] Optional: ask native speakers to skim the 日本語 / 中文 / BM translations

## Deploy (GitHub Pages)

1. Push this folder to `github.com/chentzer/personal_portfolio`.
2. Go to repo **Settings → Pages → Source: Deploy from a branch → `main` / root**.
3. The site goes live at `https://chentzer.github.io/personal_portfolio/`.

## Easter eggs

- Press <kbd>~</kbd> (or click the `>_` button) to open a hidden terminal. Try `help`, `whoami`, `experience`, `story`, `yoasobi`, `goto life`.
- Konami code (↑ ↑ ↓ ↓ ← → ← → B A) engages warp drive.
- 11 Steam-style achievements unlock as visitors explore. Progress is saved in each visitor's browser; the trophy button in the nav shows the list.

## Structure

```
index.html        Career page (main): about, experience, impact, projects, skills, contact
life.html         Life page: intro, story, top 3, hobbies, travel globe, personal links
styles.css        all styling (theme tokens at the top)
src/data.js       ← all content, split into a CAREER and a LIFE half
src/main.js       app root, boot screen, cursor, easter eggs
src/sections.js   page sections + the two page layouts
src/scene.js      Three.js background (particle core, rings, stars)
src/globe.js      travel globe on the Life page
src/topthree.js   yearly Top 3 songs and games
src/terminal.js   hidden terminal
src/achievements.js  Steam-style achievements
src/github.js     live GitHub contribution graph
src/guestbook.js  giscus guestbook
src/i18n.js       language switcher + translator; src/i18n/*.js hold the translations
src/ui.js         shared helpers (scramble text, tilt cards, icons)
tools/serve.py    local preview server (no caching); also saves the link-preview image
tools/og.html     draws assets/og-image.jpg
```
