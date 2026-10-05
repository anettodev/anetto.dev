import type { ProjectStatus } from "../lib/status";
import type { RouteKey } from "./routes";

export interface UIStrings {
  siteName: string;
  skipToContent: string;
  navLabel: string;
  nav: Record<RouteKey, string>;
  /** Accessible names for the island's menu button. */
  menu: { open: string; close: string };
  /** Accessible name for the theme toggle; says what pressing it does. */
  theme: { toLight: string; toDark: string };
  /** Accessible name for the language pill, e.g. "Language: English". */
  languageLabel: string;
  card: {
    /** Stays in English in every locale until confirmed (spec §9, §14 #6). */
    role: string;
    /** The word before the company name: "at Inter". */
    at: string;
    profilesLabel: string;
    portraitAlt: string;
    /** The card's footer button, and its accessible name (which names Calendly). */
    bookCall: string;
    bookCallLabel: string;
  };
  status: Record<ProjectStatus, string>;
  /** Home intro card (§8.1): the line typed under the logo. */
  intro: { loading: string };
  /**
   * GitHub Activity (components/GitHubActivity.astro). Plural messages are
   * picked with Intl.PluralRules; {n} is the count, {date} a formatted date.
   */
  github: {
    title: string;
    profileLink: string;
    total: { one: string; other: string };
    day: { zero: string; one: string; other: string };
    calendarLabel: string;
    top: string;
    topToggle: string;
    commits: { one: string; other: string };
    updated: string;
  };
  /**
   * AI usage (components/AiUsage.astro and the /ai page), from the tokscale
   * snapshot. {n} is a count, {date} a date, {amount} money; the tooltip's
   * {note} is the day's cost.
   */
  ai: {
    title: string;
    page: { label: string; title: string; lead: string; description: string };
    cost: { label: string; detail: string };
    tokens: { label: string; detail: string };
    cache: { label: string; detail: string };
    day: { zero: string; one: string; other: string };
    calendarLabel: string;
    /**
     * The card's chart switch (heatmap or usage over time) and the trend
     * chart's span buttons (7…360 "days") and texts. In `trendLabel`, {n} is
     * the span's days and {start} and {end} are dates.
     */
    chart: {
      label: string;
      heatmap: string;
      trend: string;
      heatmapCaption: string;
      rangeLabel: string;
      days: string;
      trendLabel: string;
      daily: string;
      weekly: string;
      total: string;
      empty: string;
    };
    since: string;
    synced: string;
    models: { title: string; caption: string; other: string };
    /**
     * The Agents panel (Claude Code's subagents): its title and caption,
     * column heads, the empty line, and "Updated {date}" for the local data.
     */
    agents: {
      title: string;
      caption: string;
      agent: string;
      source: string;
      messages: string;
      none: string;
      updated: string;
    };
    clients: {
      title: string;
      tool: string;
      cost: string;
      tokens: string;
      share: string;
      /**
       * The arrows' window, "Last [7] days": the words around the day
       * picker, and the picker's accessible name.
       */
      window: { before: string; after: string; label: string };
      /** A share change in percentage points, e.g. "40.1 pp". */
      points: string;
      /** The arrow's text (hover, screen readers): {n} points against the previous {days} days. */
      trend: { up: string; down: string };
    };
    costNote: string;
    via: string;
    empty: string;
  };
  /** Pagination (Pager.astro): the nav's name, its buttons, and each page's name ({n}). */
  pager: { label: string; prev: string; next: string; page: string };
  /** The Blog page's list tools: search, source chips, pages. */
  blogPage: {
    /** The search field (titles, summaries and tags). */
    search: { label: string; placeholder: string };
    noMatch: string;
    /** The per-page picker's accessible name. */
    perPage: string;
    /** The source chips' group name. */
    sourceFilter: string;
  };
  /** Projects page sections: the pinned carousel and the paged grid of all projects. */
  projectsPage: {
    pinned: string;
    all: string;
    carousel: string;
    prev: string;
    next: string;
    /** The dots' group. */
    dots: string;
    /** A dot's label; {title} is the project at that stop. */
    show: string;
    /** The section headings' totals, as screen readers hear them. */
    count: { one: string; other: string };
    /** All projects' search field (titles and descriptions). */
    search: { label: string; placeholder: string };
    noMatch: string;
    /** The per-page picker's accessible name. */
    perPage: string;
    /** The status chips' group name. */
    statusFilter: string;
    /** The stack picker: its visible word and accessible name. */
    stack: string;
    stackFilter: string;
  };
  /** Shared by the filtered, paged lists (Bookmarks, All projects). */
  list: {
    /** The "every item" chip or option. */
    all: string;
    /** "Showing 1–10 of 13"; {from}, {to} and {total} are counts. */
    results: string;
    /** The per-page picker's words, "Show [10] per page". */
    perPage: { before: string; after: string };
    /**
     * The sort toggle: the group's name, its buttons, and how each
     * direction is spoken ("Sort by date, newest first").
     */
    sort: {
      label: string;
      date: string;
      title: string;
      newest: string;
      oldest: string;
      az: string;
      za: string;
      spoken: string;
    };
  };
  /**
   * Bookmarks page (public Raindrop collections). {n} is a count, {date} a
   * date.
   */
  bookmarks: {
    label: string;
    title: string;
    lead: string;
    description: string;
    filterLabel: string;
    updated: string;
    viewOnRaindrop: string;
    /** Before the first refresh (a [PLACEHOLDER]). */
    empty: string;
    /** After a refresh that found no public bookmarks. */
    none: string;
    /** The search field (titles and descriptions). */
    search: { label: string; placeholder: string };
    noMatch: string;
    /** The per-page picker's accessible name. */
    perPage: string;
  };
  /**
   * The TL;DR button (Experiences): opens an AI assistant with a prompt to
   * read and summarize the page. {provider} is the assistant's name, {url}
   * the page's public address.
   */
  tldr: {
    label: string;
    /** Added for screen readers and as the tooltip. */
    hint: string;
    /** The arrow's name and the menu's title. */
    choose: string;
    menuTitle: string;
    /**
     * The prompt's frame: {url} the page, {context} what the page is,
     * {summary} the first step; both come from `pages`, per page type.
     */
    prompt: string;
    pages: Record<
      "experiences" | "about" | "ai" | "post",
      { context: string; summary: string }
    >;
  };
  /** The Apple Music player under the identity card: its title, its frame's name, the no-JS link and the placeholder. */
  music: {
    heading: string;
    title: string;
    listen: string;
    placeholder: string;
  };
  /** Tech Stack (Home and About): the heading, and the placeholder until there's a list. */
  tech: {
    title: string;
    empty: string;
    /** The heading's total, as screen readers hear it; {n} is the count. */
    count: { one: string; other: string };
  };
  /** Home experience timeline: the end of a current job's dates. */
  experience: {
    present: string;
    /** The link after the timeline to the Experiences page; {n} entries not shown. */
    more: { one: string; other: string };
    /** Hidden heading over the full timeline on the Experiences page. */
    timeline: string;
    /** Placeholder pills for a position without dates, or a current one without a start. */
    unknownLength: string;
    unknownStart: string;
  };
  /** Post cards: the link to the full post. */
  /**
   * Writing: the card link, and a note page's label, its link back to the
   * Blog and its date line ({date} is formatted).
   */
  post: { readMore: string; note: string; back: string; updated: string };
  /** Project cards: buttons, the stack list's name and the cover placeholder word. */
  project: {
    appStore: string;
    demo: string;
    source: string;
    website: string;
    stack: string;
    cover: string;
  };
  devOnly: string;
  notFound: { title: string; body: string; home: string };
}
