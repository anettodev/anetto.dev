/** Locale-independent page paths, without leading or trailing slashes. */
export const ROUTES = {
  home: "",
  about: "about",
  experiences: "experiences",
  projects: "projects",
  blog: "blog",
  ai: "ai",
  bookmarks: "bookmarks",
} as const;

export type RouteKey = keyof typeof ROUTES;
