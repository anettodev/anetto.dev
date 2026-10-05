/*
 * <ai-chart>: the AI usage card's chart controls.
 *
 *   view  the heatmap or usage over time: sets data-view (the style shows
 *         the matching view) and aria-pressed on the two buttons
 *   span  usage over time's days (7…360): shows the matching chart
 *         (UsageTrend's .range[data-range]) and presses its button
 *
 * Both choices are remembered in this browser only; without storage the card
 * starts on the heatmap, and the chart on 7 days, each time.
 */
const CHART_VIEW_KEY = "anetto.ai-chart-view";
const CHART_RANGE_KEY = "anetto.ai-chart-range";
const VIEWS = ["heatmap", "trend"];

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    // Storage blocked (private window, settings): use the defaults.
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the choice lasts until the page closes.
  }
};

class AiChart extends HTMLElement {
  #views: HTMLButtonElement[] = [];
  #ranges: HTMLButtonElement[] = [];

  connectedCallback() {
    this.#views = [
      ...this.querySelectorAll<HTMLButtonElement>("button[data-view]"),
    ];
    this.#ranges = [
      ...this.querySelectorAll<HTMLButtonElement>("button[data-range]"),
    ];
    const view = read(CHART_VIEW_KEY);
    if (view && VIEWS.includes(view)) this.#showView(view);
    const range = read(CHART_RANGE_KEY);
    if (range && this.#ranges.some((b) => b.dataset.range === range)) {
      this.#showRange(range);
    }
    for (const button of this.#views) {
      button.addEventListener("click", this.#onView);
    }
    for (const button of this.#ranges) {
      button.addEventListener("click", this.#onRange);
    }
  }

  disconnectedCallback() {
    for (const button of this.#views) {
      button.removeEventListener("click", this.#onView);
    }
    for (const button of this.#ranges) {
      button.removeEventListener("click", this.#onRange);
    }
  }

  #onView = (event: Event) => {
    const view = (event.currentTarget as HTMLButtonElement).dataset.view;
    if (!view) return;
    write(CHART_VIEW_KEY, view);
    this.#showView(view);
  };

  #onRange = (event: Event) => {
    const range = (event.currentTarget as HTMLButtonElement).dataset.range;
    if (!range) return;
    write(CHART_RANGE_KEY, range);
    this.#showRange(range);
  };

  #showView(view: string) {
    this.dataset.view = view;
    for (const button of this.#views) {
      button.setAttribute("aria-pressed", String(button.dataset.view === view));
    }
  }

  #showRange(range: string) {
    for (const button of this.#ranges) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.range === range),
      );
    }
    for (const chart of this.querySelectorAll<HTMLElement>(
      ".range[data-range]",
    )) {
      chart.hidden = chart.dataset.range !== range;
    }
  }
}

if (!customElements.get("ai-chart")) {
  customElements.define("ai-chart", AiChart);
}
