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

/** A route's path, or a page under it (`subpath`, e.g. a note's slug under `blog`). */
const pathOf = (route: RouteKey, subpath?: string): string =>
  subpath ? `${ROUTES[route]}/${subpath}` : ROUTES[route];

export function localizedPath(
  locale: Locale,
  route: RouteKey,
  subpath?: string,
): string {
  return getRelativeLocaleUrl(locale, pathOf(route, subpath));
}

export function localizedUrl(
  locale: Locale,
  route: RouteKey,
  subpath?: string,
): string {
  return getAbsoluteLocaleUrl(locale, pathOf(route, subpath));
}
