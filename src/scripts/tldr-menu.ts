/*
 * <tldr-menu>: the TL;DR button's assistant menu (TldrButton.astro), a
 * native <details> that already opens and closes without JavaScript. This
 * adds Escape (focus back to the arrow), closing on a click outside, and
 * closing once an assistant is picked (it opens in a new tab).
 */
class TldrMenu extends HTMLElement {
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

  #close({ focusToggle = false } = {}) {
    if (!this.#details?.open) return;
    this.#details.open = false;
    if (focusToggle) this.querySelector("summary")?.focus();
  }

  #onKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !this.#details?.open) return;
    event.stopPropagation();
    this.#close({ focusToggle: true });
  };

  #onClick = (event: MouseEvent) => {
    if ((event.target as Element).closest(".tldr-menu a")) this.#close();
  };

  #onPointerdown = (event: PointerEvent) => {
    if (!this.contains(event.target as Node)) this.#close();
  };
}

if (!customElements.get("tldr-menu")) {
  customElements.define("tldr-menu", TldrMenu);
}
