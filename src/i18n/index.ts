import { getAbsoluteLocaleUrl, getRelativeLocaleUrl } from "astro:i18n";

import en from "./en";
import es from "./es";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./locales";
import pt from "./pt";
import { ROUTES, type RouteKey } from "./routes";
import type { UIStrings } from "./types";

const UI: Record<Locale, UIStrings> = { en, pt, es };

export function t(locale: Locale): UIStrings {
  return UI[locale];
}

/** `getStaticPaths` for pages under `src/pages/[...lang]/`; the default locale has no prefix. */
export function localeStaticPaths() {
  return LOCALES.map((locale) => ({
    params: { lang: locale === DEFAULT_LOCALE ? undefined : locale },
    props: { locale },
  }));
}

export function localizedPath(locale: Locale, route: RouteKey): string {
  return getRelativeLocaleUrl(locale, ROUTES[route]);
}

export function localizedUrl(locale: Locale, route: RouteKey): string {
  return getAbsoluteLocaleUrl(locale, ROUTES[route]);
}
