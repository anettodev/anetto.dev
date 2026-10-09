/*
 * <ai-trends>: the AI usage page's day pickers ("Last [7] days", one per
 * panel; TrendWindow.astro). Each share arrow carries data-w, the days it
 * covers; picking a window in any picker moves every picker to it and shows
 * only the arrows for it. The choice is remembered in this browser only;
 * without storage the page starts at the default each time.
 */
const TRENDS_KEY = "anetto.ai-trends-window";

class AiTrends extends HTMLElement {
  #selects: HTMLSelectElement[] = [];

  connectedCallback() {
    this.#selects = [...this.querySelectorAll("select")];
    const first = this.#selects[0];
    if (!first) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(TRENDS_KEY);
    } catch {
      // Storage blocked (private window, settings): keep the default.
    }
    const valid = [...first.options].some((option) => option.value === saved);
    this.#apply(saved && valid ? saved : first.value);
    for (const select of this.#selects) {
      select.addEventListener("change", this.#onChange);
    }
  }

  disconnectedCallback() {
    for (const select of this.#selects) {
      select.removeEventListener("change", this.#onChange);
    }
  }

  #onChange = (event: Event) => {
    const days = (event.currentTarget as HTMLSelectElement).value;
    try {
      localStorage.setItem(TRENDS_KEY, days);
    } catch {
      // Storage blocked: the choice lasts until the page closes.
    }
    this.#apply(days);
  };

  #apply(days: string) {
    for (const select of this.#selects) select.value = days;
    for (const arrow of this.querySelectorAll<HTMLElement>("[data-w]")) {
      arrow.hidden = arrow.dataset.w !== days;
    }
  }
}

if (!customElements.get("ai-trends")) {
  customElements.define("ai-trends", AiTrends);
}
