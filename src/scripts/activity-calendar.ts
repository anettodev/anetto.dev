/*
 * <activity-calendar>: the calendar's one tooltip ("4 contributions on Jul 8,
 * 2026"). Days carry data-d (ISO date), data-c (count) and, optionally, data-n
 * (a note such as the day's cost); the messages come from the element's
 * data-zero / data-one / data-other, in its data-lang. data-compact formats
 * the count compactly (4.7M).
 * Hover only: the days aren't focusable, and each section carries the same
 * information as text.
 */
class ActivityCalendar extends HTMLElement {
  #tip: HTMLElement | null = null;
  #calendar: HTMLElement | null = null;
  #plural: Intl.PluralRules | null = null;
  #number: Intl.NumberFormat | null = null;
  #date: Intl.DateTimeFormat | null = null;

  connectedCallback() {
    const lang = this.dataset.lang;
    this.#plural = new Intl.PluralRules(lang);
    this.#number = new Intl.NumberFormat(
      lang,
      this.hasAttribute("data-compact")
        ? { notation: "compact", maximumFractionDigits: 1 }
        : {},
    );
    this.#date = new Intl.DateTimeFormat(lang, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    this.#tip = this.querySelector(".tip");
    this.#calendar = this.querySelector(".calendar");
    this.#calendar?.addEventListener("pointerover", this.#show);
    this.#calendar?.addEventListener("pointerleave", this.#hide);
  }

  disconnectedCallback() {
    this.#calendar?.removeEventListener("pointerover", this.#show);
    this.#calendar?.removeEventListener("pointerleave", this.#hide);
  }

  #message(count: number, iso: string, note: string): string {
    const key =
      count === 0
        ? "zero"
        : this.#plural?.select(count) === "one"
          ? "one"
          : "other";
    const template = this.dataset[key] ?? "";
    const date = new Date(`${iso}T00:00:00Z`);
    return template
      .replace("{n}", this.#number?.format(count) ?? String(count))
      .replace("{date}", this.#date?.format(date) ?? iso)
      .replace("{note}", note);
  }

  #show = (event: PointerEvent) => {
    const day = (event.target as Element).closest<HTMLElement>(".day");
    const tip = this.#tip;
    if (!day?.dataset.d || !tip) {
      this.#hide();
      return;
    }
    tip.textContent = this.#message(
      Number(day.dataset.c),
      day.dataset.d,
      day.dataset.n ?? "",
    );
    tip.hidden = false;

    // Centred over the day, but kept inside the calendar.
    const box = this.getBoundingClientRect();
    const cell = day.getBoundingClientRect();
    const half = tip.offsetWidth / 2;
    const centre = cell.left + cell.width / 2 - box.left;
    const left = Math.min(Math.max(centre, half + 8), box.width - half - 8);
    tip.style.left = `${left}px`;
    tip.style.top = `${cell.top - box.top}px`;
  };

  #hide = () => {
    if (this.#tip) this.#tip.hidden = true;
  };
}

if (!customElements.get("activity-calendar")) {
  customElements.define("activity-calendar", ActivityCalendar);
}
