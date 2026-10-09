/*
 * <filter-list>: search, filters, sort and pages over the items already in
 * the page.
 *
 *   items    every [data-item] inside: data-title (sort by title), data-date
 *            (ISO; sort by date), and one data-<filter> per filter, values
 *            joined by "|". Their [data-search] parts are what the search
 *            reads
 *   search   `.search input`: matches as you type, ignoring case and
 *            accents ("conversao" finds "conversão")
 *   filters  each [data-filter="<name>"]: a group of buttons (chips, one
 *            pressed, data-value) or a <select>; "all" lets everything
 *            through
 *   sort     `.sort button[data-sort]`, "date" (newest first; again for
 *            oldest) or "title" (A–Z; again for Z–A). The items move in
 *            the page, so reading order matches the screen. Ties keep the
 *            page's own order; an item without the value (a placeholder)
 *            stays last either way
 *   pages    `.per-page select` (the host's data-per-page first, then
 *            whatever this browser picked last), previous / next and up to
 *            seven page numbers (lib/page-list.ts)
 *
 * They combine, and any change but the page goes back to page 1. A status
 * line ("Showing 1–10 of 13", aria-live) says what's on screen; with no
 * match a message shows instead. The host's data-sort is the starting order
 * ("date:desc"), data-store names what this browser remembers (sort and
 * page size). Without JavaScript none of this shows and every item does.
 * Bookmarks, the Projects page's "All projects" and the Blog page use it.
 */
import { fillPages } from "../lib/page-list";

type SortKey = "date" | "title";
type SortDir = "asc" | "desc";

interface Item {
  el: HTMLElement;
  index: number;
  text: string;
  title: string;
  date: string;
  values: Map<string, string[]>;
}

const load = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // Storage blocked: defaults.
  }
};

const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the choice lasts until the page closes.
  }
};

const fold = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const isKey = (key: unknown): key is SortKey =>
  key === "date" || key === "title";
const isDir = (dir: unknown): dir is SortDir => dir === "asc" || dir === "desc";
const defaultDir = (key: SortKey): SortDir => (key === "date" ? "desc" : "asc");

class FilterList extends HTMLElement {
  #items: Item[] = [];
  #list: HTMLElement | null = null;
  /* Whatever follows the items in their list (a dev-only card) stays last. */
  #tail: Element | null = null;
  #filters: HTMLElement[] = [];
  #sortButtons: HTMLButtonElement[] = [];
  #sortKey: SortKey = "date";
  #sortDir: SortDir = "desc";
  #steps: HTMLButtonElement[] = [];
  #input: HTMLInputElement | null = null;
  #perPageSelect: HTMLSelectElement | null = null;
  #pager: HTMLElement | null = null;
  #pages: HTMLElement | null = null;
  #status: HTMLElement | null = null;
  #noMatch: HTMLElement | null = null;
  #query = "";
  #page = 1;

