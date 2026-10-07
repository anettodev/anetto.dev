/*
 * <share-button> (ShareButton.astro): shows itself once this runs, then on
 * click opens the device's share sheet with the page's title and public
 * address. Where the Web Share API is missing (Firefox on desktop, for
 * one), it copies the address instead, swaps the icon for a check and the
 * label for "Link copied" for two seconds, and says so to screen readers.
 * Cancelling the share sheet is not an error.
 */
const FEEDBACK_MS = 2000;

class ShareButton extends HTMLElement {
  #button: HTMLButtonElement | null = null;
  #timer = 0;

  connectedCallback() {
    this.#button = this.querySelector("button");
    this.#button?.addEventListener("click", this.#onClick);
    this.hidden = false;
  }

  disconnectedCallback() {
    this.#button?.removeEventListener("click", this.#onClick);
    window.clearTimeout(this.#timer);
  }

  #onClick = async () => {
    const url = this.dataset.url ?? location.href;
    const data = { title: this.dataset.title ?? document.title, url };
    if (navigator.share && (navigator.canShare?.(data) ?? true)) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if ((error as DOMException).name === "AbortError") return;
        // Any other failure: copy the address instead.
      }
    }
    if (await copy(url)) this.#confirm();
  };

  #confirm() {
    const label = this.querySelector<HTMLElement>(".share-label");
    const icon = this.querySelector<HTMLElement>(".share-icon");
    const done = this.querySelector<HTMLElement>(".share-done");
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

/** Copies text; the clipboard API needs a secure page, the fallback doesn't. */
async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    // Deprecated, but the only way left to copy without the clipboard API.
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  }
}

if (!customElements.get("share-button")) {
  customElements.define("share-button", ShareButton);
}
