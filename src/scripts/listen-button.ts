/*
 * <listen-button> (ListenButton.astro): reads the page aloud: a note, or
 * About. When the page has a recording (Antonio's cloned voice, npm run
 * notes:audio or pages:audio, in the page's language), it plays that
 * <audio>, highlighting each passage at the times kept with it, and falls
 * back to the device if it can't play. Otherwise it uses the browser's
 * speech synthesis, in the best voice the device has for the page's
 * language (an "enhanced", "premium" or "natural" one when there is one).
 *
 * The title, then each heading, paragraph, list item and quote of the
 * page's data-listen areas (data-target; code blocks are skipped), in
 * order, is read in sentence chunks of about 220
 * characters: Chrome cuts long utterances off. Pausing cancels the speech
 * and resuming re-reads the current chunk, which behaves the same in every
 * browser (speechSynthesis.pause() doesn't, on Android). The passage being
 * read gets .is-reading and is scrolled into view only when it's off
 * screen. Leaving the page stops it.
 */
const RATES = [1, 1.25, 1.5];
const MAX_CHUNK = 220;
const BLOCKS = "h2, h3, h4, p, li, blockquote";
const READING = "is-reading";

interface Chunk {
  text: string;
  block: HTMLElement | null;
}

type State = "idle" | "playing" | "paused";

/** Splits text into sentence chunks of at most about MAX_CHUNK characters. */
function split(text: string): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]*["'”’)\]]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && (current + sentence).length > MAX_CHUNK) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  // One sentence longer than the limit: split it between words.
  return chunks.flatMap((chunk) => {
    if (chunk.length <= MAX_CHUNK * 1.5) return [chunk];
    const parts: string[] = [];
    let part = "";
    for (const word of chunk.split(/\s+/)) {
      if (part && (part + " " + word).length > MAX_CHUNK) {
        parts.push(part);
        part = word;
      } else {
        part = part ? `${part} ${word}` : word;
      }
    }
    if (part) parts.push(part);
    return parts;
  });
}

/** The best voice for a language: exact match first, then the family. */
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  const wanted = lang.toLowerCase();
  const family = wanted.split("-")[0] ?? wanted;
  const normal = (voice: SpeechSynthesisVoice) =>
    voice.lang.toLowerCase().replace("_", "-");
  const exact = voices.filter((voice) => normal(voice) === wanted);
  const pool = exact.length
    ? exact
    : voices.filter((voice) => normal(voice).startsWith(family));
  const good = /premium|enhanced|natural|neural|google/i;
  return (
    pool.find((voice) => good.test(voice.name)) ??
    pool.find((voice) => voice.default) ??
    pool[0] ??
    null
  );
}

class ListenButton extends HTMLElement {
  #areas: HTMLElement[] = [];
  #main: HTMLButtonElement | null = null;
  #audio: HTMLAudioElement | null = null;
  #marks: number[] = [];
  #blocks: HTMLElement[] = [];
  #chunks: Chunk[] = [];
  #index = 0;
  #rate = 0;
  #run = 0;
  #state: State = "idle";
  #current: HTMLElement | null = null;

