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
  /** Spec §2 sentence, one clause per item; the first renders in full color. */
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
  previews: z.object({
    experiences: z.object({ title: z.string(), linkLabel: z.string() }),
    projects: z.object({ title: z.string(), linkLabel: z.string() }),
    blog: z.object({ title: z.string(), linkLabel: z.string() }),
  }),
});

const about = z.object({
  page: z.literal("about"),
  description: z.string(),
  label: z.string(),
  title: z.string(),
  facts: z.array(z.object({ label: z.string(), value: z.string() })),
  /** Personal line, always last (spec §2). */
  personal: z.string(),
  experiencesLink: z.string(),
  resumeLink: z.string(),
});

const row = z.object({ name: z.string(), detail: z.string() });

const experiences = z.object({
  page: z.literal("experiences"),
  description: z.string(),
  label: z.string(),
  title: z.string(),
  lead: z.string(),
  before: z.object({
    title: z.string(),
    lead: z.string(),
    rows: z.array(row),
    education: row,
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

const blog = z.object({
  page: z.literal("blog"),
  description: z.string(),
  label: z.string(),
  title: z.string(),
  /** Posts without `href` are placeholders and render as plain rows. */
  posts: z.array(
    z.object({
      title: z.string(),
      source: z.string(),
      year: z.string(),
      href: z.url().optional(),
    }),
  ),
  more: z.array(link),
});

const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.md" }),
  schema: z.discriminatedUnion("page", [
    home,
    about,
    experiences,
    projects,
    blog,
  ]),
});

/** Inter roles, newest first by `order` (spec §5.4 Experiences). Body = 1–2 sentences. */
const roles = defineCollection({
  loader: glob({ base: "./src/content/roles", pattern: "**/*.md" }),
  schema: z.object({
    order: z.number().int(),
    label: z.string(),
    dates: z.string(),
    title: z.string(),
  }),
});

const projectEntries = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.md" }),
  schema: ({ image }) =>
    z.object({
      order: z.number().int(),
      title: z.string(),
      status: z.enum(PROJECT_STATUSES),
      description: z.string(),
      stack: z.array(z.string()),
      link: link.optional(),
      /** Device screenshot; the slot shows a placeholder until supplied (§13.1). */
      screen: image().optional(),
    }),
});

export const collections = { pages, roles, projects: projectEntries };
