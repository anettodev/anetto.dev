/*
 * <github-activity>: the "Top contributions" button, which shows or hides the
 * full list of repositories. The calendar's tooltip is ActivityCalendar's.
 */
class GitHubActivity extends HTMLElement {
  #toggle: HTMLButtonElement | null = null;

  connectedCallback() {
    this.#toggle = this.querySelector(".toggle");
    this.#toggle?.addEventListener("click", this.#onToggle);
  }

  disconnectedCallback() {
    this.#toggle?.removeEventListener("click", this.#onToggle);
  }

  #onToggle = () => {
    const top = this.querySelector(".top");
    if (!top || !this.#toggle) return;
    const open = !top.hasAttribute("data-open");
    top.toggleAttribute("data-open", open);
    this.#toggle.setAttribute("aria-expanded", String(open));
  };
}

if (!customElements.get("github-activity")) {
  customElements.define("github-activity", GitHubActivity);
}
