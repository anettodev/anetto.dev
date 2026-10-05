import { INTRO_REVEAL_EVENT } from "./prefs";
import { currentTheme, THEME_EVENT } from "./theme";

/*
 * <music-player>: Apple Music's embed frame under the identity card
 * (MusicPlayer.astro). The frame gets its address only once the page has
 * loaded and the browser is idle (on Home, once the intro reveals the
 * page), so Apple's player never competes with the page's first paint. The
 * address carries the site's theme (`theme=dark|light`, Apple's own option)
 * and is swapped when the theme changes, which reloads the player.
 */
/* Safari has no requestIdleCallback: a short timeout instead. */
const whenIdle = (callback: () => void) => {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(callback, { timeout: 2000 });
  } else {
    setTimeout(callback, 200);
  }
};

class MusicPlayer extends HTMLElement {
  connectedCallback() {
    const start = () =>
      whenIdle(() => {
        this.#load();
        document.addEventListener(THEME_EVENT, this.#load);
      });
    if (document.documentElement.dataset.intro === "play") {
      document.addEventListener(INTRO_REVEAL_EVENT, start, { once: true });
    } else if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start, { once: true });
    }
  }

  disconnectedCallback() {
    document.removeEventListener(THEME_EVENT, this.#load);
  }

  #load = () => {
    const iframe = this.querySelector("iframe");
    if (!iframe || !this.dataset.src) return;
    const src = new URL(this.dataset.src);
    src.searchParams.set("theme", currentTheme());
    if (iframe.src !== src.href) iframe.src = src.href;
    this.classList.add("is-on");
  };
}

if (!customElements.get("music-player")) {
  customElements.define("music-player", MusicPlayer);
}