  get #store() {
    return this.dataset.store ?? "list";
  }

  connectedCallback() {
    const filterNames = [
      ...this.querySelectorAll<HTMLElement>("[data-filter]"),
    ].map((el) => el.dataset.filter ?? "");
    this.#items = [...this.querySelectorAll<HTMLElement>("[data-item]")].map(
      (el, index) => ({
        el,
        index,
        text: fold(
          [...el.querySelectorAll("[data-search]")]
            .map((part) => part.textContent ?? "")
            .join(" "),
        ),
        title: el.dataset.title ?? "",
        date: el.dataset.date ?? "",
        values: new Map(
          filterNames.map((name) => [
            name,
            (el.dataset[name] ?? "").split("|").filter(Boolean),
          ]),
        ),
      }),
    );
    const last = this.#items.at(-1)?.el;
    this.#list = last?.parentElement ?? null;
    this.#tail = last?.nextElementSibling ?? null;

    this.#filters = [...this.querySelectorAll<HTMLElement>("[data-filter]")];
    this.#sortButtons = [
      ...this.querySelectorAll<HTMLButtonElement>(".sort button[data-sort]"),
    ];
    const keys = this.#sortButtons.map((button) => button.dataset.sort);
    const [savedKey, savedDir] = (
      load(`anetto.${this.#store}-sort`) ??
      this.dataset.sort ??
      ""
    ).split(":");
    const [startKey, startDir] = (this.dataset.sort ?? "").split(":");
    if (isKey(savedKey) && isDir(savedDir) && keys.includes(savedKey)) {
      this.#sortKey = savedKey;
      this.#sortDir = savedDir;
    } else if (isKey(startKey)) {
      this.#sortKey = startKey;
      this.#sortDir = isDir(startDir) ? startDir : defaultDir(startKey);
    }

    this.#steps = [
      ...this.querySelectorAll<HTMLButtonElement>(".pager button[data-step]"),
    ];
    this.#input = this.querySelector(".search input");
    this.#perPageSelect = this.querySelector(".per-page select");
    const saved = load(`anetto.${this.#store}-per-page`);
    const select = this.#perPageSelect;
    if (select && saved && [...select.options].some((o) => o.value === saved)) {
      select.value = saved;
    }
    this.#pager = this.querySelector(".pager");
    this.#pages = this.querySelector(".pager .pages");
    this.#status = this.querySelector(".status");
    this.#noMatch = this.querySelector(".no-match");

    for (const filter of this.#filters) {
      filter.addEventListener(
        filter instanceof HTMLSelectElement ? "change" : "click",
        this.#onFilter,
      );
    }
    for (const step of this.#steps) {
      step.addEventListener("click", this.#onStep);
    }
    this.#pages?.addEventListener("click", this.#onPage);
    this.#input?.addEventListener("input", this.#onInput);
    this.#perPageSelect?.addEventListener("change", this.#onPerPage);
    for (const button of this.#sortButtons) {
      button.addEventListener("click", this.#onSort);
    }
    this.#sort();
    this.#render();
  }

  disconnectedCallback() {
    for (const filter of this.#filters) {
      filter.removeEventListener("change", this.#onFilter);
      filter.removeEventListener("click", this.#onFilter);
    }
    for (const step of this.#steps) {
      step.removeEventListener("click", this.#onStep);
    }
    this.#pages?.removeEventListener("click", this.#onPage);
    this.#input?.removeEventListener("input", this.#onInput);
    this.#perPageSelect?.removeEventListener("change", this.#onPerPage);
    for (const button of this.#sortButtons) {
      button.removeEventListener("click", this.#onSort);
    }
  }

  /* ---------- Sort ---------- */

  /* The pressed button flips its order; another starts at its default. */
  #onSort = (event: Event) => {
    const key = (event.currentTarget as HTMLButtonElement).dataset.sort;
    if (!isKey(key)) return;
    if (key === this.#sortKey) {
      this.#sortDir = this.#sortDir === "asc" ? "desc" : "asc";
    } else {
      this.#sortKey = key;
      this.#sortDir = defaultDir(key);
    }
    save(`anetto.${this.#store}-sort`, `${this.#sortKey}:${this.#sortDir}`);
    this.#sort();
    this.#page = 1;
    this.#render();
  };

  /* Orders the items (and the list itself), then labels the buttons. */
  #sort() {
    const collator = new Intl.Collator(document.documentElement.lang, {
      sensitivity: "base",
      numeric: true,
    });
    const sign = this.#sortDir === "asc" ? 1 : -1;
    this.#items.sort((a, b) => {
      const [x, y] =
        this.#sortKey === "title" ? [a.title, b.title] : [a.date, b.date];
      if (!x !== !y) return x ? -1 : 1;
      const order =
        this.#sortKey === "title" ? collator.compare(x, y) : x.localeCompare(y);
      return order * sign || a.index - b.index;
    });
    const list = this.#list;
    if (list) {
      for (const item of this.#items) list.insertBefore(item.el, this.#tail);
    }

    const words = this.querySelector<HTMLElement>(".sort")?.dataset ?? {};
    for (const button of this.#sortButtons) {
      const key = button.dataset.sort;
      if (!isKey(key)) continue;
      const active = key === this.#sortKey;
      // What this button shows: its current direction, or its default.
      const dir = active ? this.#sortDir : defaultDir(key);
      button.setAttribute("aria-pressed", String(active));
      const arrow = button.querySelector(".dir");
      if (arrow) {
        arrow.textContent =
          key === "date"
            ? dir === "desc"
              ? "↓"
              : "↑"
            : dir === "asc"
              ? "A–Z"
              : "Z–A";
      }
      const name = (key === "date" ? words.sortDate : words.sortTitle) ?? key;
      const spoken =
        key === "date"
          ? dir === "desc"
            ? words.newest
            : words.oldest
          : dir === "asc"
            ? words.az
            : words.za;
      button.setAttribute(
        "aria-label",
        (words.spoken ?? "{key}, {dir}")
          .replace("{key}", name.toLocaleLowerCase())
          .replace("{dir}", spoken ?? ""),
      );
    }
  }

  /* ---------- Filters, search, pages ---------- */

  #onFilter = (event: Event) => {
    const filter = event.currentTarget as HTMLElement;
    if (!(filter instanceof HTMLSelectElement)) {
      const chip = (event.target as Element).closest<HTMLButtonElement>(
        "button[data-value]",
      );
      if (!chip) return;
      for (const button of filter.querySelectorAll("button[data-value]")) {
        button.setAttribute("aria-pressed", String(button === chip));
      }
    }
    this.#page = 1;
    this.#render();
  };

  /* Each filter's current value; "all" for none. */
  #filterValues() {
    return this.#filters.map((filter) => {
      const value =
        filter instanceof HTMLSelectElement
          ? filter.value
          : (filter.querySelector<HTMLElement>(
              'button[data-value][aria-pressed="true"]',
            )?.dataset.value ?? "all");
      return [filter.dataset.filter ?? "", value] as const;
    });
  }

  get #perPage() {
    return (
      Number(this.#perPageSelect?.value) || Number(this.dataset.perPage) || 10
    );
  }

  #onPerPage = () => {
    if (this.#perPageSelect) {
      save(`anetto.${this.#store}-per-page`, this.#perPageSelect.value);
    }
    this.#page = 1;
    this.#render();
  };

  #onInput = () => {
    this.#query = fold(this.#input?.value.trim() ?? "");
    this.#page = 1;
    this.#render();
  };

  #onStep = (event: Event) => {
    const step = Number(
      (event.currentTarget as HTMLButtonElement).dataset.step,
    );
    this.#goTo(this.#page + step);
  };

  #onPage = (event: Event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "button[data-page]",
    );
    if (button) this.#goTo(Number(button.dataset.page));
  };

  /* A new page starts at the top of the list, not wherever the pager was. */
  #goTo(page: number) {
    this.#page = page;
    this.#render();
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    (this.#status ?? this).scrollIntoView({
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }

  #render() {
    const filters = this.#filterValues().filter(([, value]) => value !== "all");
    const matches = this.#items.filter(
      (item) =>
        filters.every(([name, value]) =>
          item.values.get(name)?.includes(value),
        ) &&
        (!this.#query || item.text.includes(this.#query)),
    );
    const perPage = this.#perPage;
    const pages = Math.max(1, Math.ceil(matches.length / perPage));
    this.#page = Math.min(Math.max(1, this.#page), pages);
    const first = (this.#page - 1) * perPage;
    const shown = new Set(matches.slice(first, first + perPage));
    for (const item of this.#items) item.el.hidden = !shown.has(item);

    if (this.#status) {
      this.#status.textContent = matches.length
        ? (this.dataset.results ?? "")
            .replace("{from}", String(first + 1))
            .replace("{to}", String(first + shown.size))
            .replace("{total}", String(matches.length))
        : "";
    }
    if (this.#noMatch) this.#noMatch.hidden = matches.length > 0;

    if (this.#pager) this.#pager.hidden = pages <= 1;
    const [prev, next] = this.#steps;
    if (prev) prev.disabled = this.#page <= 1;
    if (next) next.disabled = this.#page >= pages;
    if (this.#pages) {
      fillPages(
        this.#pages,
        this.#page,
        pages,
        this.dataset.pageLabel ?? "{n}",
      );
    }
  }
}

if (!customElements.get("filter-list")) {
  customElements.define("filter-list", FilterList);
}
