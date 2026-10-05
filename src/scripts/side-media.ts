import { INTRO_REVEAL_EVENT } from "./prefs";

/*
 * Shared by the containers under the identity card (music-player.ts,
 * podcasts-player.ts; styles/media-bar.css).
 */

/** Shows a container (.is-on): at once, or on Home once the intro reveals the page. */
export function showWhenRevealed(element: HTMLElement): void {
  const show = () => element.classList.add("is-on");
  if (document.documentElement.dataset.intro === "play") {
    document.addEventListener(INTRO_REVEAL_EVENT, show, { once: true });
  } else {
    show();
  }
}

/*
 * Only one container open at a time. Their <details> share
 * `name="side-media"`, which browsers that know the attribute enforce
 * themselves; for the others, opening one closes the rest here.
 */
const exclusiveNatively = "name" in HTMLDetailsElement.prototype;

export function closeOthers(details: HTMLDetailsElement): void {
  if (exclusiveNatively || !details.open) return;
  for (const other of document.querySelectorAll<HTMLDetailsElement>(
    'details[name="side-media"][open]',
  )) {
    if (other !== details) other.open = false;
  }
}

/** Stops an embedded player for good: the frame drops its page. */
export function unload(iframe: HTMLIFrameElement | null): void {
  if (iframe?.getAttribute("src")) iframe.removeAttribute("src");
}
