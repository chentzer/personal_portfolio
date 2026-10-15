// Site languages. Text is written in English everywhere; t() swaps in a translation when one exists.
// Translations live in src/i18n/<code>.js as { "English text": "Translated text" }.
// If you edit English text in data.js, its old translation stops matching and the English shows
// until you update the translation file. Nothing breaks.
import ja from "./i18n/ja.js";
import zh from "./i18n/zh.js";
import ms from "./i18n/ms.js";

export const LANGS = [
  { code: "en", label: "EN", name: "English", html: "en" },
  { code: "ja", label: "日本語", name: "日本語", html: "ja" },
  { code: "zh", label: "中文", name: "中文", html: "zh-Hans" },
  { code: "ms", label: "BM", name: "Bahasa Melayu", html: "ms" },
];
const DICTS = { ja, zh, ms };
const KEY = "lct-lang";

function initial() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (LANGS.some((l) => l.code === fromUrl)) return fromUrl;
  try { const saved = localStorage.getItem(KEY); if (LANGS.some((l) => l.code === saved)) return saved; } catch {}
  return "en";
}

let lang = initial();
document.documentElement.lang = LANGS.find((l) => l.code === lang).html;

export const getLang = () => lang;

export function setLang(code) {
  if (code === lang || !LANGS.some((l) => l.code === code)) return;
  lang = code;
  document.documentElement.lang = LANGS.find((l) => l.code === code).html;
  try { localStorage.setItem(KEY, code); } catch {}
  // Keep the URL shareable (?lang=ja) without reloading.
  const url = new URL(location.href);
  if (code === "en") url.searchParams.delete("lang"); else url.searchParams.set("lang", code);
  history.replaceState(null, "", url);
  window.dispatchEvent(new CustomEvent("langchange", { detail: code }));
}

// Translate a string. Falls back to the English original.
export function t(str) {
  if (str == null || lang === "en") return str;
  const v = DICTS[lang]?.[str];
  return v === undefined ? str : v; // an empty translation is allowed (some languages drop a word)
}