  connectedCallback() {
    this.#areas = [
      ...document.querySelectorAll<HTMLElement>(
        this.dataset.target || "[data-listen]",
      ),
    ];
    this.#main = this.querySelector<HTMLButtonElement>(".listen-main");
    this.#audio = this.querySelector<HTMLAudioElement>("audio");
    if (this.#areas.length === 0 || !this.#main) return;
    if (!this.#audio && !("speechSynthesis" in window)) return;
    this.hidden = false;
    this.#main.addEventListener("click", this.#onMain);
    this.querySelector(".listen-stop")?.addEventListener("click", this.#stop);
    this.querySelector(".listen-speed")?.addEventListener(
      "click",
      this.#onSpeed,
    );
    window.addEventListener("pagehide", this.#stop);
    if (this.#audio) {
      try {
        this.#marks = JSON.parse(this.#audio.dataset.marks ?? "[]");
      } catch {
        this.#marks = [];
      }
      this.#audio.addEventListener("play", this.#onAudioPlay);
      this.#audio.addEventListener("pause", this.#onAudioPause);
      this.#audio.addEventListener("ended", this.#stop);
      this.#audio.addEventListener("timeupdate", this.#onAudioTime);
      this.#audio.addEventListener("error", this.#onAudioError);
    }
    // Chrome loads its voice list lazily: ask early so it's ready on play.
    if ("speechSynthesis" in window) speechSynthesis.getVoices();
  }

  disconnectedCallback() {
    this.#stop();
    this.#main?.removeEventListener("click", this.#onMain);
    window.removeEventListener("pagehide", this.#stop);
  }

  #onMain = () => {
    if (this.#audio) {
      if (this.#audio.paused) {
        this.#blocks = this.#findBlocks();
        this.#audio.play().catch(this.#onAudioError);
      } else {
        this.#audio.pause();
      }
      return;
    }
    if (this.#state === "playing") {
      this.#halt();
      this.#state = "paused";
      this.#render();
      return;
    }
    if (this.#state === "idle") {
      this.#chunks = this.#collect();
      this.#index = 0;
    }
    this.#state = "playing";
    this.#render();
    this.#speak();
  };

  #onSpeed = () => {
    this.#rate = (this.#rate + 1) % RATES.length;
    const rate = this.querySelector(".listen-rate");
    if (rate) rate.textContent = `${RATES[this.#rate]}×`;
    if (this.#audio) {
      this.#audio.playbackRate = RATES[this.#rate] ?? 1;
    } else if (this.#state === "playing") {
      this.#speak();
    }
  };

  #stop = () => {
    if (this.#audio) {
      this.#audio.pause();
      if (this.#audio.currentTime) this.#audio.currentTime = 0;
    } else {
      this.#halt();
    }
    this.#state = "idle";
    this.#index = 0;
    this.#highlight(null);
    this.#progress(0);
    this.#time();
    this.#render();
  };

  /* ---------- The recording (npm run notes:audio, pages:audio) ---------- */

  #onAudioPlay = () => {
    this.#state = "playing";
    this.#render();
    // The readout shows "0:00 / 0:24" at once, not after the first timeupdate.
    this.#time();
  };

  #onAudioPause = () => {
    // A pause at the end or from Stop leaves it idle; otherwise it's paused.
    if (this.#audio && this.#audio.currentTime > 0 && !this.#audio.ended) {
      this.#state = "paused";
      this.#render();
    }
  };

