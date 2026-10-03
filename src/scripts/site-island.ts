import { isRendered, prefersReducedMotion } from "./prefs";

/*
 * <site-island> (spec §7, §8.2). Compact by default once JavaScript runs (the
 * head script sets <html data-js> so the first paint is already compact);
 * without JavaScript the markup stays in its expanded form.
 *
 * The morph never animates width: the glass layer is clipped with clip-path,
 * and the items present in both states slide with a transform (FLIP).
 */
const DURATION = 350;
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const RADIUS = 26; // half the 52px island height
/** Scrolling down this far after expanding returns the island to compact. */
const SCROLL_COLLAPSE = 24;

class SiteIsland extends HTMLElement {
  #glass: HTMLElement | null = null;
  #button: HTMLButtonElement | null = null;
  #scrollAnchor = 0;

  connectedCallback() {
    this.#glass = this.querySelector(".island-glass");
    this.#button = this.querySelector(".menu");
    this.#button?.addEventListener("click", this.#onToggle);
    document.addEventListener("keydown", this.#onKeydown);
    document.addEventListener("pointerdown", this.#onPointerdown);
    window.addEventListener("scroll", this.#onScroll, { passive: true });
  }

  disconnectedCallback() {
    this.#button?.removeEventListener("click", this.#onToggle);
    document.removeEventListener("keydown", this.#onKeydown);
    document.removeEventListener("pointerdown", this.#onPointerdown);
    window.removeEventListener("scroll", this.#onScroll);
  }

  get expanded() {
    return this.hasAttribute("data-expanded");
  }

  #setExpanded(next: boolean, { focusFirstLink = false } = {}) {
    if (next === this.expanded || !this.#button) return;
    const button = this.#button;
    const focusInside = this.contains(document.activeElement);

    this.#morph(() => {
      this.toggleAttribute("data-expanded", next);
      button.setAttribute("aria-expanded", String(next));
      const label = next ? button.dataset.labelClose : button.dataset.labelOpen;
      if (label) button.setAttribute("aria-label", label);
      if (!next) this.querySelector("lang-switcher")?.close();
    });

    this.#scrollAnchor = window.scrollY;
    if (next && focusFirstLink) {
      this.querySelector<HTMLElement>(".links a")?.focus();
    } else if (!next && focusInside && !isRendered(document.activeElement)) {
      // Focus was on a link that just disappeared.
      button.focus();
    }
  }

  #morph(update: () => void) {
    const glass = this.#glass;
    if (!glass || prefersReducedMotion()) {
      update();
      return;
    }

    for (const animation of this.getAnimations({ subtree: true })) {
      animation.cancel();
    }
    glass.removeAttribute("style");

    const kept = [
      this.querySelector<HTMLElement>(".home"),
      this.querySelector<HTMLElement>("lang-switcher"),
      this.#button,
    ].filter((el): el is HTMLElement => isRendered(el));
    const swappable = [
      ...this.querySelectorAll<HTMLElement>(".only-compact, .only-expanded"),
    ];

    const before = glass.getBoundingClientRect();
    const keptBefore = kept.map((el) => el.getBoundingClientRect());
    const hiddenBefore = new Set(swappable.filter((el) => !isRendered(el)));

    update();

    const after = glass.getBoundingClientRect();
    const union = {
      left: Math.min(before.left, after.left),
      top: Math.min(before.top, after.top),
      right: Math.max(before.right, after.right),
      bottom: Math.max(before.bottom, after.bottom),
    };
    const clip = (r: DOMRect) =>
      `inset(${r.top - union.top}px ${union.right - r.right}px ${union.bottom - r.bottom}px ${r.left - union.left}px round ${RADIUS}px)`;

    // Stretch the glass over both shapes for the duration, then clip from old to new.
    Object.assign(glass.style, {
      inset: "auto",
      left: `${union.left - after.left}px`,
      top: `${union.top - after.top}px`,
      width: `${union.right - union.left}px`,
      height: `${union.bottom - union.top}px`,
    });
    glass
      .animate(
        { clipPath: [clip(before), clip(after)] },
        { duration: DURATION, easing: EASE },
      )
      .finished.then(
        () => glass.removeAttribute("style"),
        () => {}, // cancelled by a newer morph, which resets the style itself
      );

    kept.forEach((el, index) => {
      const from = keptBefore[index];
      const to = el.getBoundingClientRect();
      if (!from) return;
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (dx || dy) {
        el.animate(
          { transform: [`translate(${dx}px, ${dy}px)`, "none"] },
          { duration: DURATION, easing: EASE },
        );
      }
    });

    for (const el of swappable) {
      if (hiddenBefore.has(el) && isRendered(el)) {
        el.animate(
          { opacity: [0, 1] },
          { duration: 200, delay: 120, easing: "ease-out", fill: "backwards" },
        );
      }
    }
  }

  #onToggle = (event: MouseEvent) => {
    // detail is 0 for keyboard activation: then move focus into the links.
    this.#setExpanded(!this.expanded, { focusFirstLink: event.detail === 0 });
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !this.expanded) return;
    this.#setExpanded(false);
    this.#button?.focus();
  };

  #onPointerdown = (event: PointerEvent) => {
    if (this.expanded && !this.contains(event.target as Node)) {
      this.#setExpanded(false);
    }
  };

  #onScroll = () => {
    if (
      this.expanded &&
      window.scrollY - this.#scrollAnchor > SCROLL_COLLAPSE
    ) {
      this.#setExpanded(false);
    }
  };
}

if (!customElements.get("site-island")) {
  customElements.define("site-island", SiteIsland);
}
