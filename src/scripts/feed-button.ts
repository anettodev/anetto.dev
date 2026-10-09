/*
 * <feed-button> (FeedButton.astro): browsers no longer subscribe from a
 * feed link (they show the XML), so a plain click copies the feed's
 * address for a feed reader instead, swaps the icon for a check and the
 * label for "Feed address copied" for two seconds, and says so to screen
 * readers. A click with a modifier key, or the middle button, still opens
 * the feed, and so does the link without JavaScript.
 */
import { copy } from "./clipboard";

const FEEDBACK_MS = 2000;

class FeedButton extends HTMLElement {
  #link: HTMLAnchorElement | null = null;
  #timer = 0;

  connectedCallback() {
    this.#link = this.querySelector("a");
    this.#link?.addEventListener("click", this.#onClick);
  }

  disconnectedCallback() {
    this.#link?.removeEventListener("click", this.#onClick);
    window.clearTimeout(this.#timer);
  }

  #onClick = async (event: MouseEvent) => {
    const link = this.#link;
    if (!link) return;
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (await copy(link.href)) this.#confirm();
    else location.href = link.href;
  };

  #confirm() {
    const label = this.querySelector<HTMLElement>(".feed-label");
    const icon = this.querySelector<HTMLElement>(".feed-icon");
    const done = this.querySelector<HTMLElement>(".feed-done");
    const status = this.querySelector<HTMLElement>("[role=status]");
    const copied = this.dataset.copied ?? "";
    const original = label?.dataset.original ?? label?.textContent ?? "";
    if (label) {
      label.dataset.original = original;
      label.textContent = copied;
    }
    if (icon) icon.hidden = true;
    if (done) done.hidden = false;
    if (status) status.textContent = copied;
    window.clearTimeout(this.#timer);
    this.#timer = window.setTimeout(() => {
      if (label) label.textContent = original;
      if (icon) icon.hidden = false;
      if (done) done.hidden = true;
      if (status) status.textContent = "";
    }, FEEDBACK_MS);
  }
}

if (!customElements.get("feed-button")) {
  customElements.define("feed-button", FeedButton);
}
