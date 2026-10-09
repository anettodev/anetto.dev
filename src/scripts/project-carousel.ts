/*
 * <project-carousel>: the Pinned carousel (components/ProjectCarousel.astro).
 *
 *   arrows  one stop back or on; on from the last wraps to the first, back
 *           from the first to the last. Quick presses add up (they count
 *           from where a glide still under way is headed)
 *   dots    one per stop the row can rest at, the current one a dash
 *           (aria-current). How many cards are in view changes with the
 *           width, so the dots are rebuilt on resize
 *   auto    on one stop every 5 s, wrapping. It waits while the pointer
 *           is over the carousel, keyboard focus is inside, it's mostly off
 *           screen or the tab is hidden; moving it by hand restarts the
 *           5 s. Never for readers who prefer reduced motion, whose moves
 *           also jump instead of gliding. No pause button (Antonio's call;
 *           see DECISIONS.md)
 *
 * With every card in view none of this shows and nothing moves.
 */
const INTERVAL = 5000;

/* Moves made on the row itself: swipe or drag, wheel, arrow keys. */
const BY_HAND = ["pointerdown", "wheel", "keydown"] as const;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

class ProjectCarousel extends HTMLElement {
  #row: HTMLElement | null = null;
  #arrows: HTMLButtonElement[] = [];
  #dots: HTMLElement | null = null;
  #resize: ResizeObserver | null = null;
  #seen: IntersectionObserver | null = null;
  /* Stops the row can rest at, and the distance between them. */
  #count = 1;
  #stride = 1;
  /* The stop a glide is headed to. */
  #heading: number | null = null;
  #timer: number | undefined;
  #autoplay = true;
  #hovered = false;
  #focused = false;
  #inView = false;

  connectedCallback() {
    this.#row = this.querySelector(".cards.carousel");
    this.#arrows = [
      ...this.querySelectorAll<HTMLButtonElement>("button[data-step]"),
    ];
    this.#dots = this.querySelector(".dots");
    this.#autoplay = !reducedMotion();

