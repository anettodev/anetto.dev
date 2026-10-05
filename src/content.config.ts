import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

import { ROUTES } from "./i18n/routes";
import { PROJECT_STATUSES } from "./lib/status";

// Content lives in one folder per locale, e.g. `pages/en/about.md` → id `en/about`.

const routeKey = z.enum(
  Object.keys(ROUTES) as [keyof typeof ROUTES, ...(keyof typeof ROUTES)[]],
);

const link = z.object({ label: z.string(), href: z.url() });

const home = z.object({
  page: z.literal("home"),
  description: z.string(),
  /**
   * Home's headline, one clause per item, the first in full color. Today
   * it's only a greeting with the name (Antonio's change to spec §2).
   */
  positioning: z.array(z.string()).min(1),
  lanes: z
    .array(
      z.object({
        number: z.string(),
        label: z.string(),
        title: z.string(),
        text: z.string(),
        route: routeKey,
        linkLabel: z.string(),
      }),
    )
    .length(3),
  /**
   * Home's section links: the latest companies, linking to Experiences, and
   * Tech Stack, linking to About (its title is the shared `tech.title`).
   */
  previews: z.object({
    experiences: z.object({ title: z.string(), linkLabel: z.string() }),
    tech: z.object({ linkLabel: z.string() }),
  }),
});

const about = z.object({
  page: z.literal("about"),
  description: z.string(),
  label: z.string(),
  title: z.string(),
  facts: z.array(z.object({ label: z.string(), value: z.string() })),
  /**
   * "Outside work", always last (spec §2 makes it one line; a photo and two
   * short paragraphs at the owner's request). "{br}" in the text is the
   * Brazilian flag (an SVG, never emoji: spec §9); "[label](href)" is a
   * link. `photo` is added in the
   * schema below, where image() exists.
   */
  personal: z.object({
    title: z.string(),
    text: z.array(z.string()).min(1),
    alt: z.string(),
  }),
});

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

/* "Before that" on Experiences: an earlier job, its years from `start` and `end`. */
const row = z.object({
  name: z.string(),
  detail: z.string(),
  start: month,
  end: month,
});

/*
 * A figure on Experiences: `since` (YYYY-MM) shows the whole years from
 * then to the build, as "18+"; otherwise `value`, as written. In `label`
 * and `pills`, "{apple}" stands for the Apple mark.
 */
const figure = z
  .object({
    since: month.optional(),
    value: z.string().optional(),
    label: z.string(),
    /** Small pills under the label, e.g. "Obj-C → Swift". */
    pills: z.array(z.string()).max(3).default([]),
  })
  .refine((f) => f.since || f.value, "A figure needs `since` or `value`.");

const experiences = z.object({
  page: z.literal("experiences"),
  description: z.string(),
  label: z.string(),
  title: z.string(),
  lead: z.string(),
  /* At a glance, between the header and the timeline (up to three). */
  figures: z.array(figure).max(3).default([]),
  before: z.object({
    title: z.string(),
    lead: z.string(),
    rows: z.array(row),
  }),
  resumeLink: z.string(),
  linkedinLink: z.string(),
});

const projects = z.object({
  page: z.literal("projects"),
  description: z.string(),
  label: z.string(),
  title: z.string(),
  lead: z.string(),
  /** Dashed entry shown in dev builds only (spec §5.4). */
  devPlaceholder: z.string(),
});

/* A post card (components/PostCards.astro); `cover` is added in the schema below, where `image()` exists. */
const post = z.object({
  title: z.string(),
  source: z.string(),
  year: z.string(),
  href: z.url().optional(),
  /** One or two lines; the card clamps to two. */
  description: z.string().optional(),
  /** Shown as pills; three at most. */
  tags: z.array(z.string()).max(3).default([]),
});

const blog = z.object({
  page: z.literal("blog"),
  description: z.string(),
  label: z.string(),
  title: z.string(),
  lead: z.string(),
  /** Posts without `href` are placeholders: their cards have no link. */
  posts: z.array(post),
});

const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.md" }),
  schema: ({ image }) =>
    z.discriminatedUnion("page", [
      home,
      about.extend({
        personal: about.shape.personal.extend({ photo: image() }),
      }),
      experiences,
      projects,
      blog.extend({
        /** Landscape cover (16:10); the card shows a placeholder until supplied. */
        posts: z.array(post.extend({ cover: image().optional() })),
      }),
    ]),
});

const projectEntries = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.md" }),
  schema: ({ image }) =>
    z.object({
      order: z.number().int(),
      title: z.string(),
      status: z.enum(PROJECT_STATUSES),
      /** Also shown in the Projects page's "Pinned" carousel. */
      pinned: z.boolean().default(false),
      /** Shown in full in the source, clamped to three lines on the card. */
      description: z.string(),
      /** Shown as pills; five at most. */
      stack: z.array(z.string()).max(5),
      /** The card's buttons, in this order; each appears only when set. */
      links: z
        .object({
          appStore: z.url(),
          demo: z.url(),
          source: z.url(),
          website: z.url(),
        })
        .partial()
        .default({}),
      /** Landscape cover (16:10); the card shows a placeholder until supplied (§13.1). */
      cover: image().optional(),
    }),
});

/** YYYY-MM: a month, for timeline dates. */

/*
 * Employers for the Home timeline (requested by Antonio), newest first by
 * `order`. The body is Markdown, shown when the entry is open; it was
 * migrated from the Hugo resume (spec §0.3, §13.2).
 */
const companies = defineCollection({
  loader: glob({ base: "./src/content/companies", pattern: "**/*.md" }),
  schema: ({ image }) =>
    z.object({
      order: z.number().int(),
      company: z.string(),
      /** The latest role held there, shown under the name. */
      title: z.string(),
      logo: image(),
      start: month,
      /** Absent while current. */
      end: month.optional(),
      url: z.url().optional(),
      /** Extra links shown with the website at the end, e.g. an app. */
      links: z.array(link).default([]),
      /**
       * Dates per position, matched to the body's `####` headings by title,
       * for the length pill beside each. Missing dates show a placeholder;
       * a company with one position uses its own dates.
       */
      positions: z
        .array(
          z.object({
            title: z.string(),
            start: month.optional(),
            end: month.optional(),
            current: z.boolean().default(false),
          }),
        )
        .default([]),
    }),
});

export const collections = {
  pages,
  projects: projectEntries,
  companies,
};
