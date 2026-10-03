/**
 * Visitor preferences. Storage can throw (private mode, blocked site data),
 * so every access is guarded and a missing value means "no preference".
 */
export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the choice applies to this page only.
  }
}

export function prefersReducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True when `el` takes part in layout (not display:none, not inside a closed ancestor). */
export function isRendered(el: Element | null): boolean {
  return el instanceof HTMLElement && el.checkVisibility();
}
