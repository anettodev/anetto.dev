/*
 * The page numbers to show: every page up to 7; beyond that the first, the
 * last and the current with its neighbours, with "gap" for the pages left
 * out. Near either end the run stretches to four, so it's always seven
 * slots: 1 2 3 4 … 10 · 1 … 4 5 6 … 10 · 1 … 7 8 9 10. A gap of one page
 * shows that page instead of "…".
 */
export function pageList(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => keep.add(page));
  if (current >= total - 2) {
    [total - 3, total - 2, total - 1].forEach((page) => keep.add(page));
  }
  const sorted = [...keep]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const list: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && page - previous === 2) list.push(page - 1);
    else if (previous !== undefined && page - previous > 2) list.push("gap");
    list.push(page);
  });
  return list;
}

/*
 * Fills a pager's number strip (Pager.astro's `.pages`): a button per
 * shown page (data-page; "Page n" from `pageLabel`'s {n}; aria-current on
 * the current one) and a hidden-to-screen-readers "…" per gap.
 */
export function fillPages(
  container: HTMLElement,
  current: number,
  total: number,
  pageLabel: string,
) {
  container.replaceChildren(
    ...pageList(current, total).map((page) => {
      if (page === "gap") {
        const gap = document.createElement("span");
        gap.className = "gap";
        gap.setAttribute("aria-hidden", "true");
        gap.textContent = "…";
        return gap;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.page = String(page);
      button.textContent = String(page);
      button.setAttribute("aria-label", pageLabel.replace("{n}", String(page)));
      if (page === current) button.setAttribute("aria-current", "page");
      return button;
    }),
  );
}
