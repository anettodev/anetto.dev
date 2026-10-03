import { themedLogo } from "./logo";
import { isRendered, prefersReducedMotion } from "./prefs";

/*
 * <site-island> (spec §7, §8.2). Without JavaScript the markup stays in its
 * expanded form. With it:
 *   - at the top of the page, wide screens show the expanded row; scrolled
 *     down, the island is compact. A scroll only changes the state once the
 *     new position has held for AUTO_DELAY, so quick scrolls don't flicker it;
 *   - on wide screens a mouse hover or keyboard focus also expands it, until
 *     the pointer or focus leaves (HOVER_DELAY / LEAVE_DELAY keep a pointer
 *     passing by from flickering it). There the menu button is only for
 *     touch, and only in the compact state: expanded, there is nothing to
 *     close, since scrolling down collapses it;
 *   - narrow screens never expand on their own: there the expanded state is a
 *     panel that would cover the top of the page, opened and closed with the
 *     menu button;
 *   - Escape and a click outside close an island opened by hand.
 *
 * The morph never animates width: the glass layer is clipped with clip-path,
 * and the items present in both states slide with a transform (FLIP).
 *
 * The logo plays once on load (not after the Home intro, whose card has just
 * played it) and again on mouse hover or keyboard focus, as the current
 * theme's clip (one play is 4.9s, under WCAG 2.2.2's five seconds). Never with
 * reduced motion, never looped.
 */
const DURATION = 350;
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const AUTO_DELAY = 500;
const HOVER_DELAY = 120;
const LEAVE_DELAY = 400;
/** Within this many pixels of the top counts as "at the top". */
const TOP = 4;
/** Where the expanded island fits on one row (matches island.css). */
const WIDE = matchMedia("(min-width: 960px)");

class SiteIsland extends HTMLElement {
  #glass: HTMLElement | null = null;
  #button: HTMLButtonElement | null = null;
  #autoTimer = 0;
  #autoTarget: boolean | null = null;
  #hoverTimer = 0;
  #hovered = false;
  #focused = false;
  #home: HTMLElement | null = null;

