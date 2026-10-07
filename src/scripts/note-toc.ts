/*
 * The note page's "On this page" (pages/[...lang]/blog/[slug].astro): marks
 * the entry of the section being read with aria-current as the page
 * scrolls. A section is current once its heading has passed under the
 * island (the nav clearance); before the first heading, none is, and at
 * the very bottom the last one is, however short it is. Where the summary
 * scrolls on its own, the current entry is kept in view.
 *
 * It also adds .is-ready to the note after the first paint, so the
 * collapse animation never plays on load, and remembers whether the reader
 * collapsed the side column (localStorage "note-toc"), which the page's
 * inline script reads before paint. The closed box on narrow screens isn't
 * remembered: it always starts closed.
 */
const toc = document.querySelector<HTMLElement>(".toc");

if (toc) {
  const pairs = [...toc.querySelectorAll<HTMLAnchorElement>(".toc-entry a")]
    .map((link) => ({
      link,
      heading: document.getElementById(decodeURIComponent(link.hash.slice(1))),
    }))
    .filter((pair): pair is { link: HTMLAnchorElement; heading: HTMLElement } =>
      Boolean(pair.heading),
    );
  const clearance =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--nav-clearance",
      ),
    ) || 104;
  let current = -2;
  let frame = 0;

  const update = () => {
    frame = 0;
    const root = document.documentElement;
    const atBottom =
      window.innerHeight + window.scrollY >= root.scrollHeight - 2;
    let index = atBottom ? pairs.length - 1 : -1;
    if (!atBottom) {
      pairs.forEach(({ heading }, i) => {
        if (heading.getBoundingClientRect().top <= clearance + 8) index = i;
      });
    }
    if (index === current) return;
    current = index;
    pairs.forEach(({ link }, i) => {
      if (i === index) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    const active = pairs[index]?.link;
    if (active && toc.scrollHeight > toc.clientHeight) {
      // The sticky summary is the link's offset parent.
      const top = active.offsetTop;
      if (top < toc.scrollTop || top > toc.scrollTop + toc.clientHeight - 40) {
        toc.scrollTop = top - toc.clientHeight / 3;
      }
    }
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  update();

  const body = toc.closest(".note-body");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => body?.classList.add("is-ready")),
  );

  const details = toc.querySelector("details");
  const main = document.querySelector("main");
  details?.addEventListener("toggle", () => {
    if ((main?.clientWidth ?? 0) < 860) return;
    try {
      localStorage.setItem("note-toc", details.open ? "open" : "collapsed");
    } catch {
      // Storage blocked: the choice just isn't remembered.
    }
  });
}
