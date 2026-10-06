import { closeOthers, showWhenRevealed, unload } from "./side-media";
import { currentTheme, THEME_EVENT } from "./theme";

/*
 * <podcasts-player>: the collapsed podcasts container above the playlist
 * (PodcastsPlayer.astro). Opening it closes the playlist (one open at a
 * time) and shows the list of shows; picking one swaps the list for
 * Spotify's embed of that show (`open.spotify.com/embed/show/<id>`, dark
 * with `theme=0` in the site's dark theme), with a back button and a link
 * to the show on Spotify, whose player shows only the newest episode. Going back
 * or closing the container unloads the player, so nothing plays out of
 * sight. While the data is mock, the player is a placeholder.
 */
const EMBED = "https://open.spotify.com/embed/show/";

class PodcastsPlayer extends HTMLElement {
  #details: HTMLDetailsElement | null = null;
  #list: HTMLElement | null = null;
  #player: HTMLElement | null = null;
  #showId = "";
  #row: HTMLButtonElement | null = null;

  connectedCallback() {
    this.#details = this.querySelector("details");
    this.#list = this.querySelector(".pod-list");
    this.#player = this.querySelector(".pod-player");
    this.#details?.addEventListener("toggle", this.#onToggle);
    this.addEventListener("click", this.#onClick);
    document.addEventListener(THEME_EVENT, this.#onTheme);
    showWhenRevealed(this);
  }

  disconnectedCallback() {
    this.#details?.removeEventListener("toggle", this.#onToggle);
    this.removeEventListener("click", this.#onClick);
    document.removeEventListener(THEME_EVENT, this.#onTheme);
  }

  #onToggle = () => {
    if (!this.#details) return;
    if (this.#details.open) closeOthers(this.#details);
    else this.#showList({ focus: false });
  };

  #onClick = (event: MouseEvent) => {
    const target = event.target as Element;
    const row = target.closest<HTMLButtonElement>(".pod-row");
    if (row) {
      this.#play(row);
      return;
    }
    if (target.closest(".pod-back")) this.#showList({ focus: true });
  };

  #onTheme = () => {
    if (this.#showId) this.#load();
  };

  #play(row: HTMLButtonElement) {
    this.#row = row;
    this.#showId = row.dataset.id ?? "";
    if (this.#list) this.#list.hidden = true;
    if (this.#player) this.#player.hidden = false;
    const more = this.querySelector<HTMLAnchorElement>(".pod-more");
    if (more && row.dataset.link) more.href = row.dataset.link;
    this.#load();
    this.querySelector<HTMLButtonElement>(".pod-back")?.focus();
  }

  #showList({ focus }: { focus: boolean }) {
    this.#showId = "";
    unload(this.querySelector("iframe"));
    if (this.#player) this.#player.hidden = true;
    if (this.#list) this.#list.hidden = false;
    if (focus) this.#row?.focus();
  }

  #load() {
    const iframe = this.querySelector("iframe");
    if (!iframe || !this.#showId || this.dataset.mock !== undefined) return;
    const src = new URL(`${EMBED}${encodeURIComponent(this.#showId)}`);
    src.searchParams.set("utm_source", "generator");
    if (currentTheme() === "dark") src.searchParams.set("theme", "0");
    iframe.title = (this.dataset.title ?? "{show}").replace(
      "{show}",
      this.#row?.dataset.name ?? "",
    );
    if (iframe.src !== src.href) iframe.src = src.href;
  }
}

if (!customElements.get("podcasts-player")) {
  customElements.define("podcasts-player", PodcastsPlayer);
}