    for (const arrow of this.#arrows) {
      arrow.addEventListener("click", this.#onArrow);
    }
    this.#dots?.addEventListener("click", this.#onDot);
    this.#row?.addEventListener("scroll", this.#update, { passive: true });
    this.#row?.addEventListener("scrollend", this.#onSettled);
    for (const type of BY_HAND) {
      this.#row?.addEventListener(type, this.#onByHand, { passive: true });
    }
    this.addEventListener("pointerenter", this.#onEnter);
    this.addEventListener("pointerleave", this.#onLeave);
    this.addEventListener("focusin", this.#onFocusIn);
    this.addEventListener("focusout", this.#onFocusOut);
    document.addEventListener("visibilitychange", this.#sync);

    this.#resize = new ResizeObserver(this.#layout);
    if (this.#row) this.#resize.observe(this.#row);
    this.#seen = new IntersectionObserver(
      ([entry]) => {
        this.#inView = entry?.isIntersecting ?? false;
        this.#sync();
      },
      { threshold: 0.5 },
    );
    this.#seen.observe(this);
    this.#layout();
  }

  disconnectedCallback() {
    for (const arrow of this.#arrows) {
      arrow.removeEventListener("click", this.#onArrow);
    }
    this.#dots?.removeEventListener("click", this.#onDot);
    this.#row?.removeEventListener("scroll", this.#update);
    this.#row?.removeEventListener("scrollend", this.#onSettled);
    for (const type of BY_HAND) {
      this.#row?.removeEventListener(type, this.#onByHand);
    }
    this.removeEventListener("pointerenter", this.#onEnter);
    this.removeEventListener("pointerleave", this.#onLeave);
    this.removeEventListener("focusin", this.#onFocusIn);
    this.removeEventListener("focusout", this.#onFocusOut);
    document.removeEventListener("visibilitychange", this.#sync);
    this.#resize?.disconnect();
    this.#seen?.disconnect();
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  /* ---------- Stops ---------- */

  get #max() {
    const row = this.#row;
    return row ? row.scrollWidth - row.clientWidth : 0;
  }

  /* Where a stop sits; the last one may be the end of the row. */
  #left(stop: number) {
    return Math.min(this.#max, stop * this.#stride);
  }

  get #current() {
    const row = this.#row;
    if (!row) return 0;
    if (row.scrollLeft >= this.#max - 1) return this.#count - 1;
    return Math.min(this.#count - 1, Math.round(row.scrollLeft / this.#stride));
  }

  #layout = () => {
    const row = this.#row;
    if (!row) return;
    const card = row.querySelector<HTMLElement>(":scope > *");
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    this.#stride = (card?.offsetWidth ?? row.clientWidth) + gap || 1;
    const max = this.#max;
    this.#count = max <= 1 ? 1 : Math.ceil(max / this.#stride - 0.05) + 1;
    const scrolls = this.#count > 1;
    for (const arrow of this.#arrows) arrow.hidden = !scrolls;
    if (this.#dots) this.#dots.hidden = !scrolls;
    if (this.#dots && this.#dots.childElementCount !== this.#count) {
      this.#renderDots();
    }
    this.#update();
    this.#sync();
  };

  /* Each dot is named after the card its stop starts with. */
  #renderDots() {
    const dots = this.#dots;
    const row = this.#row;
    if (!dots || !row) return;
    const cards = [...row.children];
    const label = dots.dataset.show ?? "{title}";
    dots.replaceChildren(
      ...Array.from({ length: this.#count }, (_, stop) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.dataset.stop = String(stop);
        const title =
          cards[stop]?.querySelector(".title")?.textContent?.trim() ??
          String(stop + 1);
        dot.setAttribute("aria-label", label.replace("{title}", title));
        return dot;
      }),
    );
  }

  #markDot(stop: number) {
    for (const [index, dot] of [...(this.#dots?.children ?? [])].entries()) {
      if (index === stop) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    }
  }

  /* Glides (or jumps) to a stop; past either end wraps around. */
  #go(stop: number) {
    const row = this.#row;
    if (!row) return;
    const target = ((stop % this.#count) + this.#count) % this.#count;
    this.#heading = target;
    row.scrollTo({
      left: this.#left(target),
      behavior: reducedMotion() ? "auto" : "smooth",
    });
    this.#markDot(target);
  }

  #update = () => {
    const row = this.#row;
    if (!row) return;
    if (
      this.#heading !== null &&
      Math.abs(row.scrollLeft - this.#left(this.#heading)) < 1
    ) {
      this.#heading = null; // Arrived.
    }
    this.#markDot(this.#heading ?? this.#current);
  };

  /* ---------- Input ---------- */

  #onArrow = (event: Event) => {
    const step = Number(
      (event.currentTarget as HTMLButtonElement).dataset.step,
    );
    this.#go((this.#heading ?? this.#current) + step);
    this.#restart();
  };

  #onDot = (event: Event) => {
    const dot = (event.target as Element).closest<HTMLButtonElement>(
      "button[data-stop]",
    );
    if (!dot) return;
    this.#go(Number(dot.dataset.stop));
    this.#restart();
  };

  /* A swipe, drag, wheel or key takes over from any glide. */
  #onByHand = () => {
    this.#heading = null;
    this.#restart();
  };

  /* However a scroll ended (arrived or cut short), it's headed nowhere now. */
  #onSettled = () => {
    this.#heading = null;
    this.#update();
  };

  #onEnter = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    this.#hovered = true;
    this.#sync();
  };

  #onLeave = () => {
    if (!this.#hovered) return;
    this.#hovered = false;
    this.#restart();
  };

  /* Keyboard focus only: a mouse click on a link or arrow doesn't count. */
  #onFocusIn = (event: FocusEvent) => {
    this.#focused = (event.target as Element).matches(":focus-visible");
    this.#sync();
  };

  #onFocusOut = (event: FocusEvent) => {
    if (this.contains(event.relatedTarget as Node | null)) return;
    this.#focused = false;
    this.#restart();
  };

  /* ---------- Autoplay ---------- */

  get #canPlay() {
    return (
      this.#autoplay &&
      this.#count > 1 &&
      this.#inView &&
      !this.#hovered &&
      !this.#focused &&
      document.visibilityState === "visible"
    );
  }

  /* Starts the 5 s if it may run and isn't already; stops it if it may not. */
  #sync = () => {
    if (!this.#canPlay) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    } else if (this.#timer === undefined) {
      this.#timer = window.setTimeout(this.#tick, INTERVAL);
    }
  };

  #restart() {
    clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#sync();
  }

  #tick = () => {
    this.#timer = undefined;
    if (!this.#canPlay) return;
    this.#go((this.#heading ?? this.#current) + 1);
    this.#sync();
  };
}

if (!customElements.get("project-carousel")) {
  customElements.define("project-carousel", ProjectCarousel);
}
