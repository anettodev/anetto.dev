import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import evernote from "../data/evernote.json";
import { localizedPath } from "../i18n";
import { DEFAULT_LOCALE } from "../i18n/locales";
import { PERSON } from "./site";

/*
 * The notes' RSS feed (requested by Antonio): every Evernote note on the
 * site, newest first, with its title, page, first date, summary and tags.
 * The full text stays on the page (its images only resolve at page build).
 * One feed in the site's default locale, served at /rss.xml and at the Hugo
 * feed's address, /index.xml, so readers subscribed there get the notes.
 */
export const FEED_PATH = "/rss.xml";
export const FEED_TITLE = `${PERSON.name} · Notes`;
const FEED_DESCRIPTION = `Notes by ${PERSON.name} on anetto.dev.`;

/** What the feed reads from a note. Typed explicitly: an empty snapshot types as never[]. */
interface FeedNote {
  slug: string;
  title: string;
  created: string | null;
  updated: string | null;
  tags: string[];
  excerpt: string;
}

/** The feed, for the address it's served at (its atom:link self). */
export function notesFeed(context: APIContext, path: string) {
  const site = context.site ?? new URL("https://anetto.dev");
  const dateOf = (note: FeedNote) => note.created ?? note.updated ?? "";
  const notes = [...(evernote as { notes: FeedNote[] }).notes].sort((a, b) =>
    dateOf(b).localeCompare(dateOf(a)),
  );
  return rss({
    title: FEED_TITLE,
    description: FEED_DESCRIPTION,
    site,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: [
      "<language>en</language>",
      `<atom:link href="${new URL(path, site)}" rel="self" type="application/rss+xml"/>`,
    ].join(""),
    items: notes.map((note) => ({
      title: note.title,
      link: localizedPath(DEFAULT_LOCALE, "blog", note.slug),
      ...(dateOf(note) && { pubDate: new Date(dateOf(note)) }),
      description: note.excerpt,
      categories: note.tags,
    })),
  });
}
