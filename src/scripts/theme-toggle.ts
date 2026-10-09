import { currentTheme, setTheme, THEME_EVENT } from "./theme";

/** <theme-toggle>: wraps a server-rendered <button>; keeps its label in step with the theme. */
class ThemeToggle extends HTMLElement {
  #button: HTMLButtonElement | null = null;

  connectedCallback() {
    this.#button = this.querySelector("button");
    this.#button?.addEventListener("click", this.#onClick);
    document.addEventListener(THEME_EVENT, this.#sync);
    this.#sync();
  }

  disconnectedCallback() {
    this.#button?.removeEventListener("click", this.#onClick);
    document.removeEventListener(THEME_EVENT, this.#sync);
  }

  #onClick = () => {
    setTheme(currentTheme() === "dark" ? "light" : "dark", { persist: true });
  };

  #sync = () => {
    const label =
      currentTheme() === "dark"
        ? this.dataset.labelToLight
        : this.dataset.labelToDark;
    if (label) this.#button?.setAttribute("aria-label", label);
  };
}

if (!customElements.get("theme-toggle")) {
  customElements.define("theme-toggle", ThemeToggle);
}
