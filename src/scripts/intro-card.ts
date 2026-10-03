import { INTRO_REVEAL_EVENT } from "./prefs";

/*
 * <intro-card> (spec §8.1). Timeline:
 *   0.15s  card fades in, scale 0.94 → 1, centred in the viewport (600ms)
 *   1.90s  card flips to its back face while moving into the docked spot (1000ms)
 *   2.90s  page, island and theme toggle are revealed, sliding up 24px (700ms)
 *
 * The docked card never moves in layout: it is measured once, the stage is
 * translated to the viewport centre and animated back (FLIP), so only
 * transform and opacity animate. Any input ends the intro at once.
 *
 * The mesh is the intro's backdrop: intro.css raises it over the page and
 * hides its veil; this script starts its animations, drops it back behind
 * the page at the reveal and pauses it again once the veil is up (§8.3).
 */
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const FADE_START = 150;
const FADE = 600;
const FLIP_START = 1900;
const FLIP = 1000;
const REVEAL = 700;
const RISE = "translateY(24px)";
const HALO_DOCK = 900;
const SEEN_KEY = "anetto:intro-seen";

function setMeshLive(live: boolean) {
  const mesh = document.querySelector<HTMLElement>(".mesh");
  const svg = mesh?.querySelector("svg");
  if (!mesh || !svg) return;
  if (live) {
    mesh.dataset.live = "";
    svg.unpauseAnimations();
    for (const animation of svg.querySelectorAll("animate")) {
      animation.beginElement();
    }
  } else {
    delete mesh.dataset.live;
    svg.pauseAnimations();
  }
}

class IntroCard extends HTMLElement {
  #animations: Animation[] = [];
  #done = false;
  #revealed = false;
  #revealTimer = 0;

  connectedCallback() {
    if (document.documentElement.dataset.intro !== "play") {
      this.#teardown();
      return;
    }
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // The head script only plays the intro when storage works.
    }
    setMeshLive(true);
    this.#play();
    this.querySelector(".intro-skip")?.addEventListener("click", this.#finish);
    for (const type of ["keydown", "pointerdown", "wheel", "touchstart"]) {
      window.addEventListener(type, this.#onInput, {
        capture: true,
        passive: true,
      });
    }
    document.addEventListener("focusin", this.#onFocusin);
  }

  disconnectedCallback() {
    this.#removeListeners();
  }

  #play() {
    const stage = this.querySelector<HTMLElement>(".stage");
    const flipper = this.querySelector<HTMLElement>(".flipper");
    if (!stage || !flipper) {
      this.#teardown();
      return;
    }

    // FLIP: from the docked box to the viewport centre.
    const docked = stage.getBoundingClientRect();
    const dx = window.innerWidth / 2 - (docked.left + docked.width / 2);
    const dy = window.innerHeight / 2 - (docked.top + docked.height / 2);
    const centred = `translate(${dx}px, ${dy}px)`;
    const total = FLIP_START + FLIP;

