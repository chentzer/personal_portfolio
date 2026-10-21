// Hidden content: anything in data.js tagged `hidden: "games"` or `hidden: "anime"` stays off the
// site until a visitor types that group's command in the terminal (see `hiddenContent` in data.js).
// Typing it again hides it. Unlocks last for the browser tab (sessionStorage), so a new visit
// starts hidden again.
import { hiddenContent } from "./data.js";

const KEY = "lct-unlocked";
const load = () => { try { return new Set(JSON.parse(sessionStorage.getItem(KEY) || "[]")); } catch { return new Set(); } };
let shown = load();

export const isShown = (group) => !group || shown.has(group);
export const visible = (items) => items.filter((i) => isShown(i.hidden));

// The group a typed terminal word unlocks, if any.
export const groupFor = (word) =>
  Object.keys(hiddenContent).find((g) => hiddenContent[g] && hiddenContent[g].toLowerCase() === String(word).toLowerCase());

export function toggleGroup(group) {
  if (shown.has(group)) shown.delete(group); else shown.add(group);
  try { sessionStorage.setItem(KEY, JSON.stringify([...shown])); } catch {}
  window.dispatchEvent(new CustomEvent("hiddenchange"));
  return shown.has(group);
}

// Text that mentions hidden hobbies: { both, games, anime, none } → the version for what's unlocked.
export function pickText(v) {
  if (typeof v === "string") return v;
  const g = isShown("games"), a = isShown("anime");
  return v[g && a ? "both" : g ? "games" : a ? "anime" : "none"];
}
