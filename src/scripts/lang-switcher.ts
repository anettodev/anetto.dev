import { writePref } from "./prefs";

/*
 * <lang-switcher>: enhances a native <details> menu of plain links, which
 * already works without JavaScript. Adds Escape (focus back to the pill),
 * click-outside to close, and remembers the choice (spec §9). Never redirects.
 */
export class LangSwitcher extends HTMLElement {
  #details: HTMLDetailsElement | null = null;

  connectedCallback() {
    this.#details = this.querySelector("details");
    this.addEventListener("keydown", this.#onKeydown);
    this.addEventListener("click", this.#onClick);
    document.addEventListener("pointerdown", this.#onPointerdown);
  }

  disconnectedCallback() {
    this.removeEventListener("keydown", this.#onKeydown);
    this.removeEventListener("click", this.#onClick);
    document.removeEventListener("pointerdown", this.#onPointerdown);
  }

  close({ focusPill = false } = {}) {
    if (!this.#details?.open) return;
    this.#details.open = false;
    if (focusPill) this.querySelector("summary")?.focus();
  }

  #onKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !this.#details?.open) return;
    // Only the menu closes; the island stays as it is.
    event.stopPropagation();
    this.close({ focusPill: true });
  };

  #onClick = (event: MouseEvent) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      "a[data-locale]",
    );
    if (link?.dataset.locale) writePref("anetto:lang", link.dataset.locale);
  };

  #onPointerdown = (event: PointerEvent) => {
    if (!this.contains(event.target as Node)) this.close();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "lang-switcher": LangSwitcher;
  }
}

if (!customElements.get("lang-switcher")) {
  customElements.define("lang-switcher", LangSwitcher);
}
