import { INTRO_REVEAL_EVENT } from "./prefs";

/*
 * Feature cards enter as they scroll into view (spec §8.6): the transition
 * lives in FeatureCard.astro; this only adds `.is-in`. On Home's first visit
 * the cards wait until the intro reveals the page.
 */
function observe() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  for (const card of document.querySelectorAll(".feature-card")) {
    observer.observe(card);
  }
}

if (document.documentElement.dataset.intro === "play") {
  document.addEventListener(INTRO_REVEAL_EVENT, observe, { once: true });
} else {
  observe();
}
