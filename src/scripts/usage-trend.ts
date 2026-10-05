/*
 * <usage-trend>: the usage-over-time charts' hover. Each span (.range) holds
 * its data in data-points: the kind of point ("Daily", "7-day average"), the
 * band names and one row per point ([date, ...values]). Pointing at a plot
 * shows a guide line at the nearest point and a tooltip with each band's
 * value (largest first, zeros left out) and the total. Text only goes in
 * through textContent. Hover only: each chart's label and legend carry the
 * span and the bands as text.
 */
type Points = { kind: string; bands: string[]; points: (string | number)[][] };

class UsageTrend extends HTMLElement {
  #number: Intl.NumberFormat | null = null;
  #date: Intl.DateTimeFormat | null = null;
  #cleanup: (() => void)[] = [];

  connectedCallback() {
    const lang = this.dataset.lang;
    this.#number = new Intl.NumberFormat(lang, {
      notation: "compact",
      maximumSignificantDigits: 3,
    });
    this.#date = new Intl.DateTimeFormat(lang, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    for (const range of this.querySelectorAll<HTMLElement>(".range")) {
      this.#watch(range);
    }
  }

  disconnectedCallback() {
    for (const stop of this.#cleanup) stop();
    this.#cleanup = [];
  }

  #watch(range: HTMLElement) {
    let data: Points;
    try {
      data = JSON.parse(range.dataset.points ?? "") as Points;
    } catch {
      return;
    }
    const plot = range.querySelector<HTMLElement>(".plot");
    const guide = range.querySelector<HTMLElement>(".guide");
    const tip = range.querySelector<HTMLElement>(".trend-tip");
    if (!plot || !guide || !tip || data.points.length === 0) return;

    const show = (event: PointerEvent) =>
      this.#show(event, range, data, plot, guide, tip);
    const hide = () => {
      tip.hidden = true;
      guide.hidden = true;
    };
    plot.addEventListener("pointermove", show);
    plot.addEventListener("pointerleave", hide);
    this.#cleanup.push(() => {
      plot.removeEventListener("pointermove", show);
      plot.removeEventListener("pointerleave", hide);
    });
  }

  /* A band's colour, as its legend swatch resolves it (theme included). */
  #color(range: HTMLElement, band: number) {
    const item = range.querySelectorAll(".legend li")[band];
    return item ? getComputedStyle(item).getPropertyValue("--band").trim() : "";
  }

  #row(color: string, name: string, value: string, className = "tip-row") {
    const row = document.createElement("div");
    row.className = className;
    const label = document.createElement("span");
    if (color) {
      const dot = document.createElement("span");
      dot.className = "tip-dot";
      dot.style.background = color;
      label.append(dot);
    }
    label.append(name);
    const amount = document.createElement("span");
    amount.textContent = value;
    row.append(label, amount);
    return row;
  }

  #show(
    event: PointerEvent,
    range: HTMLElement,
    data: Points,
    plot: HTMLElement,
    guide: HTMLElement,
    tip: HTMLElement,
  ) {
    const box = plot.getBoundingClientRect();
    const last = data.points.length - 1;
    const ratio = Math.min(
      Math.max((event.clientX - box.left) / box.width, 0),
      1,
    );
    const index = last > 0 ? Math.round(ratio * last) : 0;
    const point = data.points[index];
    if (!point) return;
    const [date, ...values] = point as [string, ...number[]];
    const x = last > 0 ? (index / last) * box.width : box.width / 2;
    guide.style.left = `${x}px`;
    guide.hidden = false;

    const head = document.createElement("div");
    head.className = "tip-head";
    const day = document.createElement("span");
    day.textContent =
      this.#date?.format(new Date(`${date}T00:00:00Z`)) ?? String(date);
    const kind = document.createElement("span");
    kind.textContent = data.kind;
    head.append(day, kind);

    const rows = data.bands
      .map((name, band) => ({ name, band, value: values[band] ?? 0 }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((row) =>
        this.#row(
          this.#color(range, row.band),
          row.name,
          this.#number?.format(row.value) ?? String(row.value),
        ),
      );
    const total = values.reduce((n, v) => n + v, 0);
    tip.replaceChildren(
      head,
      ...rows,
      this.#row(
        "",
        this.dataset.total ?? "",
        this.#number?.format(total) ?? String(total),
        "tip-total",
      ),
    );
    tip.hidden = false;

    // Beside the guide, on whichever side has room.
    const width = tip.offsetWidth;
    const left =
      x + 12 + width < box.width ? x + 12 : Math.max(0, x - 12 - width);
    tip.style.left = `${left}px`;
  }
}

if (!customElements.get("usage-trend")) {
  customElements.define("usage-trend", UsageTrend);
}