  connectedCallback() {
    this.#glass = this.querySelector(".island-glass");
    this.#button = this.querySelector(".menu");
    this.#button?.addEventListener("click", this.#onToggle);
    document.addEventListener("keydown", this.#onKeydown);
    document.addEventListener("pointerdown", this.#onPointerdown);
    window.addEventListener("scroll", this.#onScroll, { passive: true });
    WIDE.addEventListener("change", this.#onScroll);
    this.addEventListener("pointerenter", this.#onPointerenter);
    this.addEventListener("pointerleave", this.#onPointerleave);
    this.addEventListener("focusin", this.#onFocusin);
    this.addEventListener("focusout", this.#onFocusout);

    this.#home = this.querySelector(".home");
    this.#home?.addEventListener("pointerenter", this.#onLogoHover);
    this.#home?.addEventListener("focus", this.#playLogo);
    // On Home's intro the card has just played the logo; the island's rests.
    if (document.documentElement.dataset.intro !== "play") this.#playLogo();

    // First state without animation; island.css already drew this guess.
    this.#setExpanded(this.#autoState() === true, { animate: false });
    document.documentElement.dataset.islandReady = "";
  }

  disconnectedCallback() {
    this.#button?.removeEventListener("click", this.#onToggle);
    document.removeEventListener("keydown", this.#onKeydown);
    document.removeEventListener("pointerdown", this.#onPointerdown);
    window.removeEventListener("scroll", this.#onScroll);
    WIDE.removeEventListener("change", this.#onScroll);
    this.removeEventListener("pointerenter", this.#onPointerenter);
    this.removeEventListener("pointerleave", this.#onPointerleave);
    this.removeEventListener("focusin", this.#onFocusin);
    this.removeEventListener("focusout", this.#onFocusout);
    window.clearTimeout(this.#hoverTimer);
    this.#home?.removeEventListener("pointerenter", this.#onLogoHover);
    this.#home?.removeEventListener("focus", this.#playLogo);
    this.#cancelAuto();
  }

  #playLogo = () => {
    if (prefersReducedMotion()) return;
    const logo = themedLogo(this);
    if (!logo) return;
    logo.currentTime = 0;
    // Autoplay can be refused (iOS Low Power Mode, for one): the poster stays.
    logo.play().catch(() => {});
  };

  #onLogoHover = (event: PointerEvent) => {
    // A tap is about to navigate; only a mouse hover replays.
    if (event.pointerType === "mouse") this.#playLogo();
  };

  get expanded() {
    return this.hasAttribute("data-expanded");
  }

  /** The state scrolling asks for: true/false, or null for "leave it as it is". */
  #autoState(): boolean | null {
    if (window.scrollY > TOP) return false;
    return WIDE.matches ? true : null;
  }

  /** The state the island should be in: scroll position, unless hovered or focused on a wide screen. */
  #wantedState(): boolean | null {
    if (WIDE.matches && (this.#hovered || this.#focused)) return true;
    return this.#autoState();
  }

  /** Moves to the wanted state now (hover and focus don't wait like scrolling). */
  #settle() {
    const target = this.#wantedState();
    if (target === null || target === this.expanded) return;
    this.#cancelAuto();
    this.#setExpanded(target);
  }

  #cancelAuto() {
    window.clearTimeout(this.#autoTimer);
    this.#autoTimer = 0;
    this.#autoTarget = null;
  }

  #setExpanded(next: boolean, { focusFirstLink = false, animate = true } = {}) {
    if (!this.#button) return;
    const button = this.#button;
    const apply = () => {
      this.toggleAttribute("data-expanded", next);
      button.setAttribute("aria-expanded", String(next));
      const label = next ? button.dataset.labelClose : button.dataset.labelOpen;
      if (label) button.setAttribute("aria-label", label);
      if (!next) this.querySelector("lang-switcher")?.close();
    };
    if (!animate) {
      apply();
      return;
    }
    if (next === this.expanded) return;
    const focusInside = this.contains(document.activeElement);

    this.#morph(apply);

    if (next && focusFirstLink) {
      this.querySelector<HTMLElement>(".links a")?.focus();
    } else if (focusInside && !isRendered(document.activeElement)) {
      // Focus was on an item that just disappeared: a link when collapsing,
      // the menu button when expanding on a wide screen.
      const fallback = next ? this.querySelector("summary") : button;
      fallback?.focus();
    }
  }

  #morph(update: () => void) {
    const glass = this.#glass;
    if (!glass || prefersReducedMotion()) {
      update();
      return;
    }
    const radius = getComputedStyle(glass).borderTopLeftRadius;

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
      // The menu button too: on wide screens it exists only when compact.
      ...this.querySelectorAll<HTMLElement>(
        ".only-compact, .only-expanded, .menu",
      ),
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
      `inset(${r.top - union.top}px ${union.right - r.right}px ${union.bottom - r.bottom}px ${r.left - union.left}px round ${radius})`;

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
      if (!from || !isRendered(el)) return;
      const to = el.getBoundingClientRect();
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
    this.#cancelAuto();
    // detail is 0 for keyboard activation: then move focus into the links.
    this.#setExpanded(!this.expanded, { focusFirstLink: event.detail === 0 });
  };

  #onKeydown = (event: KeyboardEvent) => {
    // Only an island opened by hand closes: not its resting state at the top
    // of a wide screen, nor one held open by hover or focus.
    if (
      event.key !== "Escape" ||
      !this.expanded ||
      this.#wantedState() === true
    ) {
      return;
    }
    this.#setExpanded(false);
    this.#button?.focus();
  };

  #onPointerdown = (event: PointerEvent) => {
    // At the top of a wide screen, expanded is the resting state, not an open menu.
    if (
      this.expanded &&
      this.#autoState() !== true &&
      !this.contains(event.target as Node)
    ) {
      this.#setExpanded(false);
    }
  };

  #onPointerenter = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !WIDE.matches) return;
    this.#hover(true, HOVER_DELAY);
  };

  #onPointerleave = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    this.#hover(false, LEAVE_DELAY);
  };

  /** Records the hover after `delay`; a newer enter or leave replaces a pending one. */
  #hover(hovered: boolean, delay: number) {
    window.clearTimeout(this.#hoverTimer);
    this.#hoverTimer = window.setTimeout(() => {
      this.#hovered = hovered;
      this.#settle();
    }, delay);
  }

  #onFocusin = (event: FocusEvent) => {
    // Keyboard focus only: a click focuses too, and there the pointer decides.
    if (!WIDE.matches || !(event.target as Element).matches(":focus-visible")) {
      return;
    }
    this.#focused = true;
    this.#settle();
  };

  #onFocusout = (event: FocusEvent) => {
    if (this.contains(event.relatedTarget as Node | null)) return;
    this.#focused = false;
    this.#settle();
  };

  #onScroll = () => {
    const target = this.#wantedState();
    if (target === null || target === this.expanded) {
      this.#cancelAuto();
      return;
    }
    if (this.#autoTimer && this.#autoTarget === target) return;
    this.#cancelAuto();
    this.#autoTarget = target;
    this.#autoTimer = window.setTimeout(() => {
      this.#autoTimer = 0;
      this.#autoTarget = null;
      // Only if the page is still where it was asked from.
      if (this.#wantedState() === target) this.#setExpanded(target);
    }, AUTO_DELAY);
  };
}

if (!customElements.get("site-island")) {
  customElements.define("site-island", SiteIsland);
}
