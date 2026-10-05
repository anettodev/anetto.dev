import { closeOthers, showWhenRevealed, unload } from "./side-media";
import { currentTheme, THEME_EVENT } from "./theme";

/*
 * <music-player>: the collapsed Apple Music bar under the identity card
 * (MusicPlayer.astro). Apple's embed frame gets its address when the bar
 * opens, so Apple's player (MusicKit, fonts) loads only for visitors who
 * want it, and loses it when the bar closes, so nothing plays out of sight
 * (the page can't pause Apple's player itself). Opening it closes the
 * podcasts container (one open at a time). The address carries the site's
 * theme (`theme=dark|light`, Apple's own option) and is swapped when the
 * theme changes, which reloads the player.
 */
class MusicPlayer extends HTMLElement {
  #details: HTMLDetailsElement | null = null;

  connectedCallback() {
    this.#details = this.querySelector("details");
    this.#details?.addEventListener("toggle", this.#onToggle);
    document.addEventListener(THEME_EVENT, this.#onTheme);
    showWhenRevealed(this);
  }

  disconnectedCallback() {
    this.#details?.removeEventListener("toggle", this.#onToggle);
    document.removeEventListener(THEME_EVENT, this.#onTheme);
  }

  #onToggle = () => {
    if (!this.#details) return;
    if (this.#details.open) {
      closeOthers(this.#details);
      this.#load();
    } else {
      this.classList.remove("is-loaded");
      unload(this.querySelector("iframe"));
    }
  };

  #onTheme = () => {
    if (this.#details?.open) this.#load();
  };

  #load() {
    const iframe = this.querySelector("iframe");
    if (!iframe || !this.dataset.src) return;
    const src = new URL(this.dataset.src);
    src.searchParams.set("theme", currentTheme());
    if (iframe.src === src.href) return;
    this.classList.remove("is-loaded");
    iframe.addEventListener("load", () => this.classList.add("is-loaded"), {
      once: true,
    });
    iframe.src = src.href;
  }
}

if (!customElements.get("music-player")) {
  customElements.define("music-player", MusicPlayer);
}
