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
  };
  status: Record<ProjectStatus, string>;
  /** Home intro card (§8.1): the line typed under the logo. */
  intro: { loading: string };
  screenPlaceholder: string;
  devOnly: string;
  notFound: { title: string; body: string; home: string };
}
