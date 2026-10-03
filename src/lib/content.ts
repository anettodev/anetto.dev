import { getCollection, type CollectionEntry } from "astro:content";

import { DEFAULT_LOCALE, type Locale } from "../i18n/locales";
import { markPlaceholders } from "./placeholders";

type PageEntry = CollectionEntry<"pages">;
export type PageKey = PageEntry["data"]["page"];
export type PageData<P extends PageKey> = Extract<
  PageEntry["data"],
  { page: P }
>;

/**
 * Locales to try, in order. Pages fall back to English until their
 * translation exists (Phase 5); `lang` on the result says which one was used
 * so the page can mark fallback content with the right `lang` attribute.
 */
function candidates(locale: Locale): Locale[] {
  return locale === DEFAULT_LOCALE ? [locale] : [locale, DEFAULT_LOCALE];
}

function bodyHtml(entry: { rendered?: { html: string } }): string {
  return markPlaceholders(entry.rendered?.html ?? "");
}

export async function getPage<P extends PageKey>(locale: Locale, page: P) {
  // getCollection rather than getEntry: getEntry logs a warning for every missing translation.
  const entries = await getCollection(
    "pages",
    ({ data }) => data.page === page,
  );
  for (const lang of candidates(locale)) {
    const entry = entries.find(({ id }) => id === `${lang}/${page}`);
    if (entry) {
      return {
        data: entry.data as PageData<P>,
        html: bodyHtml(entry),
        lang,
      };
    }
  }
  throw new Error(`Missing page copy: ${DEFAULT_LOCALE}/${page}.md`);
}

/** Inter roles in `lang`, newest first. */
export async function getRoles(lang: Locale) {
  const entries = await getCollection("roles", ({ id }) =>
    id.startsWith(`${lang}/`),
  );
  return entries
    .sort((a, b) => a.data.order - b.data.order)
    .map((entry) => ({ id: entry.id, ...entry.data, html: bodyHtml(entry) }));
}

export type Role = Awaited<ReturnType<typeof getRoles>>[number];

export async function getProjects(lang: Locale) {
  const entries = await getCollection("projects", ({ id }) =>
    id.startsWith(`${lang}/`),
  );
  return entries
    .sort((a, b) => a.data.order - b.data.order)
    .map((entry) => ({ id: entry.id, ...entry.data }));
}

export type Project = Awaited<ReturnType<typeof getProjects>>[number];
