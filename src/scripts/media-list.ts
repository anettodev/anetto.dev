import { closeOthers, showWhenRevealed, unload } from "./side-media";
import { currentTheme, THEME_EVENT } from "./theme";

/*
 * <media-list>: the list-then-player containers under the identity card
 * (MediaList.astro: the Spotify podcasts, the YouTube playlist). Opening
 * one closes the others (one open at a time) and shows its list; picking
 * an item swaps the list for the service's embed of it (`data-embed`, its
 * `{id}` replaced), with a back button and a link under the player: to the
 * picked item on the service, unless `data-more="fixed"` keeps its own
 * address. `data-dark` ("key=value", e.g. Spotify's `theme=0`) is added in
 * the site's dark theme, and the player reloads when the theme changes.
 * Going back or closing the container unloads the player, so nothing
 * plays out of sight. While the data is mock, the player is a placeholder.
 */
class MediaList extends HTMLElement {
  #details: HTMLDetailsElement | null = null;
  #list: HTMLElement | null = null;
  #player: HTMLElement | null = null;
  #itemId = "";
  #row: HTMLButtonElement | null = null;

  connectedCallback() {
    this.#details = this.querySelector("details");
    this.#list = this.querySelector(".item-list");
    this.#player = this.querySelector(".item-player");
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
    const row = target.closest<HTMLButtonElement>(".item-row");
    if (row) {
      this.#play(row);
      return;
    }
    if (target.closest(".item-back")) this.#showList({ focus: true });
  };

  // Only a player that follows the theme reloads (a video would restart).
  #onTheme = () => {
    if (this.#itemId && this.dataset.dark) this.#load();
  };

  #play(row: HTMLButtonElement) {
    this.#row = row;
    this.#itemId = row.dataset.id ?? "";
    if (this.#list) this.#list.hidden = true;
    if (this.#player) this.#player.hidden = false;
    const more = this.querySelector<HTMLAnchorElement>(".item-more");
    if (more && this.dataset.more !== "fixed" && row.dataset.link) {
      more.href = row.dataset.link;
    }
    this.#load();
    this.querySelector<HTMLButtonElement>(".item-back")?.focus();
  }

  #showList({ focus }: { focus: boolean }) {
    this.#itemId = "";
    unload(this.querySelector("iframe"));
    if (this.#player) this.#player.hidden = true;
    if (this.#list) this.#list.hidden = false;
    if (focus) this.#row?.focus();
  }

  #load() {
    const iframe = this.querySelector("iframe");
    const embed = this.dataset.embed;
    if (!iframe || !embed || !this.#itemId || this.dataset.mock !== undefined) {
      return;
    }
    const src = new URL(
      embed.replace("{id}", encodeURIComponent(this.#itemId)),
    );
    const [key, value] = (this.dataset.dark ?? "").split("=");
    if (key && value !== undefined && currentTheme() === "dark") {
      src.searchParams.set(key, value);
    }
    iframe.title = (this.dataset.title ?? "{name}").replace(
      "{name}",
      this.#row?.dataset.name ?? "",
    );
    if (iframe.src !== src.href) iframe.src = src.href;
  }
}

if (!customElements.get("media-list")) {
  customElements.define("media-list", MediaList);
}
