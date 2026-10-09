import { themedLogo } from "./logo";
import { INTRO_REVEAL_EVENT } from "./prefs";
import { THEME_EVENT } from "./theme";

/*
 * <intro-card> (spec §8.1, extended with the logo). Timeline:
 *   0.15s       card fades in centred, scale 0.94 → 1 (600ms), and the
 *               current theme's logo clip plays once, sped up to 3.9s
 *   clip ends   card turns in place to the info face (800ms)
 *   +0.8s       card turns again into the docked card while moving into
 *               its spot (800ms)
 *   docked      page, island and theme toggle are revealed, sliding up 24px
 *               (500ms); the halo dims (900ms)
 *
 * About 7s in all (Antonio shortened it from about 8.8s on 2026-10-09).
 *
 * The flip waits for the logo clip to end, capped so a slow or refused clip
 * never holds the page. The docked card never moves in layout: it is
 * measured once, the stage is translated to the viewport centre and animated
 * back (FLIP), so only transform and opacity animate. Any input (a key, a
 * click or tap, the wheel, focus moving) ends the intro at once; there is no
 * skip button. The floating theme toggle is the exception: it stays on screen
 * and changes the theme mid-intro, and the logo carries on in the new theme's
 * clip from the same moment.
 *
 * The mesh is the intro's backdrop: intro.css raises it over the page and
 * hides its veil; this script starts its animations, drops it back behind
 * the page at the reveal and pauses it again once the veil is up (§8.3).
 */
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const FADE_START = 150;
const FADE = 600;
/** One play of public/brand/logo-intro-<theme>.* as encoded (scripts/encode-logo.sh caps it at 4.9s). */
const CLIP = 4900;
/** How long the intro plays it: the same clip, sped up (the island's tile keeps 4.9s). */
const LOGO = 3900;
const LOGO_RATE = CLIP / LOGO;
/** How much later than planned the clip may end before the card turns anyway. */
const LOGO_GRACE = 1500;
const TURN_TO_INFO = 800;
const HOLD_INFO = 800;
const TURN_TO_DOCK = 800;
const REVEAL = 500;
const HALO_DOCK = 900;
const RISE = "translateY(24px)";
const SEEN_KEY = "anetto:intro-seen";
const TURN = (deg: number) => `perspective(1600px) rotateY(${deg}deg)`;
/** Below this width the theme toggle lives in the island (matches island.css). */
const PHONE = matchMedia("(max-width: 599.98px)");

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
  #timers: number[] = [];
  #done = false;
  #revealed = false;
  /** The logo clip playing now; it changes if the theme does. */
  #clip: HTMLVideoElement | null = null;
  #logoDone = false;

  connectedCallback() {
    if (document.documentElement.dataset.intro !== "play") {
      this.#teardown();
      return;
    }
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // The head script only plays the intro unasked when storage works.
    }
    setMeshLive(true);
    void this.#play();
    for (const type of ["keydown", "pointerdown", "wheel", "touchstart"]) {
      window.addEventListener(type, this.#onInput, {
        capture: true,
        passive: true,
      });
    }
    document.addEventListener("focusin", this.#onInput);
    document.addEventListener(THEME_EVENT, this.#onTheme);
  }

  disconnectedCallback() {
    this.#removeListeners();
  }

  async #play() {
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

    // 1. The card appears, centred, on its logo face.
    this.#run(
      stage.animate(
        [
          { opacity: 0, transform: `${centred} scale(0.94)` },
          { opacity: 1, transform: `${centred} scale(1)` },
        ],
        { delay: FADE_START, duration: FADE, easing: EASE, fill: "both" },
      ),
    );

    // 2. The logo plays once.
    await this.#logoPlayed();
    if (this.#done) return;

    // 3. Turn to the info face, hold, turn again into the docked card while moving.
    const total = TURN_TO_INFO + HOLD_INFO + TURN_TO_DOCK;
    const atInfo = TURN_TO_INFO / total;
    const leaving = (TURN_TO_INFO + HOLD_INFO) / total;
    this.#run(
      flipper.animate(
        [
          { offset: 0, transform: TURN(0), easing: EASE },
          { offset: atInfo, transform: TURN(180) },
          { offset: leaving, transform: TURN(180), easing: EASE },
          { offset: 1, transform: TURN(360) },
        ],
        { duration: total, fill: "both" },
      ),
      stage.animate(
        [
          { transform: `${centred} scale(1)` },
          { transform: "translate(0px, 0px) scale(1)" },
        ],
        {
          delay: TURN_TO_INFO + HOLD_INFO,
          duration: TURN_TO_DOCK,
          easing: EASE,
          fill: "both",
        },
      ),
    );

    // While the front side faces away, the docked card takes the logo's place.
    const swap = { delay: TURN_TO_INFO, duration: 1, fill: "both" } as const;
    const logoFace = this.querySelector(".logo-face");
    const dockedFace = this.querySelector(".docked");
    if (logoFace) this.#run(logoFace.animate({ opacity: [1, 0] }, swap));
    if (dockedFace) this.#run(dockedFace.animate({ opacity: [0, 1] }, swap));

    // 4. Docked: reveal the page.
    this.#reveal(total);

    void Promise.all(this.#animations.map((a) => a.finished)).then(
      () => this.#teardown(),
      () => {}, // cancelled by #finish, which tears down itself
    );
  }

  /** Resolves when the logo clip has played once, or clearly won't. */
  #logoPlayed(): Promise<void> {
    const clip = themedLogo(this);
    this.#clip = clip;
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        this.#logoDone = true;
        resolve();
      };
      this.#later(done, FADE_START + LOGO + LOGO_GRACE);
      if (!clip) {
        this.#later(done, FADE_START + LOGO);
        return;
      }
      // Both themes' clips: the theme can change while the logo plays (#onTheme).
      for (const each of this.querySelectorAll<HTMLVideoElement>(
        "video.logo-clip",
      )) {
        each.defaultPlaybackRate = LOGO_RATE;
        each.playbackRate = LOGO_RATE;
        each.addEventListener("ended", done, { once: true });
        each.addEventListener("error", () => this.#later(done, 1200), {
          once: true,
        });
      }
      // Refused autoplay (iOS Low Power Mode, for one): show the poster briefly.
      clip.play().catch(() => this.#later(done, FADE_START + 1200));
    });
  }

  #reveal(delay: number) {
    const reveal = { delay, duration: REVEAL } as const;
    // "forwards" only: until the reveal the page stays painted at full
    // opacity under the mesh, which is what LCP sees.
    const afterReveal = { ...reveal, fill: "forwards" } as const;

    const mesh = document.querySelector<HTMLElement>(".mesh");
    const veil = document.querySelector<HTMLElement>(".mesh-veil");
    if (mesh && veil) {
      const veilOpacity = getComputedStyle(document.documentElement)
        .getPropertyValue("--veil-opacity")
        .trim();
      this.#run(
        mesh.animate({ zIndex: ["-1", "-1"] }, afterReveal),
        veil.animate(
          { opacity: [0, Number(veilOpacity) || 0.9] },
          { ...afterReveal, easing: "ease" },
        ),
      );
    }
    const halo = this.querySelector(".halo");
    if (halo) {
      this.#run(
        halo.animate(
          { opacity: [0.7, 0.35] },
          { delay, duration: HALO_DOCK, easing: "ease", fill: "forwards" },
        ),
      );
    }
    for (const el of document.querySelectorAll("main, .site-footer")) {
      this.#run(
        el.animate(
          { opacity: [0, 1], transform: [RISE, "none"] },
          { ...afterReveal, easing: EASE },
        ),
      );
    }
    const island = document.querySelector("site-island");
    if (island) {
      this.#run(
        island.animate(
          { opacity: [0, 1], transform: [RISE, "none"] },
          { ...reveal, easing: EASE, fill: "both", composite: "add" },
        ),
      );
    }
    // Phones keep the toggle in the island; the floating one only stood in.
    const toggle = document.querySelector(".theme-toggle.floating");
    if (toggle && PHONE.matches) {
      this.#run(
        toggle.animate(
          { opacity: [1, 0] },
          { ...reveal, easing: "ease", fill: "forwards" },
        ),
      );
    }
    this.#later(() => this.#announceReveal(), delay);
  }

  #run(...animations: Animation[]) {
    this.#animations.push(...animations);
  }

  #later(callback: () => void, ms: number) {
    this.#timers.push(window.setTimeout(callback, ms));
  }

  /** Ends the intro immediately in its final state. */
  #finish = () => {
    if (this.#done) return;
    for (const animation of this.#animations) animation.finish();
    this.#teardown();
  };

  /** Any key, click, tap, wheel or focus move ends the intro, except on the theme toggle. */
  #onInput = (event: Event) => {
    if ((event.target as Element).closest?.("theme-toggle")) return;
    this.#finish();
  };

  /** The theme changed mid-intro: the new theme's clip takes over from the same moment. */
  #onTheme = () => {
    const from = this.#clip;
    const to = themedLogo(this);
    if (this.#logoDone || !from || !to || to === from) return;
    from.pause();
    to.poster = to.dataset.poster ?? "";
    to.preload = "auto";
    to.currentTime = from.currentTime;
    this.#clip = to;
    to.play().catch(() => {}); // refused: its poster shows until the cap
  };

  #announceReveal() {
    if (this.#revealed) return;
    this.#revealed = true;
    document.dispatchEvent(new CustomEvent(INTRO_REVEAL_EVENT));
  }

  /** Back to the plain docked card, exactly as pages without an intro draw it. */
  #teardown() {
    if (this.#done) return;
    this.#done = true;
    this.#removeListeners();
    for (const timer of this.#timers) window.clearTimeout(timer);
    for (const animation of this.#animations) animation.cancel();
    this.#animations = [];
    delete document.documentElement.dataset.intro;
    setMeshLive(false);
    for (const el of this.querySelectorAll(".logo-face, .front")) {
      el.remove();
    }
    this.#announceReveal();
  }

  #removeListeners() {
    for (const type of ["keydown", "pointerdown", "wheel", "touchstart"]) {
      window.removeEventListener(type, this.#onInput, { capture: true });
    }
    document.removeEventListener("focusin", this.#onInput);
    document.removeEventListener(THEME_EVENT, this.#onTheme);
  }
}

if (!customElements.get("intro-card")) {
  customElements.define("intro-card", IntroCard);
}
