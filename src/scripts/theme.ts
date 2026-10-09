import { prefersReducedMotion, readPref, writePref } from "./prefs";

/*
 * Theme state lives on <html data-theme>. The inline script in Base.astro
 * sets it before first paint (spec §10); this module changes it afterwards.
 */
export type Theme = "light" | "dark";

const KEY = "anetto:theme";
export const THEME_EVENT = "anetto:theme";

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function storedTheme(): Theme | null {
  const value = readPref(KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function setTheme(theme: Theme, { persist = false } = {}): void {
  if (persist) writePref(KEY, theme);
  if (theme === currentTheme()) return;

  const apply = () => {
    document.documentElement.dataset.theme = theme;
    document.dispatchEvent(new CustomEvent(THEME_EVENT));
  };

  // 300ms crossfade (§8.5) where View Transitions exist; instant otherwise or with reduced motion.
  if (prefersReducedMotion() || !document.startViewTransition) {
    apply();
    return;
  }
  document.startViewTransition(apply);
}

// Follow the system setting until the visitor picks a theme.
matchMedia("(prefers-color-scheme: light)").addEventListener(
  "change",
  (event) => {
    if (!storedTheme()) setTheme(event.matches ? "light" : "dark");
  },
);
