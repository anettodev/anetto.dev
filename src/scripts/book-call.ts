/*
 * "Book a call" (the identity card): opens Calendly's scheduling popup over
 * the page. Calendly's widget script and stylesheet load on the first click,
 * not with the page, so visitors who never ask for it never contact Calendly
 * and the page carries none of its weight. A modified click (new tab, etc.)
 * is left alone, and if the script can't load, the link's own behaviour
 * (Calendly's page in a new tab) takes over.
 */
declare global {
  interface Window {
    Calendly?: { initPopupWidget(options: { url: string }): void };
  }
}

const ASSETS = "https://assets.calendly.com/assets/external";
let loading: Promise<void> | null = null;

function loadCalendly(): Promise<void> {
  if (window.Calendly) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = `${ASSETS}/widget.css`;
    document.head.append(style);

    const script = document.createElement("script");
    script.src = `${ASSETS}/widget.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Calendly failed to load"));
    };
    document.head.append(script);
  });
  return loading;
}

document.addEventListener("click", (event) => {
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
    "a[data-calendly]",
  );
  if (
    !link ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  event.preventDefault();
  link.setAttribute("aria-busy", "true");
  loadCalendly()
    .then(() => window.Calendly?.initPopupWidget({ url: link.href }))
    .catch(() => window.open(link.href, "_blank", "noopener"))
    .finally(() => link.removeAttribute("aria-busy"));
});

export {};