    this.#animations.push(
      stage.animate(
        [
          { offset: 0, opacity: 0, transform: `${centred} scale(0.94)` },
          {
            offset: FADE_START / total,
            opacity: 0,
            transform: `${centred} scale(0.94)`,
            easing: EASE,
          },
          {
            offset: (FADE_START + FADE) / total,
            opacity: 1,
            transform: `${centred} scale(1)`,
          },
          {
            offset: FLIP_START / total,
            opacity: 1,
            transform: `${centred} scale(1)`,
            easing: EASE,
          },
          { offset: 1, opacity: 1, transform: "translate(0px, 0px) scale(1)" },
        ],
        { duration: total, fill: "forwards" },
      ),
      // perspective() on the flipper itself keeps the vanishing point on the card.
      flipper.animate(
        [
          { transform: "perspective(1600px) rotateY(0deg)" },
          { transform: "perspective(1600px) rotateY(180deg)" },
        ],
        { delay: FLIP_START, duration: FLIP, easing: EASE, fill: "both" },
      ),
    );

    const reveal = { delay: total, duration: REVEAL, fill: "both" } as const;
    // "forwards" only: until the reveal the page stays painted at full
    // opacity under the mesh, which is what LCP sees.
    const afterReveal = { ...reveal, fill: "forwards" } as const;

    const mesh = document.querySelector<HTMLElement>(".mesh");
    const veil = document.querySelector<HTMLElement>(".mesh-veil");
    if (mesh && veil) {
      const veilOpacity = getComputedStyle(document.documentElement)
        .getPropertyValue("--veil-opacity")
        .trim();
      this.#animations.push(
        mesh.animate({ zIndex: ["-1", "-1"] }, afterReveal),
        veil.animate(
          { opacity: [0, Number(veilOpacity) || 0.9] },
          { ...afterReveal, easing: "ease" },
        ),
      );
    }
    const halo = this.querySelector(".halo");
    if (halo) {
      this.#animations.push(
        halo.animate(
          { opacity: [0.7, 0.35] },
          {
            delay: total,
            duration: HALO_DOCK,
            easing: "ease",
            fill: "forwards",
          },
        ),
      );
    }
    this.#revealTimer = window.setTimeout(() => this.#announceReveal(), total);

    const skip = this.querySelector(".intro-skip");
    if (skip) {
      this.#animations.push(
        skip.animate({ opacity: [1, 0] }, { ...reveal, easing: "ease" }),
      );
    }
    for (const el of document.querySelectorAll("main, .site-footer")) {
      this.#animations.push(
        el.animate(
          { opacity: [0, 1], transform: [RISE, "none"] },
          { ...afterReveal, easing: EASE },
        ),
      );
    }
    for (const el of document.querySelectorAll(
      "site-island, .theme-toggle.floating",
    )) {
      this.#animations.push(
        el.animate(
          { opacity: [0, 1], transform: [RISE, "none"] },
          { ...reveal, easing: EASE, composite: "add" },
        ),
      );
    }

    void Promise.all(this.#animations.map((a) => a.finished)).then(
      () => this.#teardown(),
      () => {}, // cancelled by #finish, which tears down itself
    );
  }

  /** Ends the intro immediately in its final state. */
  #finish = () => {
    if (this.#done) return;
    const skipHadFocus =
      document.activeElement === this.querySelector(".intro-skip");
    for (const animation of this.#animations) animation.finish();
    this.#teardown();
    if (skipHadFocus) document.getElementById("main")?.focus();
  };

  #onInput = () => this.#finish();

  #announceReveal() {
    if (this.#revealed) return;
    this.#revealed = true;
    document.dispatchEvent(new CustomEvent(INTRO_REVEAL_EVENT));
  }

  #onFocusin = (event: FocusEvent) => {
    // Moving focus into the page ends the intro; the skip button itself doesn't.
    if (!(event.target as Element).closest?.(".intro-skip")) this.#finish();
  };

  /** Back to the plain docked card, exactly as pages without an intro draw it. */
  #teardown() {
    if (this.#done) return;
    this.#done = true;
    this.#removeListeners();
    window.clearTimeout(this.#revealTimer);
    for (const animation of this.#animations) animation.cancel();
    this.#animations = [];
    delete document.documentElement.dataset.intro;
    setMeshLive(false);
    for (const el of this.querySelectorAll(".front, .intro-skip")) {
      el.remove();
    }
    this.#announceReveal();
  }

  #removeListeners() {
    this.querySelector(".intro-skip")?.removeEventListener(
      "click",
      this.#finish,
    );
    for (const type of ["keydown", "pointerdown", "wheel", "touchstart"]) {
      window.removeEventListener(type, this.#onInput, { capture: true });
    }
    document.removeEventListener("focusin", this.#onFocusin);
  }
}

if (!customElements.get("intro-card")) {
  customElements.define("intro-card", IntroCard);
}