  #onAudioTime = () => {
    const audio = this.#audio;
    if (!audio || this.#state === "idle") return;
    const duration = audio.duration || Number(audio.dataset.duration) || 0;
    this.#progress(duration ? audio.currentTime / duration : 0);
    this.#time();
    // marks[0] is the title; marks[i] the page's i-th passage.
    let passage = 0;
    this.#marks.forEach((mark, i) => {
      if (mark <= audio.currentTime) passage = i;
    });
    this.#highlight(passage > 0 ? (this.#blocks[passage - 1] ?? null) : null);
  };

  /** The recording can't play: the device's voice takes over, from the start. */
  #onAudioError = () => {
    const audio = this.#audio;
    if (!audio) return;
    const wanted = this.#state === "playing" || !audio.paused;
    audio.removeEventListener("pause", this.#onAudioPause);
    audio.removeEventListener("ended", this.#stop);
    audio.removeEventListener("timeupdate", this.#onAudioTime);
    this.#audio = null;
    this.#stop();
    if (!("speechSynthesis" in window)) {
      this.hidden = true;
      return;
    }
    if (wanted) this.#onMain();
  };

  #time() {
    const out = this.querySelector<HTMLElement>(".listen-time");
    const audio = this.#audio;
    if (!out || !audio) return;
    const clock = (seconds: number) => {
      const s = Math.max(0, Math.floor(seconds));
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    };
    const duration = audio.duration || Number(audio.dataset.duration) || 0;
    out.textContent = `${clock(audio.currentTime)} / ${clock(duration)}`;
  }

  /* ---------- The device's voice (Web Speech API) ---------- */

  /** Stops the speech for good: callbacks of earlier utterances are ignored. */
  #halt() {
    this.#run++;
    if (
      "speechSynthesis" in window &&
      (speechSynthesis.speaking || speechSynthesis.pending)
    ) {
      speechSynthesis.cancel();
    }
  }

  /** The outermost, non-empty passages of the page's data-listen areas, never code: as scripts/lib/voice.mjs reads them. */
  #findBlocks(): HTMLElement[] {
    return this.#areas
      .flatMap((area) => [...area.querySelectorAll<HTMLElement>(BLOCKS)])
      .filter(
        (el) =>
          !el.parentElement?.closest(BLOCKS) &&
          !el.closest("pre") &&
          el.innerText.trim() !== "",
      );
  }

  #collect(): Chunk[] {
    const chunks: Chunk[] = [];
    const title = document.querySelector("h1")?.innerText.trim();
    if (title) {
      for (const text of split(title)) chunks.push({ text, block: null });
    }
    for (const block of this.#findBlocks()) {
      for (const text of split(block.innerText.trim())) {
        if (text) chunks.push({ text, block });
      }
    }
    return chunks;
  }

  #speak() {
    this.#halt();
    const run = this.#run;
    const chunk = this.#chunks[this.#index];
    if (!chunk) {
      this.#stop();
      return;
    }
    this.#highlight(chunk.block);
    this.#progress(this.#index / Math.max(this.#chunks.length, 1));
    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.lang = this.dataset.lang || document.documentElement.lang;
    const voice = pickVoice(utterance.lang);
    if (voice) utterance.voice = voice;
    utterance.rate = RATES[this.#rate] ?? 1;
    utterance.onend = () => {
      if (run !== this.#run) return;
      this.#index++;
      this.#speak();
    };
    utterance.onerror = (event) => {
      if (run !== this.#run) return;
      if (event.error === "interrupted" || event.error === "canceled") return;
      // Not allowed (no user gesture yet): back to the start; anything else: skip the chunk.
      if (event.error === "not-allowed") {
        this.#stop();
        return;
      }
      this.#index++;
      this.#speak();
    };
    speechSynthesis.speak(utterance);
  }

  /* ---------- Shared ---------- */

  #highlight(block: HTMLElement | null) {
    if (block === this.#current) return;
    this.#current?.classList.remove(READING);
    this.#current = block;
    if (!block) return;
    block.classList.add(READING);
    const clearance =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--nav-clearance",
        ),
      ) || 104;
    const box = block.getBoundingClientRect();
    if (box.top < clearance || box.bottom > window.innerHeight) {
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      block.scrollIntoView({
        block: "center",
        behavior: still ? "auto" : "smooth",
      });
    }
  }

  /** The progress line, from 0 to 1. */
  #progress(share: number) {
    const done = Math.round(Math.min(Math.max(share, 0), 1) * 100);
    this.#main?.style.setProperty("--listen-progress", `${done}%`);
  }

  #render() {
    const playing = this.#state === "playing";
    const active = this.#state !== "idle";
    this.classList.toggle("is-active", active);
    const show = (selector: string, visible: boolean) => {
      const el = this.querySelector<HTMLElement>(selector);
      if (el) el.hidden = !visible;
    };
    show(".listen-play", !playing);
    show(".listen-pause", playing);
    show(".listen-stop", active);
    show(".listen-speed", active);
    show(".listen-time", active && Boolean(this.#audio));
    const label = this.querySelector(".listen-label");
    if (label) {
      label.textContent =
        (playing
          ? this.dataset.pause
          : this.#state === "paused"
            ? this.dataset.resume
            : this.dataset.label) ?? "";
    }
  }
}

if (!customElements.get("listen-button")) {
  customElements.define("listen-button", ListenButton);
}
